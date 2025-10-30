import React from 'react';
// 修复了导入路径，添加 .ts 扩展名
import { UserRole, User } from '../types.ts';

interface HeaderProps {
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  users: User[];
  viewingAsTechnician: User | null;
  setViewingAsTechnician: (user: User | null) => void;
  onLogout: () => void; // 1. [新增] 接收 App.tsx 传来的 onLogout 函数
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUserRole, 
  setCurrentUserRole, 
  users, 
  viewingAsTechnician, 
  setViewingAsTechnician, 
  onLogout // 2. [新增] 在 props 中解构 onLogout
}) => {
  const technicians = users.filter(u => u.id !== 1); // Exclude Admin User placeholder

  const handleTechnicianChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = Number(e.target.value);
    const selectedUser = users.find(u => u.id === selectedUserId) || null;
    setViewingAsTechnician(selectedUser);
  };
  
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 flex justify-between items-center z-10">
      <h1 className="text-xl sm:text-2xl font-bold text-sky-400">
        人工智能猪舍监控系统
      </h1>
      <div className="flex items-center space-x-4">
        {/* 这是包含下拉菜单的 div */}
        <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400 hidden sm:inline">当前视图:</span>
            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={UserRole.Admin}>管理员</option>
              <option value={UserRole.Technician}>技术员</option>
            </select>

            {currentUserRole === UserRole.Technician && (
              <select
                value={viewingAsTechnician?.id || ''}
                onChange={handleTechnicianChange}
                className="bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {technicians.length > 0 ? (
                  technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))
                ) : (
                  <option value="">没有可用的技术员</option>
                )}
              </select>
            )}
        </div>

        {/* 3. [新增] 退出登录按钮 */}
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          退出登录
        </button>
      </div>
    </header>
  );
};

