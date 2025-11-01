import axios from 'axios';

// 1. 创建 Axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
});

// 2. 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加并导出 AddUserRequest 类型
export interface AddUserRequest {
  name: string;
  username: string;
  password: string;
}
// --- 类型定义 ---
// (这些最好放在 types.ts, 但放在这里也能工作)
export enum MetricType {
    TEMPERATURE = 'TEMPERATURE',
    HUMIDITY = 'HUMIDITY',
    AMMONIA = 'AMMONIA',
    LIGHT = 'LIGHT'
}
export interface Device {
  id: number;
  pigstyId: number;
  type: MetricType;
  modelNumber?: string;
  serialNumber?: string;
  active: boolean; // 修正！使用 active
}
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

// --- 3. 登录 / 登出 API ---
export const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', { username, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (err) {
    console.error('Login failed:', err);
    throw err;
  }
};
export const logout = () => {
  localStorage.removeItem('token');
};

// --- 4. 仪表盘 API ---
export const getLatestData = async () => {
  const response = await api.get('/api/data/latest');
  return response.data;
};
export const getLatestWarnings = async () => {
  const response = await api.get('/api/warnings/latest');
  return response.data;
};

// [!!! 新增 !!!] 确认警报 API
export const acknowledgeWarning = async (id: number) => {
  const response = await api.post(`/api/warnings/acknowledge/${id}`);
  return response.data; 
}

// --- 5. 用户管理 (Admin) API ---
export const getAllUsers = async () => { /* ... */ 
  const response = await api.get('/api/admin/users');
  return response.data;
};
export const addUser = async (data: { name: string, username: string, password: string }) => { /* ... */ 
  const response = await api.post('/api/admin/users', data);
  return response.data;
};
export const deleteUser = async (id: number) => { /* ... */ 
  const response = await api.delete(`/api/admin/users/${id}`);
  return response.data;
};

// --- 6. 猪舍管理 (Pigsty) API ---
export const getAllPigsties = async (): Promise<Pigsty[]> => { /* ... */ 
  const response = await api.get('/api/pigsties');
  return response.data;
};
export const addPigsty = async (pigstyData: Omit<Pigsty, 'id'>): Promise<Pigsty> => { /* ... */ 
  const response = await api.post('/api/pigsties', pigstyData);
  return response.data;
};
export const updatePigsty = async (id: number, pigstyData: Pigsty): Promise<Pigsty> => { /* ... */ 
  const response = await api.put(`/api/pigsties/${id}`, pigstyData);
  return response.data;
};
export const deletePigsty = async (id: number) => { /* ... */ 
  const response = await api.delete(`/api/pigsties/${id}`);
  return response.data;
};

// --- 7. 设备管理 (Device) API ---
export const getAllDevices = async (pigstyId?: number): Promise<Device[]> => { /* ... */ 
  const params = pigstyId ? { pigstyId } : {};
  const response = await api.get('/api/devices', { params });
  return response.data;
};
export const addDevice = async (deviceData: Omit<Device, 'id' | 'active'>): Promise<Device> => { /* ... */ 
  const response = await api.post('/api/devices', deviceData);
  return response.data;
};
export const toggleDeviceStatus = async (id: number): Promise<Device> => { /* ... */ 
  const response = await api.post(`/api/devices/${id}/toggle`);
  return response.data;
};
export const deleteDevice = async (id: number) => { /* ... */ 
  const response = await api.delete(`/api/devices/${id}`);
  return response.data;
};

export default api;