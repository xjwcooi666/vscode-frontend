import React, { useState, useCallback, useEffect } from 'react';

// 导入组件
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AlertsView } from './components/AlertsView';
import { PigstyManagement } from './components/PigstyManagement';
import { UserManagement } from './components/UserManagement';
import { DeviceManagement } from './components/DeviceManagement';
import { LoginScreen } from './components/LoginScreen';

// 导入类型
import { UserRole, Pigsty as UIPigsty, User, Alert } from './types';
import { Pigsty as RealPigsty, Device as RealDevice, MetricType as RealMetricType } from './services/api';

// 导入 API 服务
import * as realApi from './services/api';

// 导入常量
import { INITIAL_USERS } from './constants';

// PigstyReading 类型定义
type PigstyReading = {
  id: number;
  temperature?: number | null; // 改为可选
  humidity?: number | null;
  ammoniaLevel?: number | null;
  pigstyId: string;
  timestamp: string;
};

function App() {
  // --- 状态 ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.Admin);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [realPigsties, setRealPigsties] = useState<RealPigsty[]>([]);
  const [realAlerts, setRealAlerts] = useState<Alert[]>([]);
  const [realReadings, setRealReadings] = useState<PigstyReading[]>([]);
  const [realDevices, setRealDevices] = useState<RealDevice[]>([]);
  const [viewingAsTechnician, setViewingAsTechnician] = useState<User | null>(INITIAL_USERS.find(u => u.id === 2) || null);

  // --- 数据获取 ---
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [userData, pigstyData, deviceData, alertData, readingData] = await Promise.all([
        realApi.getAllUsers(),
        realApi.getAllPigsties(),
        realApi.getAllDevices(),
        realApi.getLatestWarnings(),
        realApi.getLatestData()
      ]);
      setUsers(userData.map((u: any) => ({ ...u, role: u.role as UserRole })));
      setRealPigsties(pigstyData);
      setRealDevices(deviceData);
      setRealAlerts(alertData);
      setRealReadings(readingData);
    } catch (error) { console.error("Failed fetch data:", error); handleLogout(); }
    finally { setIsLoading(false); }
  }, [isAuthenticated]);

  // --- 登录/登出 ---
  const handleLoginSuccess = () => { setIsAuthenticated(true); setCurrentPage('dashboard'); };
  const handleLogout = () => {
    realApi.logout(); setIsAuthenticated(false); setUsers([]); setRealPigsties([]);
    setRealDevices([]); setRealAlerts([]); setRealReadings([]);
  };

  // --- Effect Hook ---
  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout | null = null;
    if (isAuthenticated) {
      interval = setInterval(async () => {
        try {
          const [alertUpdates, readingUpdates] = await Promise.all([ realApi.getLatestWarnings(), realApi.getLatestData() ]);
          setRealAlerts(alertUpdates); setRealReadings(readingUpdates);
        } catch (error) { console.error("Failed fetch updates:", error); handleLogout(); }
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [fetchData, isAuthenticated]);

  // --- 用户 CRUD ---
  const handleAddUser = async (userData: { name: string, username: string, password: string }) => {/*...*/
     try {
        const newUser = await realApi.addUser(userData);
        setUsers(prev => [...prev, { id: newUser.id, name: newUser.name, role: newUser.role as UserRole }]);
    } catch (error) { console.error("Failed add user:", error); alert(`添加用户失败: ${error}`); }
  };
  const handleUpdateUser = async (id: number, name: string) => {/*...*/
      console.warn("Update user not implemented yet");
      const updatedUser = users.find(u => u.id === id);
      if (updatedUser) { setUsers(prev => prev.map(u => u.id === id ? {...u, name: name} : u)); }
  };
  const handleDeleteUser = async (id: number) => {/*...*/
      try {
        await realApi.deleteUser(id);
        if (viewingAsTechnician?.id === id) { setViewingAsTechnician(users.find(u => u.id === 2) || null); }
        setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) { console.error("Failed delete user:", error); alert(`删除用户失败: ${error}`); }
  };

  // --- 猪舍 CRUD ---
  const handleAddPigsty = async (pigstyData: Omit<RealPigsty, 'id'>) => {/*...*/
       try {
        const newPigsty = await realApi.addPigsty(pigstyData);
        setRealPigsties(prev => [...prev, newPigsty]);
    } catch (error) { console.error("Failed add pigsty:", error); alert(`添加猪舍失败: ${error}`); throw error; }
  };
  const handleUpdatePigsty = async (id: number, updatedPigstyData: RealPigsty) => {/*...*/
      try {
        const returnedPigsty = await realApi.updatePigsty(id, updatedPigstyData);
        setRealPigsties(prev => prev.map(p => p.id === id ? returnedPigsty : p));
    } catch (error) { console.error("Failed update pigsty:", error); alert(`更新猪舍失败: ${error}`); throw error; }
  };
  const handleDeletePigsty = async (id: number) => {/*...*/
       try {
        await realApi.deletePigsty(id);
        setRealPigsties(prev => prev.filter(p => p.id !== id));
        setRealDevices(prev => prev.filter(d => d.pigstyId !== id));
    } catch (error) { console.error("Failed delete pigsty:", error); alert(`删除猪舍失败: ${error}`); throw error; }
  };

  // --- 设备 CRUD ---
  const handleAddDevice = async (deviceData: Omit<RealDevice, 'id' | 'isActive'>) => {/*...*/
      try {
        const newDevice = await realApi.addDevice(deviceData);
        setRealDevices(prev => [...prev, newDevice]);
    } catch (error) { console.error("Failed add device:", error); alert(`添加设备失败: ${error}`); throw error; }
  };
  const handleToggleDeviceStatus = async (id: number) => {/*...*/
       try {
        const updatedDevice = await realApi.toggleDeviceStatus(id);
        setRealDevices(prevDevices => {
            const index = prevDevices.findIndex(device => device.id === id);
            if (index === -1) return prevDevices;
            const newDevices = [...prevDevices];
            newDevices[index] = { ...updatedDevice };
            return newDevices;
        });
    } catch (error) { console.error("Failed toggle device status:", error); alert(`切换设备状态失败: ${error}`); }
  };
   const handleDeleteDevice = async (id: number) => {/*...*/
        try {
        await realApi.deleteDevice(id);
        setRealDevices(prev => prev.filter(d => d.id !== id));
    } catch (error) { console.error("Failed delete device:", error); alert(`删除设备失败: ${error}`); throw error; }
  };

  // --- 页面渲染 ---
  const renderCurrentPage = () => {
    if (isLoading) { return <div className="flex-1 flex items-center justify-center text-slate-400">正在加载数据...</div>; }
    switch (currentPage) {
      case 'dashboard':
        // [!!! 最终修复 !!!] 传递正确的真实数据给 Dashboard
        return <Dashboard
                  realPigsties={realPigsties}
                  realDevices={realDevices}
                  realReadings={realReadings}
                  currentUserRole={currentUserRole}
                  viewingAsTechnician={viewingAsTechnician}
               />;
      case 'alerts': return <AlertsView alerts={realAlerts} pigsties={realPigsties} />;
      case 'pigsty-management': return <PigstyManagement pigsties={realPigsties} users={users} onAddPigsty={handleAddPigsty} onUpdatePigsty={handleUpdatePigsty} onDeletePigsty={handleDeletePigsty} />;
      case 'user-management': return <UserManagement users={users} pigsties={realPigsties} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case 'device-management': return <DeviceManagement devices={realDevices} pigsties={realPigsties} onAddDevice={handleAddDevice} onToggleDeviceStatus={handleToggleDeviceStatus} onDeleteDevice={handleDeleteDevice} />;
      default:
        // 默认也应该显示 Dashboard
        return <Dashboard
                  realPigsties={realPigsties}
                  realDevices={realDevices}
                  realReadings={realReadings}
                  currentUserRole={currentUserRole}
                  viewingAsTechnician={viewingAsTechnician}
                />;
    }
  };

  // --- 主渲染 ---
  if (!isAuthenticated) { return <LoginScreen onLoginSuccess={handleLoginSuccess} />; }
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="flex">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} alertCount={realAlerts.filter(a => !a.acknowledged).length} currentUserRole={currentUserRole} />
        <div className="flex-1 flex flex-col h-screen">
          <Header currentUserRole={currentUserRole} setCurrentUserRole={(role) => { setCurrentUserRole(role); setCurrentPage('dashboard'); }} users={users} viewingAsTechnician={viewingAsTechnician} setViewingAsTechnician={setViewingAsTechnician} onLogout={handleLogout} />
          <main className="flex-1 p-6 overflow-hidden flex"> {renderCurrentPage()} </main>
        </div>
      </div>
    </div>
  );
}

export default App;