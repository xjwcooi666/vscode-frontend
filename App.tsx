import React, { useState, useCallback, useEffect } from 'react';

// [!!! 关键修复 1 !!!] 
// 恢复为 './' 相对路径，并 *添加* .ts/.tsx 扩展名
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { PigstyManagement } from './components/PigstyManagement.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { DeviceManagement } from './components/DeviceManagement.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';

// 导入类型 (现在 User 接口 *不* 包含 username)
import { UserRole, Pigsty, MetricType as UIMetricType, User, Alert } from './types.ts';
import { Pigsty as RealPigsty, Device as RealDevice, MetricType as RealMetricType } from './services/api.ts';

// 导入 API 服务
import * as realApi from './services/api.ts';
// 导入 JWT 解析库
import { jwtDecode } from 'jwt-decode'; 

// PigstyReading 类型定义
type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  light?: number | null;
  pigstyId: string;
  timestamp: string;
};

// 定义一个存储当前用户信息的接口 (它扩展了 User，并添加了 username)
interface CurrentUser extends User {
  username: string; 
}

// [!!! 关键修复 2 !!!] 
// 添加一个函数来映射后端角色 (ADMIN/USER) 到前端角色 (admin/technician)
const mapBackendRoleToFrontendRole = (backendRole: string): UserRole => {
    if (backendRole === 'ADMIN') {
        return UserRole.Admin; // 返回 'admin'
    }
    // 假设后端的 'USER' 对应前端的 'Technician'
    if (backendRole === 'USER') { 
        return UserRole.Technician; // 返回 'technician'
    }
    // 默认回退
    return UserRole.Technician; 
};


