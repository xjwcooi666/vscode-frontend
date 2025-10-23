
import React from 'react';
import { MetricType, SensorReading, ThresholdConfig } from '../types';
import { METRIC_CONFIG, THRESHOLDS, METRIC_NAMES } from '../constants';

interface MetricCardProps {
  metric: MetricType;
  reading: SensorReading;
  thresholds?: Partial<ThresholdConfig>;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, reading, thresholds }) => {
  const metricConfig = METRIC_CONFIG[metric];
  const value = reading[metric.toLowerCase() as keyof Omit<SensorReading, 'timestamp'>];
  const metricName = METRIC_NAMES[metric];

  if (value === null) {
     return (
        <div className={`p-4 rounded-lg shadow-inner bg-slate-900/50`}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-400">{metricName}</h3>
             <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400`}>
              未激活
            </span>
          </div>
          <div className="mt-2 text-center">
            <span className={`text-4xl font-bold text-slate-600`}>--</span>
            <span className="text-lg text-slate-500 ml-1">{metricConfig.unit}</span>
          </div>
        </div>
      );
  }

  const getStatus = () => {
    const effectiveThresholds = { ...THRESHOLDS[metric], ...thresholds };
    if ((effectiveThresholds.danger_low && value < effectiveThresholds.danger_low) || (effectiveThresholds.danger_high && value > effectiveThresholds.danger_high)) {
      return { color: 'text-red-400', label: "危险" };
    }
    if ((effectiveThresholds.warn_low && value < effectiveThresholds.warn_low) || (effectiveThresholds.warn_high && value > effectiveThresholds.warn_high)) {
      return { color: 'text-yellow-400', label: "警告" };
    }
    return { color: 'text-green-400', label: "正常" };
  };

  const status = getStatus();

  return (
    <div className={`p-4 rounded-lg shadow-inner bg-slate-900/50`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-400">{metricName}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.color.replace('text-', 'bg-').replace('-400', '-500/20')}`}>
          {status.label}
        </span>
      </div>
      <div className="mt-2 text-center">
        <span className={`text-4xl font-bold ${status.color}`}>{value.toFixed(1)}</span>
        <span className="text-lg text-slate-500 ml-1">{metricConfig.unit}</span>
      </div>
    </div>
  );
};
