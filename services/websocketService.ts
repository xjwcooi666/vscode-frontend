/**
 * WebSocket 服务
 * 
 * 该服务负责管理 WebSocket 连接，处理实时消息推送，
 * 包括预警通知和数据更新。
 * 
 * @module services/websocketService
 * @version 1.0
 */

import { Alert } from '../types';

// WebSocket 消息类型
type WebSocketMessageType = 'warning' | 'data-update';

// WebSocket 消息接口
interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

// 预警消息接口
interface WarningMessage extends WebSocketMessage {
  type: 'warning';
  data: {
    id: number;
    pigstyId: string;
    message: string;
    metricType: string;
    actualValue: number;
    timestamp: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
  };
}

// 数据更新消息接口
interface DataUpdateMessage extends WebSocketMessage {
  type: 'data-update';
  data: {
    id: number;
    pigstyId: string;
    temperature?: number;
    humidity?: number;
    ammoniaLevel?: number;
    light?: number;
    timestamp: string;
  };
}

// 事件回调类型
type WarningCallback = (warning: Alert) => void;
type DataUpdateCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private warningCallbacks: WarningCallback[] = [];
  private dataUpdateCallbacks: DataUpdateCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * 连接 WebSocket 服务器
   */
  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // 创建 WebSocket 连接
      this.socket = new WebSocket('ws://localhost:8080/ws');

      // 连接建立
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      // 接收消息
      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      // 连接关闭
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      // 连接错误
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. Stopping reconnection.');
    }
  }

  /**
   * 处理接收到的消息
   * @param message 消息内容
   */
  private handleMessage(message: string): void {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'warning':
          this.handleWarningMessage(parsedMessage as WarningMessage);
          break;
        case 'data-update':
          this.handleDataUpdateMessage(parsedMessage as DataUpdateMessage);
          break;
        default:
          console.warn('Unknown message type:', parsedMessage.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * 处理预警消息
   * @param message 预警消息
   */
  private handleWarningMessage(message: WarningMessage): void {
    const warningData = message.data;
    
    // 转换指标类型为前端格式（首字母大写，其余小写）
    const convertMetricType = (metricType: string): string => {
      return metricType.charAt(0) + metricType.slice(1).toLowerCase();
    };
    
    // 转换为前端 Alert 类型
    const alert: Alert = {
      id: warningData.id.toString(),
      timestamp: new Date(warningData.timestamp).getTime(),
      pigstyId: parseInt(warningData.pigstyId),
      pigstyName: '', // 猪舍名称需要从前端状态中获取
      metric: convertMetricType(warningData.metricType) as any,
      value: warningData.actualValue,
      level: 'Danger' as any, // 根据实际情况设置级别
      message: warningData.message
    };

    // 触发所有预警回调
    this.warningCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in warning callback:', error);
      }
    });
  }

  /**
   * 处理数据更新消息
   * @param message 数据更新消息
   */
  private handleDataUpdateMessage(message: DataUpdateMessage): void {
    const data = message.data;
    
    // 触发所有数据更新回调
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  /**
   * 订阅预警消息
   * @param callback 预警回调函数
   * @returns 取消订阅函数
   */
  onWarning(callback: WarningCallback): () => void {
    this.warningCallbacks.push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.warningCallbacks = this.warningCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 订阅数据更新消息
   * @param callback 数据更新回调函数
   * @returns 取消订阅函数
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.dataUpdateCallbacks.push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.dataUpdateCallbacks = this.dataUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * 获取 WebSocket 连接状态
   * @returns 连接状态
   */
  getConnectionState(): number {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }
}

// 导出单例实例
export const websocketService = new WebSocketService();
export default websocketService;
