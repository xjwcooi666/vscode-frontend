import React from 'react';
// [!!! 关键改动 !!!] 导入 User 和 UserRole
import { UserRole, User } from '../types';

// [!!! 关键改动 !!!] 定义一个 CurrentUser 接口
interface CurrentUser extends User {
  username: string;
}

interface HeaderProps {
  // [!!! 关键改动 !!!] 接收 currentUser 对象
  currentUser: CurrentUser | null;
  // 接收登出函数
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  
  // 辅助函数：将角色转换为中文
  const getRoleName = (role: UserRole | string) => {
    if (role === UserRole.Admin || role === 'ADMIN') return '管理员';
    if (role === UserRole.Technician || role === 'USER') return '技术员';
    if (role === UserRole.Technician) return '技术员';
    return '未知角色';
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 flex justify-between items-center z-10">
      <h1 className="text-xl sm:text-2xl font-bold text-sky-400">
        人工智能猪舍监控系统
      </h1>
      
      {/* [!!! 关键改动 !!!] 简化后的右侧 UI */}
      <div className="flex items-center space-x-4">
        {currentUser ? (
          <>
            {/* 显示当前用户名和角色 */}
            <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400 hidden sm:inline">当前用户:</span>
                <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                <span className="text-xs font-medium bg-sky-600 text-white px-2 py-0.5 rounded-full">
                  {getRoleName(currentUser.role)}
                </span>
            </div>
            
            {/* 退出登录按钮 */}
            <button 
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 text-sm font-semibold"
            >
              退出登录
            </button>
          </>
        ) : (
          // 如果 currentUser 还在加载中...
          <div className="text-sm text-slate-400">正在加载...</div>
        )}
      </div>
      
    </header>
  );
};


