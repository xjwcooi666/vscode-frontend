
import React, { useState } from 'react';
import { Pigsty, MetricType, ThresholdConfig } from '../types';
import { THRESHOLDS, METRIC_NAMES } from '../constants';

interface ThresholdModalProps {
  pigsty: Pigsty;
  onSave: (newThresholds: { [key in MetricType]?: Partial<ThresholdConfig> }) => void;
  onClose: () => void;
}

const ThresholdInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
    </div>
);


const MetricThresholdEditor: React.FC<{
    metric: MetricType;
    currentThresholds: Partial<ThresholdConfig>;
    globalThresholds: ThresholdConfig;
    onChange: (metric: MetricType, field: keyof ThresholdConfig, value: string) => void;
}> = ({ metric, currentThresholds, globalThresholds, onChange }) => {
    const isLowOptional = globalThresholds.danger_low === undefined; // e.g., Ammonia
    const metricName = METRIC_NAMES[metric];

    return (
        <div className="bg-slate-900/50 p-4 rounded-md">
            <h4 className="font-semibold text-sky-400 mb-3">{metricName}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {!isLowOptional && (
                    <>
                        <ThresholdInput 
                            label="危险低温"
                            value={currentThresholds.danger_low?.toString() ?? ''}
                            placeholder={globalThresholds.danger_low!.toString()}
                            onChange={e => onChange(metric, 'danger_low', e.target.value)}
                        />
                         <ThresholdInput 
                            label="警告低温"
                            value={currentThresholds.warn_low?.toString() ?? ''}
                            placeholder={globalThresholds.warn_low!.toString()}
                            onChange={e => onChange(metric, 'warn_low', e.target.value)}
                        />
                    </>
                )}
                <ThresholdInput 
                    label="警告高温"
                    value={currentThresholds.warn_high?.toString() ?? ''}
                    placeholder={globalThresholds.warn_high.toString()}
                    onChange={e => onChange(metric, 'warn_high', e.target.value)}
                />
                 <ThresholdInput 
                    label="危险高温"
                    value={currentThresholds.danger_high?.toString() ?? ''}
                    placeholder={globalThresholds.danger_high.toString()}
                    onChange={e => onChange(metric, 'danger_high', e.target.value)}
                />
                 {isLowOptional && <div className="col-span-2"></div>}
            </div>
        </div>
    );
};


export const ThresholdModal: React.FC<ThresholdModalProps> = ({ pigsty, onSave, onClose }) => {
    const [localThresholds, setLocalThresholds] = useState(pigsty.thresholds || {});

    const handleChange = (metric: MetricType, field: keyof ThresholdConfig, value: string) => {
        const numericValue = value === '' ? undefined : parseFloat(value);

        setLocalThresholds(prev => {
            const newMetricThresholds = { ...prev[metric], [field]: numericValue };
            
            (Object.keys(newMetricThresholds) as Array<keyof ThresholdConfig>).forEach(key => {
                if (newMetricThresholds[key] === undefined) {
                    delete newMetricThresholds[key];
                }
            });

            return {
                ...prev,
                [metric]: newMetricThresholds,
            };
        });
    };
    
    const handleSaveClick = () => {
        const cleanedThresholds: { [key in MetricType]?: Partial<ThresholdConfig> } = JSON.parse(JSON.stringify(localThresholds));
        (Object.keys(cleanedThresholds) as MetricType[]).forEach(metricKey => {
            const metricConfig = cleanedThresholds[metricKey];
            if (metricConfig && Object.keys(metricConfig).length === 0) {
                delete cleanedThresholds[metricKey];
            }
        });
        onSave(cleanedThresholds);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-sky-400">{`编辑 ${pigsty.name} 的阈值`}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-sm text-slate-400 mb-4">
                        为此猪舍定义自定义警报阈值。留空则使用全局默认值（显示为占位符）。
                    </p>
                    {Object.values(MetricType).map(metric => (
                        <MetricThresholdEditor 
                            key={metric}
                            metric={metric}
                            currentThresholds={localThresholds[metric] || {}}
                            globalThresholds={THRESHOLDS[metric]}
                            onChange={handleChange}
                        />
                    ))}
                </div>
                
                <div className="p-4 border-t border-slate-700 flex justify-end items-center space-x-4">
                    <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
                    <button onClick={handleSaveClick} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">保存更改</button>
                </div>
            </div>
        </div>
    );
};
