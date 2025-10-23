
import React, { useState, useEffect } from 'react';
import { Alert, SensorReading } from '../types';
import { getAlertAnalysis } from '../services/geminiService';
import { ALERT_LEVEL_CONFIG, METRIC_CONFIG, METRIC_NAMES } from '../constants';

interface AlertModalProps {
  alert: Alert;
  latestReading?: SensorReading;
  onClose: () => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center space-x-2 my-4">
      <div className="w-4 h-4 rounded-full bg-sky-400 animate-bounce" style={{animationDelay: '0s'}}></div>
      <div className="w-4 h-4 rounded-full bg-sky-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
      <div className="w-4 h-4 rounded-full bg-sky-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
  </div>
);

// Basic Markdown to HTML renderer
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};


export const AlertModal: React.FC<AlertModalProps> = ({ alert, latestReading, onClose }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!latestReading) return;
      setIsLoading(true);
      try {
        const result = await getAlertAnalysis(alert, latestReading);
        setAnalysis(result);
      } catch (error) {
        setAnalysis("未能获取分析结果。");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert, latestReading]);
  
  const levelConfig = ALERT_LEVEL_CONFIG[alert.level];
  const metricConfig = METRIC_CONFIG[alert.metric];
  const metricName = METRIC_NAMES[alert.metric];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-sky-400 flex items-center">
             <span className={`mr-3 p-2 rounded-full ${levelConfig.color}`}>
                {React.cloneElement(ALERT_LEVEL_CONFIG[alert.level].icon as React.ReactElement<any>, { className: "h-6 w-6"})}
             </span>
             {`AI分析: ${metricName}警报`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900/50 p-3 rounded-md">
                    <p className="text-slate-400 font-semibold">猪舍</p>
                    <p className="text-slate-200">{alert.pigstyName}</p>
                </div>
                 <div className="bg-slate-900/50 p-3 rounded-md">
                    <p className="text-slate-400 font-semibold">时间戳</p>
                    <p className="text-slate-200">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                 <div className="bg-slate-900/50 p-3 rounded-md">
                    <p className="text-slate-400 font-semibold">指标</p>
                    <p className="text-slate-200">{metricName}</p>
                </div>
                 <div className={`p-3 rounded-md ${levelConfig.color}`}>
                    <p className="font-semibold">检测值</p>
                    <p className="text-2xl font-bold">{alert.value.toFixed(2)} {metricConfig.unit}</p>
                    <p className="text-xs mt-1">{alert.message}</p>
                </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-md">
                <h3 className="font-semibold text-slate-300 mb-2">Gemini分析</h3>
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-p:my-1 prose-strong:text-sky-300 prose-ol:list-decimal prose-ol:pl-5">
                       <MarkdownRenderer text={analysis} />
                    </div>
                )}
            </div>
        </div>
        
        <div className="p-4 border-t border-slate-700 text-right">
          <button onClick={onClose} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">关闭</button>
        </div>
      </div>
    </div>
  );
};
