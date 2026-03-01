import React, { useState, useCallback, useEffect } from "react";

import { Header } from "./components/Header.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { AlertsView } from "./components/AlertsView.tsx";
import { PigstyManagement } from "./components/PigstyManagement.tsx";
import { UserManagement } from "./components/UserManagement.tsx";
import { DeviceManagement } from "./components/DeviceManagement.tsx";
import { LoginScreen } from "./components/LoginScreen.tsx";

import { UserRole, User, Alert } from "./types.ts";
import { Pigsty as RealPigsty, Device as RealDevice, PageResponse } from "./services/api.ts";

import * as realApi from "./services/api.ts";
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
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const getUsernameFromToken = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decodedToken: { sub: string } = jwtDecode(token);
      return decodedToken.sub;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const username = getUsernameFromToken();
    if (!username) {
      handleLogout();
      return;
    }

    setIsLoading(true);
    try {
      const [userData, pigstyData, deviceData, readingData] = await Promise.all([
        realApi.getAllUsers(),
        realApi.getAllPigsties(),
        realApi.getAllDevices(),
        realApi.getLatestData(),
      ]);

      const allUsers: CurrentUser[] = userData.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: mapBackendRoleToFrontendRole(u.role),
      }));

      setUsers(allUsers);

      const loggedInUser = allUsers.find((u) => u.username === username);
      if (loggedInUser) {
        setCurrentUser(loggedInUser);
      } else {
        console.error("Logged in user not found in user list!");
        handleLogout();
        return;
      }

      setRealPigsties(pigstyData);
      setRealDevices(deviceData);
      const alertPageData = await realApi.getLatestWarnings(0, alertPageSize, warningsFilterAcknowledged, alertFilterPigstyId, alertFilterMetric);
      setAlertsPage(alertPageData);
      setRealAlerts(alertPageData.content ?? []);
      setRealReadings(readingData);
      setLoadError(null);
    } catch (error) {
      console.error("Failed fetch data:", error);
      setLoadError("数据加载失败，请检查后端服务或网络。");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, alertPageSize, warningsFilterAcknowledged]);

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

  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout | null = null;
    if (isAuthenticated) {
      interval = setInterval(async () => {
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
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, isAuthenticated, alertsPage.number, alertsPage.size, alertPageSize, warningsFilterAcknowledged]);

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
    await loadAlertsPage(page, alertsPage.size ?? alertPageSize, warningsFilterAcknowledged);
  };

  const handleAlertsPageSizeChange = async (size: number) => {
    await loadAlertsPage(0, size, warningsFilterAcknowledged);
  };

  const handleWarningsTabChange = async (acknowledged: boolean) => {
    setWarningsFilterAcknowledged(acknowledged);
    await loadAlertsPage(0, alertsPage.size ?? alertPageSize, acknowledged);
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
      return <div className="flex-1 flex items-center justify-center text-slate-400">正在加载数据...</div>;
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
        return (
          <AlertsView
            alerts={realAlerts}
            realReadings={realReadings}
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
            onFilterPigstyChange={setAlertFilterPigstyId}
            onFilterMetricChange={setAlertFilterMetric}
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

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
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
    </div>
  );
}

export default App;
