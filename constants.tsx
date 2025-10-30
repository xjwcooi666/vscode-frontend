import React from 'react';
// 导入所有类型
import { MetricType, AlertLevel, ThresholdConfig, User, UserRole, Pigsty, Device } from './types';

// [!!! 最终修复 !!!] 
// 将 key 从 [MetricType.Temperature] (值可能是 0) 
// 改为 "TEMPERATURE" (字符串), 以匹配后端 API 和 MetricCard 的查找
export const METRIC_CONFIG: { [key in MetricType | string]: { unit: string; color: string; range: [number, number], getValue: (r: any) => number | null } } = {
  "TEMPERATURE": { unit: '°C', color: 'bg-red-500', range: [18, 28], getValue: r => r?.temperature },
  "HUMIDITY": { unit: '%', color: 'bg-blue-500', range: [50, 80], getValue: r => r?.humidity },
  // [修正!] getValue 使用 ammoniaLevel
  "AMMONIA": { unit: 'ppm', color: 'bg-green-500', range: [0, 25], getValue: r => r?.ammoniaLevel }, 
  "LIGHT": { unit: 'lux', color: 'bg-yellow-500', range: [50, 200], getValue: r => r?.light },
};

// [!!! 最终修复 !!!] Key 也改为字符串
export const METRIC_NAMES: { [key in MetricType | string]: string } = {
  "TEMPERATURE": "温度",
  "HUMIDITY": "湿度",
  "AMMONIA": "氨气",
  "LIGHT": "光照",
};

// 猪舍类型名称 (保持不变)
export const PIGSTY_TYPE_NAMES: { [key: string]: string } = {
  "Farrowing": "产房",
  "Nursery": "保育舍",
  "Finishing": "育肥舍",
};

// 预警级别名称 (保持不变)
export const ALERT_LEVEL_NAMES: { [key in AlertLevel]: string } = {
  [AlertLevel.Warning]: "警告",
  [AlertLevel.Danger]: "危险",
};

// --- 模拟数据 (确保类型正确) ---

export const INITIAL_USERS: User[] = [
  { id: 1, name: 'Admin User', role: UserRole.Admin },
  { id: 2, name: 'Jane Doe', role: UserRole.Technician }, // 假设 'USER' 代表技术员
];

export const INITIAL_PIGSTIES_DATA: Omit<Pigsty, 'readings'>[] = [
  { id: 1, name: '产房 #1', capacity: 10, technicianId: 2, location: '一楼' },
  { id: 2, name: '保育舍 #3', capacity: 50, technicianId: 2, location: '二楼' },
  { id: 3, name: '育肥舍 A', capacity: 100, technicianId: null, location: '三楼西' },
  { id: 4, name: '育肥舍 B', capacity: 100, technicianId: 2, location: '三楼东', tempThresholdHigh: 25 },
];

export const INITIAL_DEVICES: Device[] = INITIAL_PIGSTIES_DATA.flatMap(p =>
  Object.values(MetricType).map(metric => ({
    id: `${p.id}-${metric}`,
    pigstyId: p.id,
    type: metric,
    isActive: true,
  }))
);

// --- 结束模拟数据 ---


// 全局默认阈值 (这个保持不变，getStatus 仍然使用枚举成员)
export const THRESHOLDS: { [key in MetricType]: ThresholdConfig } = {
  [MetricType.Temperature]: { warn_low: 20, danger_low: 18, warn_high: 26, danger_high: 28 },
  [MetricType.Humidity]: { warn_low: 60, danger_low: 50, warn_high: 75, danger_high: 85 },
  [MetricType.Ammonia]: { warn_high: 15, danger_high: 25 },
  [MetricType.Light]: { warn_low: 100, danger_low: 50, warn_high: 150, danger_high: 200 },
};

// 预警级别配置 (保持不变)
export const ALERT_LEVEL_CONFIG: { [key in AlertLevel]: { color: string; icon: React.ReactElement } } = {
  [AlertLevel.Warning]: {
    color: 'bg-yellow-500 text-yellow-300',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  },
  [AlertLevel.Danger]: {
    color: 'bg-red-500 text-red-400',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  },
};