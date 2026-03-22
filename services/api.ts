import axios from 'axios';

/**
 * API 服务模块
 * 
 * 该模块负责前端与后端的所有 HTTP 通信，包括：
 * - 统一配置 Axios 实例（基础 URL、请求拦截器）
 * - JWT Token 管理（从 localStorage 读取并自动添加到请求头）
 * - 提供所有 REST API 调用函数
 * - 定义数据类型和接口
 * 
 * 使用方式：
 * import { login, getAllPigsties, api } from './services/api';
 * 
 * @module services/api
 * @version 1.0
 */

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

/**
 * 获取 JWT Token
 * 
 * 从浏览器 localStorage 中读取存储的认证 Token，
 * 避免在服务端渲染（SSR）环境中访问 window 对象。
 * 
 * @returns JWT Token 字符串，不存在则返回 null
 */
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * 请求拦截器
 * 
 * 自动为每个 API 请求添加 Authorization 请求头，
 * 携带 JWT Token 进行身份认证。
 */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 响应拦截器
 * 
 * 处理 API 响应，实现以下功能：
 * 1. 捕获 401 错误（Token 过期）
 * 2. 自动刷新 Token
 * 3. 重试失败的请求
 * 4. 处理其他错误
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error);
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.message);
    
    const originalRequest = error.config;
    
    // 处理 401 错误（Token 过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Token expired, refreshing...');
      if (isRefreshing) {
        // 如果正在刷新 Token，将请求加入队列
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // 调用刷新 Token 接口
        console.log('Calling refresh token endpoint...');
        const response = await api.post('/api/auth/refresh');
        const { token } = response.data;
        console.log('Token refreshed successfully:', token);
        
        // 存储新 Token
        localStorage.setItem('token', token);
        
        // 更新请求头
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // 通知队列中的请求使用新 Token
        refreshSubscribers.forEach((callback) => callback(token));
        refreshSubscribers = [];
        
        // 重试原始请求
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // 刷新 Token 失败，跳转到登录页
        localStorage.removeItem('token');
        console.log('Token removed, redirecting to login...');
        window.location.href = '/';
        // 强制刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * 添加用户请求数据接口
 * 
 * 用于创建新用户时传递的参数结构。
 */
export interface AddUserRequest {
  name: string;
  username: string;
  password: string;
}

/**
 * 指标类型枚举
 * 
 * 定义猪舍环境监控的四种核心指标类型：
 * - TEMPERATURE: 温度
 * - HUMIDITY: 湿度
 * - AMMONIA: 氨气浓度
 * - LIGHT: 光照强度
 */
export enum MetricType {
    TEMPERATURE = 'TEMPERATURE',
    HUMIDITY = 'HUMIDITY',
    AMMONIA = 'AMMONIA',
    LIGHT = 'LIGHT'
}

/**
 * 设备数据接口
 * 
 * 描述物联网设备的基本信息和状态。
 */
export interface Device {
  id: number;
  pigstyId: number;
  type: MetricType;
  modelNumber?: string;
  serialNumber?: string;
  active: boolean;
  operatingStatus?: string;
  lastHeartbeat?: string;
}

/**
 * 猪舍数据接口
 * 
 * 描述猪舍的基本信息和各项环境指标的阈值配置。
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

/**
 * 通用分页响应接口
 * 
 * 后端返回的分页数据标准格式，与 Spring Data JPA 的 Page 接口兼容。
 * 
 * @template T 分页数据的内容类型
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * 用户注册
 * 
 * 调用后端注册接口，创建新用户，
 * 第一个用户将自动获得 ADMIN 角色。
 * 
 * @param username 用户名
 * @param password 密码
 * @returns Promise<any> 注册成功返回成功消息
 * @throws Error 注册失败时抛出错误
 */
export const register = async (username: string, password: string) => {
  try {
    const response = await api.post('/api/auth/register', { username, password });
    return response.data;
  } catch (err) {
    console.error('Register failed:', err);
    throw err;
  }
};

/**
 * 用户登录
 * 
 * 调用后端认证接口，验证用户名和密码，
 * 成功后将 JWT Token 存储到 localStorage。
 * 
 * @param username 用户名
 * @param password 密码
 * @returns Promise<string> 登录成功返回 JWT Token
 * @throws Error 登录失败时抛出错误
 */
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

/**
 * 用户登出
 * 
 * 清除 localStorage 中存储的 JWT Token，
 * 解除用户的登录状态。
 */
export const logout = () => {
  localStorage.removeItem('token');
};

/**
 * 获取最新环境数据
 * 
 * 从后端获取所有猪舍的最新环境监测数据，
 * 根据当前登录用户的角色进行数据过滤。
 * 
 * @returns Promise<any[]> 最新环境数据数组
 */
export const getLatestData = async () => {
  const response = await api.get('/api/data/latest');
  return response.data;
};

/**
 * 获取最新告警列表
 * 
 * 分页获取告警信息，支持多种筛选条件。
 * 对后端返回的数据进行兼容性处理（支持数组和 Page 对象两种格式）。
 * 
 * @param page 页码，从 0 开始，默认为 0
 * @param size 每页条数，默认为 100
 * @param acknowledged 是否只显示已确认的告警，默认为 false
 * @param pigstyId 猪舍 ID 筛选，可选
 * @param metricType 指标类型筛选，可选
 * @returns Promise<PageResponse<any>> 分页告警数据
 */
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

  // 处理预警级别，确保前端能正确显示
  const processAlerts = (alerts: any[]) => {
    return alerts.map(alert => {
      return {
        ...alert,
        level: alert.level === 'DANGER' ? 'Danger' : 'Warning',
        metric: alert.metricType ? alert.metricType.charAt(0) + alert.metricType.slice(1).toLowerCase() : alert.metric
      };
    });
  };

  if (Array.isArray(data)) {
    return {
      content: processAlerts(data),
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
    };
  }

  return {
    content: processAlerts(data.content ?? []),
    totalElements: data.totalElements ?? (data.content?.length ?? 0),
    totalPages: data.totalPages ?? 1,
    number: data.number ?? page,
    size: data.size ?? size,
  };
};

