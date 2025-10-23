

export enum UserRole {
  Admin = 'admin',
  Technician = 'technician',
}

export interface User {
  id: number;
  name: string;
  role: UserRole.Technician;
}

export enum MetricType {
  Temperature = 'Temperature',
  Humidity = 'Humidity',
  Ammonia = 'Ammonia',
  Light = 'Light',
}

export interface Device {
  id: string;
  pigstyId: number;
  type: MetricType;
  isActive: boolean;
}

export interface SensorReading {
  timestamp: number;
  temperature: number | null;
  humidity: number | null;
  ammonia: number | null;
  light: number | null;
}

export enum AlertLevel {
  Warning = 'Warning',
  Danger = 'Danger',
}

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

export interface ThresholdConfig {
  warn_low?: number;
  warn_high: number;
  danger_low?: number;
  danger_high: number;
}

export interface Pigsty {
  id: number;
  name: string;
  type: string;
  capacity: number;
  technicianId: number | null;
  readings: SensorReading[];
  thresholds?: {
    [key in MetricType]?: Partial<ThresholdConfig>;
  };
}