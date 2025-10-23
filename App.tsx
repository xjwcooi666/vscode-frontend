import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AlertsView } from './components/AlertsView';
import { PigstyManagement } from './components/PigstyManagement';
import { UserManagement } from './components/UserManagement';
import { DeviceManagement } from './components/DeviceManagement';
import { UserRole, Pigsty, MetricType, User, Device, Alert } from './types';
import * as api from './services/apiService';
import { INITIAL_USERS } from './constants';


function App() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.Admin);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pigsties, setPigsties] = useState<Pigsty[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewingAsTechnician, setViewingAsTechnician] = useState<User | null>(INITIAL_USERS.find(u => u.id === 2) || null);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getInitialData();
      setUsers(data.users);
      setPigsties(data.pigsties);
      setDevices(data.devices);
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      // Here you could set an error state and display a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Set up polling for real-time data
    const interval = setInterval(async () => {
        try {
            const updates = await api.getUpdates();
            setPigsties(updates.pigsties);
            setAlerts(updates.alerts);
        } catch (error) {
            console.error("Failed to fetch updates:", error);
        }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // User CRUD
  const handleAddUser = async (name: string) => {
    const newUser = await api.addUser({ name });
    setUsers(prev => [...prev, newUser]);
  };
  const handleUpdateUser = async (id: number, name:string) => {
    const updatedUser = await api.updateUser(id, { name });
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
  };
  const handleDeleteUser = async (id: number) => {
    if (pigsties.some(p => p.technicianId === id)) {
      alert('无法删除用户。该用户当前被分配到一个或多个猪舍。');
      return;
    }
    await api.deleteUser(id);
    if (viewingAsTechnician?.id === id) {
        setViewingAsTechnician(users.find(u => u.id === 2) || null);
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Pigsty CRUD
  const handleAddPigsty = async (pigstyData: Omit<Pigsty, 'id' | 'readings'>) => {
    const newPigsty = await api.addPigsty(pigstyData);
    setPigsties(prev => [...prev, newPigsty]);
  };
  const handleUpdatePigsty = async (updatedPigsty: Pigsty) => {
    const returnedPigsty = await api.updatePigsty(updatedPigsty);
    setPigsties(prev => prev.map(p => p.id === updatedPigsty.id ? returnedPigsty : p));
  };
  const handleDeletePigsty = async (id: number) => {
    await api.deletePigsty(id);
    setPigsties(prev => prev.filter(p => p.id !== id));
    setDevices(prev => prev.filter(d => d.pigstyId !== id));
  };
  const handleUpdatePigstyThresholds = async (pigstyId: number, thresholds: Pigsty['thresholds']) => {
      const updatedPigsty = await api.updatePigstyThresholds(pigstyId, thresholds);
      setPigsties(prev => prev.map(p => p.id === pigstyId ? updatedPigsty : p));
  };
  
  // Device CRUD
  const handleAddDevice = async (pigstyId: number, type: MetricType) => {
    const newDevice = await api.addDevice({ pigstyId, type });
    setDevices(prev => [...prev, newDevice]);
  };
  const handleToggleDeviceStatus = async (id: string) => {
    const updatedDevice = await api.toggleDeviceStatus(id);
    setDevices(prev => prev.map(d => d.id === id ? updatedDevice : d));
  };

  const renderCurrentPage = () => {
    if (isLoading) {
      return <div className="flex-1 flex items-center justify-center text-slate-400">正在加载数据...</div>;
    }
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard pigsties={pigsties} devices={devices} currentUserRole={currentUserRole} viewingAsTechnician={viewingAsTechnician} />;
      case 'alerts':
        return <AlertsView alerts={alerts} pigsties={pigsties} />;
      case 'pigsty-management':
        return <PigstyManagement 
                  pigsties={pigsties} 
                  users={users}
                  onUpdateThresholds={handleUpdatePigstyThresholds}
                  onAddPigsty={handleAddPigsty}
                  onUpdatePigsty={handleUpdatePigsty}
                  onDeletePigsty={handleDeletePigsty}
               />;
      case 'user-management':
        return <UserManagement 
                  users={users}
                  pigsties={pigsties}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
               />;
      case 'device-management':
        return <DeviceManagement 
                  devices={devices}
                  pigsties={pigsties}
                  onAddDevice={handleAddDevice}
                  onToggleDeviceStatus={handleToggleDeviceStatus}
               />;
      default:
        return <Dashboard pigsties={pigsties} devices={devices} currentUserRole={currentUserRole} viewingAsTechnician={viewingAsTechnician} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="flex">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          alertCount={alerts.length}
          currentUserRole={currentUserRole}
        />
        <div className="flex-1 flex flex-col h-screen">
          <Header 
            currentUserRole={currentUserRole} 
            setCurrentUserRole={(role) => {
              setCurrentUserRole(role);
              setCurrentPage('dashboard');
            }}
            users={users}
            viewingAsTechnician={viewingAsTechnician}
            setViewingAsTechnician={setViewingAsTechnician}
          />
          <main className="flex-1 p-6 overflow-hidden flex">
            {renderCurrentPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;