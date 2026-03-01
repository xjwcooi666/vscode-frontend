import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', // 统一基础地址，具体路径由各 API 决定
});

// Token 只从 localStorage 读取；避免强制写兜底 Token 导致携带过期或错误的 JWT
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


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

// 通用分页响应
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
export const getLatestWarnings = async (
  page = 0,
  size = 100,
  acknowledged = false,
  pigstyId?: string | number,
  metricType?: string
): Promise<PageResponse<any>> => {
  const params: any = { page, size, acknowledged };
  if (pigstyId !== undefined && pigstyId !== null && pigstyId !== 'all' && pigstyId !== '') params.pigstyId = pigstyId;
  if (metricType !== undefined && metricType !== null && metricType !== 'all' && metricType !== '') params.metricType = metricType;
  const response = await api.get('/api/warnings/latest', { params });
  const data = response.data;

  // 后端现已返回 Page 对象；做兼容处理以防仍返回数组
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
    };
  }

  return {
    content: data.content ?? [],
    totalElements: data.totalElements ?? (data.content?.length ?? 0),
    totalPages: data.totalPages ?? 1,
    number: data.number ?? page,
    size: data.size ?? size,
  };
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
