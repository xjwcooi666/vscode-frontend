import axios from 'axios';

// 1. 创建 Axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
});

// 2. 请求拦截器 (保持不变)
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

// --- 类型定义 (确保与后端一致) ---
// 如果你的 types.ts 里已经有了，可以从那里导入
// 否则，我们在这里定义，方便 api.ts 使用

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
  active: boolean;
}

export interface Pigsty { // 这是后端传回的类型
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
}


// --- 3. 登录 / 登出 API (保持不变) ---

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


// --- 4. 仪表盘 API (保持不变) ---

export const getLatestData = async () => {
  const response = await api.get('/api/data/latest');
  // TODO: 后端返回的环境数据类型需要定义 (EnvironmentalData)
  return response.data;
};

export const getLatestWarnings = async () => {
  const response = await api.get('/api/warnings/latest');
  // TODO: 后端返回的预警数据类型需要定义 (WarningLog)
  return response.data;
};

// --- 5. 用户管理 (Admin) API (保持不变) ---

export const getAllUsers = async () => {
  const response = await api.get('/api/admin/users');
   // TODO: 后端返回的用户数据类型需要定义 (UserDTO)
  return response.data;
};

export const addUser = async (data: { name: string, username: string, password: string }) => {
  const response = await api.post('/api/admin/users', data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/api/admin/users/${id}`);
  return response.data;
};


// --- 6. 猪舍管理 (Pigsty) API (保持不变) ---

export const getAllPigsties = async (): Promise<Pigsty[]> => { // 添加返回类型
  const response = await api.get('/api/pigsties');
  return response.data;
};

export const addPigsty = async (pigstyData: Omit<Pigsty, 'id'>): Promise<Pigsty> => { // 添加类型
  const response = await api.post('/api/pigsties', pigstyData);
  return response.data;
};

export const updatePigsty = async (id: number, pigstyData: Pigsty): Promise<Pigsty> => { // 添加类型
  const response = await api.put(`/api/pigsties/${id}`, pigstyData);
  return response.data;
};

export const deletePigsty = async (id: number) => {
  const response = await api.delete(`/api/pigsties/${id}`);
  return response.data;
};


// --- 7. [!!! 新增 !!!] 设备管理 (Device) API ---

export const getAllDevices = async (pigstyId?: number): Promise<Device[]> => {
  // 任何登录用户都可以获取列表
  const params = pigstyId ? { pigstyId } : {};
  const response = await api.get('/api/devices', { params });
  return response.data;
};

export const addDevice = async (deviceData: Omit<Device, 'id' | 'isActive'>): Promise<Device> => {
  // 只有 Admin 能添加
  const response = await api.post('/api/devices', deviceData);
  return response.data;
};

// 后端提供了 PUT /devices/{id} 和 POST /devices/{id}/toggle
// 我们优先使用 toggle 接口，因为它更简单
export const toggleDeviceStatus = async (id: number): Promise<Device> => {
  // 只有 Admin 能切换状态
  const response = await api.post(`/api/devices/${id}/toggle`);
  return response.data;
};

export const deleteDevice = async (id: number) => {
  // 只有 Admin 能删除
  const response = await api.delete(`/api/devices/${id}`);
  return response.data;
};


// 默认导出
export default api;
