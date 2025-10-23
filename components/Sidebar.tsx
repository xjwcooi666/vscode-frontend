
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  alertCount: number;
  currentUserRole: UserRole;
}

const NavItem: React.FC<{
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
  alertCount?: number;
}> = ({ icon, label, isActive, onClick, alertCount }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-sky-500/20 text-sky-300'
        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
    {alertCount > 0 && (
      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
        {alertCount}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, alertCount, currentUserRole }) => {
  return (
    <aside className="w-64 bg-slate-800 p-4 flex-shrink-0 flex flex-col">
      <div className="flex items-center mb-8">
         <div className="bg-sky-500 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm3.293 14.707L11 12.414V7a1 1 0 0 0-2 0v6a.997.997 0 0 0 .293.707l4.586 4.586a1 1 0 0 0 1.414-1.414L15.293 16.707z"/>
          </svg>
         </div>
         <span className="text-2xl font-bold text-white ml-3">仪表盘</span>
      </div>
      <nav className="flex-grow">
        {currentUserRole === UserRole.Admin ? (
          <>
            <NavItem
              icon={<UserManagementIcon />}
              label="用户管理"
              isActive={currentPage === 'user-management'}
              onClick={() => setCurrentPage('user-management')}
            />
            <NavItem
              icon={<PigstyManagementIcon />}
              label="猪舍管理"
              isActive={currentPage === 'pigsty-management'}
              onClick={() => setCurrentPage('pigsty-management')}
            />
            <NavItem
              icon={<DeviceManagementIcon />}
              label="设备管理"
              isActive={currentPage === 'device-management'}
              onClick={() => setCurrentPage('device-management')}
            />
            <NavItem
              icon={<DashboardIcon />}
              label="数据监测"
              isActive={currentPage === 'dashboard'}
              onClick={() => setCurrentPage('dashboard')}
            />
            <NavItem
              icon={<AlertsIcon />}
              label="警报记录"
              isActive={currentPage === 'alerts'}
              onClick={() => setCurrentPage('alerts')}
              alertCount={alertCount}
            />
          </>
        ) : (
          <>
            <NavItem
              icon={<DashboardIcon />}
              label="我的猪舍"
              isActive={currentPage === 'dashboard'}
              onClick={() => setCurrentPage('dashboard')}
            />
            <NavItem
              icon={<AlertsIcon />}
              label="警报记录"
              isActive={currentPage === 'alerts'}
              onClick={() => setCurrentPage('alerts')}
              alertCount={alertCount}
            />
          </>
        )}
      </nav>
      <div className="mt-auto text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} 猪舍系统公司</p>
        <p>v1.0.0</p>
      </div>
    </aside>
  );
};

// Icons
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const AlertsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const PigstyManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const DeviceManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
