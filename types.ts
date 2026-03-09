

/**
 * 用户角色枚举
 */
export enum UserRole {
  Admin = 'admin',
  Technician = 'technician',
}

/**
 * 用户接口
 */
export interface User {
  id: number;
  name: string;
  role: UserRole;
}

/**
 * 监测指标类型枚举
 */
export enum MetricType {
  Temperature = 'Temperature',
  Humidity = 'Humidity',
  Ammonia = 'Ammonia',
  Light = 'Light',
}

/**
 * 设备接口
 */
export interface Device {
  id: string;
  pigstyId: number;
  type: MetricType;
  isActive: boolean;
}

/**
 * 传感器读数接口
 */
export interface SensorReading {
  timestamp: number;
  temperature: number | null;
  humidity: number | null;
  ammonia: number | null;
  light: number | null;
}

/**
 * 告警级别枚举
 */
export enum AlertLevel {
  Warning = 'Warning',
  Danger = 'Danger',
}

/**
 * 告警接口
 */
export interface Alert {
  id: string;
  timestamp: number;
  pigstyId: number;
  pigstyName: string;
  metric: MetricType;
  value: number;
  level: AlertLevel;
  message: string;
}

/**
 * 阈值配置接口
 */
export interface ThresholdConfig {
  warn_low?: number;
  warn_high: number;
  danger_low?: number;
  danger_high: number;
}

/**
 * 猪舍接口
 */
export interface Pigsty {
  id: number;
  name: string;
  location?: string;
  capacity: number;
  technicianId?: number | null;

  tempThresholdHigh?: number;
  tempThresholdLow?: number;
  humidityThresholdHigh?: number;
  humidityThresholdLow?: number;
  ammoniaThresholdHigh?: number;
  lightThresholdHigh?: number;
  lightThresholdLow?: number;
}