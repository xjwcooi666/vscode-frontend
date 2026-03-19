﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import React, { useState, useCallback, useEffect, useRef } from "react";

import { Header } from "./components/Header.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { AlertsView } from "./components/AlertsView.tsx";
import { PigstyManagement } from "./components/PigstyManagement.tsx";
import { UserManagement } from "./components/UserManagement.tsx";
import { DeviceManagement } from "./components/DeviceManagement.tsx";
import { LoginScreen } from "./components/LoginScreen.tsx";
import { AlertModal } from "./components/AlertModal.tsx";

import { UserRole, User, Alert } from "./types.ts";
import { Pigsty as RealPigsty, Device as RealDevice, PageResponse } from "./services/api.ts";

import * as realApi from "./services/api.ts";
import { websocketService } from "./services/websocketService.ts";
import { jwtDecode } from "jwt-decode";

type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  light?: number | null;
  pigstyId: string;
  timestamp: string;
};

interface CurrentUser extends User {
  username: string;
}

const mapBackendRoleToFrontendRole = (backendRole: string): UserRole => {
  if (backendRole === "ADMIN") return UserRole.Admin;
  if (backendRole === "USER") return UserRole.Technician;
  return UserRole.Technician;
};

function App() {
  console.log('=== App component mounted ===');
  const token = localStorage.getItem("token");
  console.log('Initial token:', token);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 用于记录上一次弹窗的时间戳，实现防抖
  const lastAlertTime = useRef<Record<string, number>>({});

  const [users, setUsers] = useState<User[]>([]);
  const [realPigsties, setRealPigsties] = useState<RealPigsty[]>([]);
  const [realAlerts, setRealAlerts] = useState<Alert[]>([]);
  const [realReadings, setRealReadings] = useState<PigstyReading[]>([]);
  const [realDevices, setRealDevices] = useState<RealDevice[]>([]);
  const [alertsPage, setAlertsPage] = useState<PageResponse<Alert>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 100,
  });
  const [alertPageSize, setAlertPageSize] = useState<number>(100);
  const [warningsFilterAcknowledged, setWarningsFilterAcknowledged] = useState<boolean>(false);
  const [alertFilterPigstyId, setAlertFilterPigstyId] = useState<string>("all");
  const [alertFilterMetric, setAlertFilterMetric] = useState<string>("all");
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);

  const getUsernameFromToken = (): string | null => {
    const token = localStorage.getItem("token");
    console.log('getUsernameFromToken called, token:', token);
    if (!token) {
      console.log('No token found');
      return null;
    }
    try {
      console.log('Decoding token...');
      const decodedToken: { sub: string } = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      return decodedToken.sub;
    } catch (error: any) {
      console.error("Failed to decode token:", error);
      console.error("Error message:", error.message);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    console.log('fetchData called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Token:', localStorage.getItem('token'));
    
    if (!isAuthenticated) {
      console.log('Not authenticated, setting isLoading to false');
      setIsLoading(false);
      return;
    }

    const username = getUsernameFromToken();
    console.log('Username from token:', username);
    if (!username) {
      console.log('No username, calling handleLogout');
      handleLogout();
      return;
    }

    console.log('Setting isLoading to true');
    setIsLoading(true);
    try {
      console.log('Testing API connection...');
      // 先测试 API 连接
      const testResponse = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('API connection test:', testResponse.status, testResponse.statusText);
      
      if (testResponse.status === 401) {
        console.log('Token expired, calling handleLogout');
        handleLogout();
        return;
      }
      
      console.log('Fetching data...');
      const [userData, pigstyData, deviceData, readingData] = await Promise.all([
        realApi.getAllUsers(),
        realApi.getAllPigsties(),
        realApi.getAllDevices(),
        realApi.getLatestData(),
      ]);
      console.log('Data fetched successfully');
      console.log('User data:', userData);
      console.log('Pigsty data:', pigstyData);
      console.log('Device data:', deviceData);
      console.log('Reading data:', readingData);

      const allUsers: CurrentUser[] = userData.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: mapBackendRoleToFrontendRole(u.role),
      }));

      setUsers(allUsers);

      const loggedInUser = allUsers.find((u) => u.username === username);
      console.log('LoggedIn user:', loggedInUser);
      if (loggedInUser) {
        setCurrentUser(loggedInUser);
      } else {
        console.error("Logged in user not found in user list!");
        handleLogout();
        return;
      }

      setRealPigsties(pigstyData);
      setRealDevices(deviceData);
      const alertPageData = await realApi.getLatestWarnings(alertsPage.number ?? 0, alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric);
      setAlertsPage(alertPageData);
      setRealAlerts(alertPageData.content ?? []);
      setRealReadings(readingData);
      setLoadError(null);
    } catch (error: any) {
      console.error("Failed fetch data:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      setLoadError(`数据加载失败: ${error.message || '未知错误'}`);
      // 如果是认证错误，跳转到登录页
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.log('Authentication error, calling handleLogout');
        handleLogout();
      }
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  }, [isAuthenticated, alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric, alertsPage.number]);

  const loadAlertsPage = useCallback(
    async (
      page: number,
      size: number,
      acknowledged = warningsFilterAcknowledged,
      pigstyId = alertFilterPigstyId,
      metric = alertFilterMetric
    ) => {
      try {
        const pageData = await realApi.getLatestWarnings(page, size, acknowledged, pigstyId, metric);
        setAlertsPage(pageData);
        setRealAlerts(pageData.content ?? []);
        setAlertPageSize(pageData.size ?? size);
      } catch (error) {
        console.error("Failed to load alerts page:", error);
        setLoadError("加载警报列表失败，请检查后端服务。");
      }
    },
    [warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric]
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage("dashboard");
    // 登录成功后立即加载数据
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const handleLogout = () => {
    realApi.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setRealPigsties([]);
    setRealDevices([]);
    setRealAlerts([]);
    setRealReadings([]);
    setLoadError(null);
  };

  // 检查 token 有效性
  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem('token');
      console.log('Checking token validity:', token);
      if (!token) {
        console.log('No token found, setting isAuthenticated to false');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
      } else {
        try {
          const username = getUsernameFromToken();
          if (!username) {
            console.log('Invalid token, setting isAuthenticated to false');
            setIsAuthenticated(false);
            setCurrentUser(null);
            setIsLoading(false);
          } else {
            console.log('Token is valid, setting isAuthenticated to true');
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error checking token:', error);
          setIsAuthenticated(false);
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    };

    checkTokenValidity();
    
    // 监听 localStorage 中 token 的变化
    const handleStorageChange = () => {
      checkTokenValidity();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // WebSocket 连接和预警处理
  useEffect(() => {
    if (isAuthenticated) {
      // 连接 WebSocket 服务
      websocketService.connect();

      // 订阅预警消息
      const unsubscribeWarning = websocketService.onWarning((alert) => {
        // 查找猪舍名称
        const pigsty = realPigsties.find(p => p.id === alert.pigstyId);
        if (pigsty) {
          alert.pigstyName = pigsty.name;
        }
        
        // 显示预警弹窗
        setCurrentAlert(alert);
        
        // 检查是否为危险数据，添加弹窗报警
        if (alert.level === 'Danger') {
          const key = `${alert.pigstyId}_${alert.metric}`;
          const now = Date.now();
          const lastTime = lastAlertTime.current[key] || 0;
          
          // 防抖：如果距离上次弹窗不足 60 秒，直接返回
          if (now - lastTime < 60000) {
            return;
          }
          
          // 更新时间戳
          lastAlertTime.current[key] = now;
          
          // 构建弹窗内容
          const pigsty = realPigsties.find(p => p.id === alert.pigstyId);
          const pigstyName = pigsty?.name || '未知猪舍';
          const location = pigsty?.location || '未知位置';
          const metricName = alert.metric === 'Temperature' ? '温度' : 
                            alert.metric === 'Humidity' ? '湿度' : 
                            alert.metric === 'Ammonia' ? '氨气浓度' : 
                            alert.metric === 'Light' ? '光照' : alert.metric;
          const currentTime = new Date().toLocaleTimeString();
          
          // 直接使用 window.alert 作为简单的弹窗方案
          window.alert(`🔴 【危险环境警报】 ${pigstyName} (${location})\n当前 ${metricName} 为 ${alert.value.toFixed(2)}，已严重超过危险阈值！\n发生时间：${currentTime}\n系统动作：已自动下发降温/通风指令。`);
        }
        
        // 刷新预警列表
        fetchData();
      });

      // 订阅数据更新消息
      const unsubscribeDataUpdate = websocketService.onDataUpdate((data) => {
        // 刷新数据
        fetchData();
      });

      return () => {
        // 取消订阅
        unsubscribeWarning();
        unsubscribeDataUpdate();
        // 断开 WebSocket 连接
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated, realPigsties, fetchData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      let interval: NodeJS.Timeout | null = null;
      
      // 检查 WebSocket 连接状态的函数
      const checkWebSocketStatus = () => {
        const wsState = websocketService.getConnectionState();
        return wsState === WebSocket.OPEN;
      };
      
      // 轮询函数
      const startPolling = () => {
        interval = setInterval(async () => {
          // 只有当 WebSocket 连接不可用时才进行轮询
          if (!checkWebSocketStatus()) {
            try {
              const [alertUpdates, readingUpdates] = await Promise.all([
                realApi.getLatestWarnings(alertsPage.number ?? 0, alertsPage.size ?? alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric),
                realApi.getLatestData(),
              ]);
              setAlertsPage(alertUpdates);
              setRealAlerts(alertUpdates.content ?? []);
              setRealReadings(readingUpdates);
            } catch (error) {
              console.error("Failed fetch updates:", error);
              setLoadError("实时更新失败");
            }
          }
        }, 5000);
      };
      
      // 启动轮询
      startPolling();
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isAuthenticated, alertsPage.number, alertsPage.size, alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric]);

  const handleAddUser = async (userData: { name: string; username: string; password: string }) => {
    try {
      const newUser = await realApi.addUser(userData);
      setUsers((prev) => [
        ...prev,
        {
          id: newUser.id,
          name: newUser.name,
          role: mapBackendRoleToFrontendRole(newUser.role),
          username: newUser.username,
        },
      ]);
    } catch (error) {
      console.error("Failed add user:", error);
      alert(`添加用户失败: ${error}`);
    }
  };

  const handleUpdateUser = async (id: number, name: string) => {
    console.warn("Update user not implemented yet");
    const updatedUser = users.find((u) => u.id === id);
    if (updatedUser) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, name: name } : u)));
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await realApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error("Failed delete user:", error);
      alert(`删除用户失败: ${error}`);
    }
  };

  const handleAddPigsty = async (pigstyData: Omit<RealPigsty, "id">) => {
    try {
      const newPigsty = await realApi.addPigsty(pigstyData);
      setRealPigsties((prev) => [...prev, newPigsty]);
    } catch (error) {
      console.error("Failed add pigsty:", error);
      alert(`添加猪舍失败: ${error}`);
      throw error;
    }
  };

  const handleUpdatePigsty = async (id: number, updatedPigstyData: RealPigsty) => {
    try {
      const returnedPigsty = await realApi.updatePigsty(id, updatedPigstyData);
      setRealPigsties((prev) => prev.map((p) => (p.id === id ? returnedPigsty : p)));
    } catch (error) {
      console.error("Failed update pigsty:", error);
      alert(`更新猪舍失败: ${error}`);
      throw error;
    }
  };

  const handleDeletePigsty = async (id: number) => {
    try {
      await realApi.deletePigsty(id);
      setRealPigsties((prev) => prev.filter((p) => p.id !== id));
      setRealDevices((prev) => prev.filter((d) => d.pigstyId !== id));
    } catch (error) {
      console.error("Failed delete pigsty:", error);
      alert(`删除猪舍失败: ${error}`);
      throw error;
    }
  };

  const handleAddDevice = async (deviceData: Omit<RealDevice, "id" | "active">) => {
    try {
      const newDevice = await realApi.addDevice(deviceData);
      setRealDevices((prev) => [...prev, newDevice]);
    } catch (error) {
      console.error("Failed add device:", error);
      alert(`添加设备失败: ${error}`);
      throw error;
    }
  };

  const handleToggleDeviceStatus = async (id: number) => {
    try {
      const updatedDevice = await realApi.toggleDeviceStatus(id);
      setRealDevices((prevDevices) => {
        const index = prevDevices.findIndex((device) => device.id === id);
        if (index === -1) return prevDevices;
        const newDevices = [...prevDevices];
        newDevices[index] = { ...updatedDevice };
        return newDevices;
      });
    } catch (error) {
      console.error("Failed toggle device status:", error);
      alert(`切换设备状态失败: ${error}`);
    }
  };

  const handleDeleteDevice = async (id: number) => {
    try {
      await realApi.deleteDevice(id);
      setRealDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed delete device:", error);
      alert(`删除设备失败: ${error}`);
      throw error;
    }
  };

  const handleAcknowledgeWarning = async (id: number) => {
    try {
      await realApi.acknowledgeWarning(id);
      setRealAlerts((prev) => prev.filter((alert) => alert.id !== id));
      setAlertsPage((prev) => ({
        ...prev,
        totalElements: Math.max(0, (prev.totalElements ?? 0) - 1),
        content: prev.content ? prev.content.filter((a) => a.id !== id) : [],
      }));
      const page = alertsPage.number ?? 0;
      const size = alertsPage.size ?? alertPageSize;
      await loadAlertsPage(page, size);
    } catch (error) {
      console.error("Failed to acknowledge warning:", error);
      alert(`确认警报失败: ${error}`);
    }
  };

  const handleAlertsPageChange = async (page: number) => {
    await loadAlertsPage(page, alertsPage.size ?? alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric);
  };

  const handleAlertsPageSizeChange = async (size: number) => {
    await loadAlertsPage(0, size, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric);
  };

  const handleWarningsTabChange = async (acknowledged: boolean) => {
    setWarningsFilterAcknowledged(acknowledged);
    await loadAlertsPage(0, alertsPage.size ?? alertPageSize, acknowledged, alertFilterPigstyId, alertFilterMetric);
  };

  const handlePigstyFilterChange = async (pigstyId: string) => {
    setAlertFilterPigstyId(pigstyId);
    await loadAlertsPage(0, alertsPage.size ?? alertPageSize, warningsFilterAcknowledged, pigstyId, alertFilterMetric);
  };

  const handleMetricFilterChange = async (metric: string) => {
    setAlertFilterMetric(metric);
    await loadAlertsPage(0, alertsPage.size ?? alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, metric);
  };

  const renderCurrentPage = () => {
    if (isLoading || !currentUser) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div>正在加载数据...</div>
          <div className="mt-4 text-sm text-red-400">{loadError}</div>
          <div className="mt-4 text-xs text-slate-500">
            Token: {localStorage.getItem('token') ? '存在' : '不存在'}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            认证状态: {isAuthenticated ? '已认证' : '未认证'}
          </div>
        </div>
      );
    }
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            realPigsties={realPigsties}
            realDevices={realDevices}
            realReadings={realReadings}
            currentUser={currentUser}
          />
        );
      case "alerts":
        const userFilteredPigsties = currentUser?.role === UserRole.Admin 
          ? realPigsties 
          : realPigsties.filter(p => p.technicianId === currentUser?.id);
        return (
          <AlertsView
            alerts={realAlerts}
            realReadings={realReadings}
            realPigsties={userFilteredPigsties}
            users={users}
            onAcknowledgeWarning={handleAcknowledgeWarning}
            pageInfo={{
              totalElements: alertsPage.totalElements,
              totalPages: alertsPage.totalPages,
              number: alertsPage.number,
              size: alertsPage.size,
            }}
            onPageChange={handleAlertsPageChange}
            onPageSizeChange={handleAlertsPageSizeChange}
            acknowledgedFilter={warningsFilterAcknowledged}
            onFilterChange={handleWarningsTabChange}
            filterPigstyId={alertFilterPigstyId}
            filterMetric={alertFilterMetric}
            onFilterPigstyChange={handlePigstyFilterChange}
            onFilterMetricChange={handleMetricFilterChange}
          />
        );
      case "pigsty-management":
        return (
          <PigstyManagement
            pigsties={realPigsties}
            users={users}
            onAddPigsty={handleAddPigsty}
            onUpdatePigsty={handleUpdatePigsty}
            onDeletePigsty={handleDeletePigsty}
          />
        );
      case "user-management":
        return (
          <UserManagement
            users={users}
            pigsties={realPigsties}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case "device-management":
        return (
          <DeviceManagement
            devices={realDevices}
            pigsties={realPigsties}
            onAddDevice={handleAddDevice}
            onToggleDeviceStatus={handleToggleDeviceStatus}
            onDeleteDevice={handleDeleteDevice}
          />
        );
      default:
        return (
          <Dashboard
            realPigsties={realPigsties}
            realDevices={realDevices}
            realReadings={realReadings}
            currentUser={currentUser}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      {!isAuthenticated ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex">
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            alertCount={alertsPage.totalElements ?? realAlerts.filter((a) => !a.acknowledged).length}
            currentUserRole={currentUser?.role || UserRole.Technician}
          />
          <div className="flex-1 flex flex-col h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} />
            {loadError && <div className="bg-red-500/20 text-red-200 text-sm px-4 py-2">{loadError}</div>}
            <main className="flex-1 p-6 overflow-hidden flex"> {renderCurrentPage()} </main>
          </div>
        </div>
      )}
      
      {/* 预警弹窗 */}
      {currentAlert && (
        <AlertModal
          alert={currentAlert}
          onClose={() => setCurrentAlert(null)}
        />
      )}
    </div>
  );
}

export default App;