/**
 * 确认告警
 * 
 * 将指定 ID 的告警标记为已确认状态，
 * 确认后的告警将从待处理列表中移除。
 * 
 * @param id 告警记录的 ID
 * @returns Promise<any> 后端返回的确认结果
 */
export const acknowledgeWarning = async (id: number) => {
  const response = await api.post(`/api/warnings/acknowledge/${id}`);
  return response.data; 
}

/**
 * 获取所有用户列表
 * 
 * 仅 ADMIN 角色可调用此接口。
 * 
 * @returns Promise<any[]> 用户列表数组
 */
export const getAllUsers = async () => {
  const response = await api.get('/api/admin/users');
  return response.data;
};

/**
 * 添加新用户
 * 
 * 仅 ADMIN 角色可调用此接口。
 * 
 * @param data 用户信息（name, username, password）
 * @returns Promise<any> 创建成功的用户信息
 */
export const addUser = async (data: { name: string, username: string, password: string }) => {
  const response = await api.post('/api/admin/users', data);
  return response.data;
};

/**
 * 删除用户
 * 
 * 仅 ADMIN 角色可调用此接口。
 * 
 * @param id 要删除的用户 ID
 * @returns Promise<any> 删除结果
 */
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/api/admin/users/${id}`);
  return response.data;
};

/**
 * 获取所有猪舍列表
 * 
 * @returns Promise<Pigsty[]> 猪舍列表数组
 */
export const getAllPigsties = async (): Promise<Pigsty[]> => {
  const response = await api.get('/api/pigsties');
  return response.data;
};

/**
 * 添加新猪舍
 * 
 * @param pigstyData 猪舍信息（不包含 id）
 * @returns Promise<Pigsty> 创建成功的猪舍信息
 */
export const addPigsty = async (pigstyData: Omit<Pigsty, 'id'>): Promise<Pigsty> => {
  const response = await api.post('/api/pigsties', pigstyData);
  return response.data;
};

/**
 * 更新猪舍信息
 * 
 * @param id 要更新的猪舍 ID
 * @param pigstyData 完整的猪舍信息
 * @returns Promise<Pigsty> 更新后的猪舍信息
 */
export const updatePigsty = async (id: number, pigstyData: Pigsty): Promise<Pigsty> => {
  const response = await api.put(`/api/pigsties/${id}`, pigstyData);
  return response.data;
};

/**
 * 删除猪舍
 * 
 * @param id 要删除的猪舍 ID
 * @returns Promise<any> 删除结果
 */
export const deletePigsty = async (id: number) => {
  const response = await api.delete(`/api/pigsties/${id}`);
  return response.data;
};

/**
 * 获取所有设备列表
 * 
 * @param pigstyId 可选，按猪舍 ID 筛选设备
 * @returns Promise<Device[]> 设备列表数组
 */
export const getAllDevices = async (pigstyId?: number): Promise<Device[]> => {
  const params = pigstyId ? { pigstyId } : {};
  const response = await api.get('/api/devices', { params });
  return response.data;
};

/**
 * 添加新设备
 * 
 * @param deviceData 设备信息（不包含 id 和 active）
 * @returns Promise<Device> 创建成功的设备信息
 */
export const addDevice = async (deviceData: Omit<Device, 'id' | 'active'>): Promise<Device> => {
  const response = await api.post('/api/devices', deviceData);
  return response.data;
};

/**
 * 切换设备启用/停用状态
 * 
 * @param id 设备 ID
 * @returns Promise<Device> 更新后的设备信息
 */
export const toggleDeviceStatus = async (id: number): Promise<Device> => {
  const response = await api.post(`/api/devices/${id}/toggle`);
  return response.data;
};

/**
 * 删除设备
 * 
 * @param id 要删除的设备 ID
 * @returns Promise<any> 删除结果
 */
export const deleteDevice = async (id: number) => {
  const response = await api.delete(`/api/devices/${id}`);
  return response.data;
};

export const resetDevice = async (id: number): Promise<{ success: boolean; message: string; device: Device }> => {
  const response = await api.post(`/api/devices/${id}/reset`);
  return response.data;
};

export default api;
