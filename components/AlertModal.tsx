
import React from 'react';
import { Alert } from '../types';
import { ALERT_LEVEL_CONFIG, METRIC_CONFIG, METRIC_NAMES } from '../constants';

interface AlertModalProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ alert, onClose }) => {
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
             {`警报详情: ${metricName}`}
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
        </div>
        
        <div className="p-4 border-t border-slate-700 text-right">
          <button onClick={onClose} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">关闭</button>
        </div>
      </div>
    </div>
  );
};