function App() {
  // --- 状态 ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  const [users, setUsers] = useState<User[]>([]); // 这个数组现在只包含 { id, name, role }
  const [realPigsties, setRealPigsties] = useState<RealPigsty[]>([]);
  const [realAlerts, setRealAlerts] = useState<Alert[]>([]);
  const [realReadings, setRealReadings] = useState<PigstyReading[]>([]);
  const [realDevices, setRealDevices] = useState<RealDevice[]>([]);

  // --- 辅助函数：从 Token 解析用户名 ---
  const getUsernameFromToken = (): string | null => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
          const decodedToken: { sub: string } = jwtDecode(token);
          return decodedToken.sub;
      } catch (error) {
          console.error("Failed to decode token:", error);
          return null;
      }
  };

  // --- 数据获取 ---
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    
    const username = getUsernameFromToken();
    if (!username) { handleLogout(); return; }
    
    setIsLoading(true);
    try {
      const [userData, pigstyData, deviceData, alertData, readingData] = await Promise.all([
        realApi.getAllUsers(),
        realApi.getAllPigsties(),
        realApi.getAllDevices(),
        realApi.getLatestWarnings(),
        realApi.getLatestData()
      ]);
      
      // [!!! 关键修复 3 !!!] 
      // userData 包含 { id, name, username, role: "ADMIN" | "USER" }
      // 我们需要把它转换成符合 types.ts 的 User[]
      const allUsers: CurrentUser[] = userData.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username, // 包含 username
          role: mapBackendRoleToFrontendRole(u.role) // 转换角色！
      }));
      
      setUsers(allUsers); // allUsers 是 CurrentUser[]，也符合 User[]
      
      const loggedInUser = allUsers.find(u => u.username === username); 
      if (loggedInUser) {
          setCurrentUser(loggedInUser); // loggedInUser 是 CurrentUser，类型匹配
      } else {
          console.error("Logged in user not found in user list!");
          handleLogout();
          return;
      }

      setRealPigsties(pigstyData);
      setRealDevices(deviceData);
      setRealAlerts(alertData);
      setRealReadings(readingData);

    } catch (error) { 
      console.error("Failed fetch data:", error); 
      handleLogout();
    }
    finally { setIsLoading(false); }
  }, [isAuthenticated]);

  // --- 登录/登出 ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };
  const handleLogout = () => {
    realApi.logout(); 
    setIsAuthenticated(false); 
    setCurrentUser(null);
    setUsers([]); setRealPigsties([]);
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
  const handleAddUser = async (userData: { name: string, username: string, password: string }) => {
     try {
        const newUser = await realApi.addUser(userData); // 后端返回 { id, name, username, role: "USER" }
        setUsers(prev => [...prev, { 
            id: newUser.id, 
            name: newUser.name, 
            role: mapBackendRoleToFrontendRole(newUser.role), // 转换新用户
            username: newUser.username 
        }]);
    } catch (error) { console.error("Failed add user:", error); alert(`添加用户失败: ${error}`); }
  };
  const handleUpdateUser = async (id: number, name: string) => {
    console.warn("Update user not implemented yet");
    const updatedUser = users.find(u => u.id === id);
    if (updatedUser) { setUsers(prev => prev.map(u => u.id === id ? {...u, name: name} : u)); }
  };
  const handleDeleteUser = async (id: number) => {
      try {
        await realApi.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) { console.error("Failed delete user:", error); alert(`删除用户失败: ${error}`); }
  };

  // --- 猪舍 CRUD ---
  const handleAddPigsty = async (pigstyData: Omit<RealPigsty, 'id'>) => {
       try {
        const newPigsty = await realApi.addPigsty(pigstyData);
        setRealPigsties(prev => [...prev, newPigsty]);
    } catch (error) { console.error("Failed add pigsty:", error); alert(`添加用户失败: ${error}`); throw error; }
  };
  const handleUpdatePigsty = async (id: number, updatedPigstyData: RealPigsty) => {
      try {
        const returnedPigsty = await realApi.updatePigsty(id, updatedPigstyData); 
        setRealPigsties(prev => prev.map(p => p.id === id ? returnedPigsty : p));
    } catch (error) { console.error("Failed update pigsty:", error); alert(`更新猪舍失败: ${error}`); throw error; }
  };
  const handleDeletePigsty = async (id: number) => {
       try {
        await realApi.deletePigsty(id);
        setRealPigsties(prev => prev.filter(p => p.id !== id));
        setRealDevices(prev => prev.filter(d => d.pigstyId !== id));
    } catch (error) { console.error("Failed delete pigsty:", error); alert(`删除猪舍失败: ${error}`); throw error; }
  };

  // --- 设备 CRUD ---
  const handleAddDevice = async (deviceData: Omit<RealDevice, 'id' | 'active'>) => {
      try {
        const newDevice = await realApi.addDevice(deviceData);
        setRealDevices(prev => [...prev, newDevice]);
    } catch (error) { console.error("Failed add device:", error); alert(`添加设备失败: ${error}`); throw error; }
  };
  const handleToggleDeviceStatus = async (id: number) => {
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
   const handleDeleteDevice = async (id: number) => {
        try {
        await realApi.deleteDevice(id);
        setRealDevices(prev => prev.filter(d => d.id !== id));
    } catch (error) { console.error("Failed delete device:", error); alert(`删除设备失败: ${error}`); throw error; }
  };

  // [!!! 关键修复 4 !!!] 恢复“确认警报”函数
  const handleAcknowledgeWarning = async (id: number) => {
      try {
          await realApi.acknowledgeWarning(id);
          setRealAlerts(prevAlerts => 
              prevAlerts.filter(alert => alert.id !== id)
          );
      } catch (error) {
          console.error("Failed to acknowledge warning:", error);
          alert(`确认警报失败: ${error}`);
      }
  };

  // --- 页面渲染 ---
  const renderCurrentPage = () => {
    if (isLoading || !currentUser) { 
        return <div className="flex-1 flex items-center justify-center text-slate-400">正在加载数据...</div>; 
    }
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard
                  realPigsties={realPigsties}
                  realDevices={realDevices}
                  realReadings={realReadings}
                  currentUser={currentUser}
               />;
      case 'alerts': 
        return <AlertsView 
                  alerts={realAlerts} 
                  pigsties={realPigsties} 
                  realReadings={realReadings} 
                  onAcknowledgeWarning={handleAcknowledgeWarning} // <-- 现在这个函数存在了
                />;
      case 'pigsty-management': 
        return <PigstyManagement 
                  pigsties={realPigsties} 
                  users={users} 
                  onAddPigsty={handleAddPigsty} 
                  onUpdatePigsty={handleUpdatePigsty} 
                  onDeletePigsty={handleDeletePigsty} 
               />;
      case 'user-management': 
        return <UserManagement 
                  users={users} 
                  pigsties={realPigsties} 
                  onAddUser={handleAddUser} 
                  onUpdateUser={handleUpdateUser} 
                  onDeleteUser={handleDeleteUser} 
               />;
      case 'device-management': 
        return <DeviceManagement 
                  devices={realDevices} 
                  pigsties={realPigsties} 
                  onAddDevice={handleAddDevice} 
                  onToggleDeviceStatus={handleToggleDeviceStatus} 
                  onDeleteDevice={handleDeleteDevice} 
               />;
      default:
        return <Dashboard
                  realPigsties={realPigsties}
                  realDevices={realDevices}
                  realReadings={realReadings}
                  currentUser={currentUser}
                />;
    }
  };

  // --- 主渲染 ---
  if (!isAuthenticated) { return <LoginScreen onLoginSuccess={handleLoginSuccess} />; }
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="flex">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          alertCount={realAlerts.filter(a => !a.acknowledged).length} 
          // [!!! 关键修复 5 !!!] 
          // 使用 types.ts 中定义的 'technician'
          currentUserRole={currentUser?.role || UserRole.Technician}
        />
        <div className="flex-1 flex flex-col h-screen">
          <Header 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <main className="flex-1 p-6 overflow-hidden flex"> {renderCurrentPage()} </main>
        </div>
      </div>
    </div>
  );
}

export default App;

