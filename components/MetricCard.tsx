import React from 'react';
// 导入类型
import { MetricType, SensorReading, ThresholdConfig } from '../types';
// 导入常量
import { METRIC_CONFIG, THRESHOLDS, METRIC_NAMES } from '../constants';

interface MetricCardProps {
  metric: MetricType | string; // metric prop 的值是 "TEMPERATURE", "HUMIDITY", ...
  reading: any;
  thresholds?: { high?: number | null, low?: number | null }; // 接收来自 Dashboard 的猪舍特定阈值
}

// 辅助函数 (保持不变)
const getMetricDisplayData = (metricString: string, reading: any) => {
  let dataKey: string;
  let unit: string;
  let name: string;
  let value: number | null = null;

  switch (metricString) {
    case "AMMONIA":       dataKey = 'ammoniaLevel'; break;
    case "TEMPERATURE":   dataKey = 'temperature'; break;
    case "HUMIDITY":      dataKey = 'humidity'; break;
    case "LIGHT":         dataKey = 'light'; break;
    default:              dataKey = metricString.toLowerCase();
  }

  // [!!! 最终修复 V6 !!!] 
  // `METRIC_NAMES` 和 `METRIC_CONFIG` 现在使用字符串 key，可以正确查找到
  name = METRIC_NAMES[metricString as MetricType] || metricString;
  unit = METRIC_CONFIG[metricString as MetricType]?.unit || '?';

  if (reading && reading[dataKey] !== undefined && reading[dataKey] !== null) {
      value = Number(reading[dataKey]);
      if (isNaN(value)) { value = null; }
  }
  return { unit, name, value };
}


export const MetricCard: React.FC<MetricCardProps> = ({ metric, reading, thresholds }) => {

  const { unit, name, value } = getMetricDisplayData(String(metric), reading);

  // 无数据卡片 (保持不变)
  if (value === null) {
      return (
        <div className={`p-4 rounded-lg shadow-inner bg-slate-900/50`}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-400">{name}</h3>
             <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400`}>
               无数据
             </span>
          </div>
          <div className="mt-2 text-center">
            <span className={`text-4xl font-bold text-slate-600`}>--</span>
            <span className="text-lg text-slate-500 ml-1">{unit}</span>
          </div>
        </div>
      );
  }

  // [!!! 最终修复 V6 !!!] 
  // 修复 getStatus 逻辑
  const getStatus = () => {
    const metricKey = String(metric); // 确保是字符串 key, e.g., "TEMPERATURE"
    
    // 1. 获取全局（默认）阈值
    //    (THRESHOLDS 现在使用字符串 key)
    const globalThresholds = THRESHOLDS[metricKey];

    // 2. 获取猪舍特定（UI设置）阈值
    const pigstyThresholds = thresholds; 

    // 3. 检查“危险”级别 (使用全局默认值)
    if (globalThresholds?.danger_low !== undefined && value < globalThresholds.danger_low) {
      return { color: 'text-red-400', label: "危险" };
    }
    if (globalThresholds?.danger_high !== undefined && value > globalThresholds.danger_high) {
      return { color: 'text-red-400', label: "危险" };
    }

    // 4. 检查“警告”级别 (优先使用猪舍设置，如果未设置，则使用全局警告值)
    const warn_low = pigstyThresholds?.low ?? globalThresholds?.warn_low;
    const warn_high = pigstyThresholds?.high ?? globalThresholds?.warn_high;

    if ((warn_low !== undefined && value < warn_low) ||
        (warn_high !== undefined && value > warn_high)) {
      return { color: 'text-yellow-400', label: "警告" };
    }
    
    // 5. 否则为“正常”
    return { color: 'text-green-400', label: "正常" };
  };
  
  const status = getStatus();

  // 正常卡片 (保持不变)
  return (
    <div className={`p-4 rounded-lg shadow-inner bg-slate-900/50`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-400">{name}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.color.replace('text-', 'bg-').replace('-400', '-500/20')}`}> {status.label} </span>
      </div>
      <div className="mt-2 text-center">
        <span className={`text-4xl font-bold ${status.color}`}>{value.toFixed(1)}</span>
        <span className="text-lg text-slate-500 ml-1">{unit}</span>
      </div>
    </div>
  );
};