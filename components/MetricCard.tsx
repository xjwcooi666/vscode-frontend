import React from 'react';
// 导入类型
import { MetricType, SensorReading, ThresholdConfig } from '../types';
// 导入常量
import { METRIC_CONFIG, THRESHOLDS, METRIC_NAMES } from '../constants';

interface MetricCardProps {
  metric: MetricType | string; // metric prop 的值是 "TEMPERATURE", "HUMIDITY", ...
  reading: any;
  thresholds?: Partial<ThresholdConfig>;
}

// [!!! 最终修复 V5 !!!]
// (这个逻辑现在是正确的，因为它依赖于 constants.tsx 中 *已修复* 的字符串 key)
const getMetricDisplayData = (metricString: string, reading: any) => {
  let dataKey: string;
  let unit: string;
  let name: string;
  let value: number | null = null;

  // 1. 直接用字符串确定 dataKey (后端真实字段名)
  switch (metricString) {
    case "AMMONIA":       dataKey = 'ammoniaLevel'; break;
    case "TEMPERATURE":   dataKey = 'temperature'; break;
    case "HUMIDITY":      dataKey = 'humidity'; break;
    case "LIGHT":         dataKey = 'light'; break;
    default:              dataKey = metricString.toLowerCase();
  }

  // 2. 直接用字符串查找 Name 和 Unit
  //    (现在 constants.tsx 里的 key 是字符串，所以能找到了！)
  name = METRIC_NAMES[metricString as MetricType] || metricString;
  unit = METRIC_CONFIG[metricString as MetricType]?.unit || '?';

  // 3. 安全地获取值 (使用计算出的 dataKey)
  if (reading && reading[dataKey] !== undefined && reading[dataKey] !== null) {
      value = Number(reading[dataKey]);
      if (isNaN(value)) {
          console.error(`Value for ${dataKey} ("${reading[dataKey]}") is not a valid number.`);
          value = null;
      }
  }

  return { unit, name, value };
}


export const MetricCard: React.FC<MetricCardProps> = ({ metric, reading, thresholds }) => {

  const { unit, name, value } = getMetricDisplayData(String(metric), reading);

  // 如果值无效，显示灰色卡片
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

  // --- 状态计算逻辑 ---
  const getStatus = () => {
    // [!!! 关键 !!!] THRESHOLDS 仍然使用 *枚举成员* 作为 key
    // 我们需要将字符串 "TEMPERATURE" 转换回 MetricType.Temperature
    const metricKey = (Object.keys(MetricType) as Array<keyof typeof MetricType>).find(
        key => MetricType[key] === metric
    );
      
    if (!metricKey) return { color: 'text-green-400', label: "正常" }; // 找不到阈值，默认正常

    const effectiveThresholds = {
        high: thresholds?.high ?? THRESHOLDS[metricKey]?.danger_high,
        low: thresholds?.low ?? THRESHOLDS[metricKey]?.danger_low
    };
    if ((effectiveThresholds.low !== undefined && value < effectiveThresholds.low) ||
        (effectiveThresholds.high !== undefined && value > effectiveThresholds.high)) {
      return { color: 'text-yellow-400', label: "警告" };
    }
    return { color: 'text-green-400', label: "正常" };
  };
  const status = getStatus();

  // 正常卡片
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