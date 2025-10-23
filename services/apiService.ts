// This file mocks a backend API.
// In a real application, these functions would make network requests (e.g., using fetch).

import { User, Pigsty, Device, Alert, MetricType } from '../types';
import { INITIAL_USERS, INITIAL_PIGSTIES_DATA, INITIAL_DEVICES } from '../constants';

// --- Mock Database ---
let users: User[] = JSON.parse(JSON.stringify(INITIAL_USERS));
let devices: Device[] = JSON.parse(JSON.stringify(INITIAL_DEVICES));
let pigsties: Pigsty[] = JSON.parse(JSON.stringify(INITIAL_PIGSTIES_DATA)).map((p: Omit<Pigsty, 'readings'>) => ({ ...p, readings: generateInitialReadings(300) }));
let alerts: Alert[] = [];

function generateInitialReadings(count: number) {
  const readings = [];
  let timestamp = Date.now() - count * 5000;
  for (let i = 0; i < count; i++) {
    readings.push({
      timestamp,
      temperature: 22 + (Math.random() - 0.5) * 4,
      humidity: 65 + (Math.random() - 0.5) * 10,
      ammonia: 10 + (Math.random() - 0.5) * 8,
      light: 120 + (Math.random() - 0.5) * 40,
    });
    timestamp += 5000;
  }
  return readings;
};

// This function would be on the backend, triggered by a scheduler
const simulateData = () => {
    pigsties = pigsties.map(pigsty => {
        const lastReading = pigsty.readings[pigsty.readings.length - 1];
        const activeDevices = devices.filter(d => d.pigstyId === pigsty.id && d.isActive);
        const newReading = {
            timestamp: Date.now(),
            temperature: activeDevices.some(d => d.type === MetricType.Temperature) ? (lastReading.temperature || 22) + (Math.random() - 0.5) * 0.5 : null,
            humidity: activeDevices.some(d => d.type === MetricType.Humidity) ? (lastReading.humidity || 65) + (Math.random() - 0.5) * 2 : null,
            ammonia: activeDevices.some(d => d.type === MetricType.Ammonia) ? (lastReading.ammonia || 10) + (Math.random() - 0.45) * 1 : null,
            light: activeDevices.some(d => d.type === MetricType.Light) ? (lastReading.light || 120) + (Math.random() - 0.5) * 40 : null,
        };
        const newReadings = [...pigsty.readings.slice(-299), newReading];
        return { ...pigsty, readings: newReadings };
    });
};

setInterval(simulateData, 5000);


// --- Mock API Endpoints ---

const mockApi = <T>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(data), 300));

export const getInitialData = () => mockApi({ users, pigsties, devices, alerts });
export const getUpdates = () => mockApi({ pigsties, alerts });

// Users
export const addUser = async (userData: { name: string }): Promise<User> => {
    const newUser: User = { ...userData, id: Date.now(), role: 'technician' as any };
    users.push(newUser);
    return mockApi(newUser);
};
export const updateUser = async (id: number, userData: { name: string }): Promise<User> => {
    let updatedUser: User | undefined;
    users = users.map(u => {
        if (u.id === id) {
            updatedUser = { ...u, ...userData };
            return updatedUser;
        }
        return u;
    });
    if (!updatedUser) throw new Error("User not found");
    return mockApi(updatedUser);
};
export const deleteUser = async (id: number): Promise<{ success: boolean }> => {
    users = users.filter(u => u.id !== id);
    return mockApi({ success: true });
};

// Pigsties
export const addPigsty = async (pigstyData: Omit<Pigsty, 'id' | 'readings'>): Promise<Pigsty> => {
    const newPigsty: Pigsty = { ...pigstyData, id: Date.now(), readings: generateInitialReadings(300) };
    pigsties.push(newPigsty);
    return mockApi(newPigsty);
};
export const updatePigsty = async (pigstyData: Pigsty): Promise<Pigsty> => {
    let updatedPigsty: Pigsty | undefined;
    pigsties = pigsties.map(p => {
        if (p.id === pigstyData.id) {
            updatedPigsty = { ...p, ...pigstyData };
            return updatedPigsty;
        }
        return p;
    });
    if (!updatedPigsty) throw new Error("Pigsty not found");
    return mockApi(updatedPigsty);
};
export const deletePigsty = async (id: number): Promise<{ success: boolean }> => {
    pigsties = pigsties.filter(p => p.id !== id);
    devices = devices.filter(d => d.pigstyId !== id); // Cascade delete
    return mockApi({ success: true });
};
export const updatePigstyThresholds = async (pigstyId: number, thresholds: Pigsty['thresholds']): Promise<Pigsty> => {
    const pigsty = pigsties.find(p => p.id === pigstyId);
    if (!pigsty) throw new Error("Pigsty not found");
    pigsty.thresholds = thresholds;
    return mockApi(pigsty);
};


// Devices
export const addDevice = async (deviceData: { pigstyId: number, type: MetricType }): Promise<Device> => {
    const newDevice: Device = { ...deviceData, id: `${deviceData.pigstyId}-${deviceData.type}-${Date.now()}`, isActive: true };
    devices.push(newDevice);
    return mockApi(newDevice);
};
export const toggleDeviceStatus = async (id: string): Promise<Device> => {
    let updatedDevice: Device | undefined;
    devices = devices.map(d => {
        if (d.id === id) {
            updatedDevice = { ...d, isActive: !d.isActive };
            return updatedDevice;
        }
        return d;
    });
    if (!updatedDevice) throw new Error("Device not found");
    return mockApi(updatedDevice);
};

// Alerts
export const getFilteredAlerts = async (startDate?: string, endDate?: string): Promise<Alert[]> => {
    if (!startDate && !endDate) return mockApi(alerts);

    const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    
    const filtered = alerts.filter(alert => alert.timestamp >= startTimestamp && alert.timestamp <= endTimestamp);
    return mockApi(filtered);
};
