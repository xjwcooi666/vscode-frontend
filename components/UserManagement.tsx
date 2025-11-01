import React, { useState } from 'react';
// [!!! 关键修复 !!!] 确保从 types.ts 导入
import { User, Pigsty, UserRole } from '../types.ts'; 
import { AddUserRequest } from '../services/api.ts'; // 假设 AddUserRequest 在 api.ts 中定义

// 接口定义：组件接收的 Props
interface UserManagementProps {
  users: User[];
  pigsties: Pigsty[]; // 使用从 types.ts 导入的 Pigsty
  onAddUser: (userData: AddUserRequest) => Promise<void>;
  onUpdateUser: (id: number, name: string) => Promise<void>; // 假设更新暂时只改名字
  onDeleteUser: (id: number) => Promise<void>;
}

// [!!! 关键修复 !!!] 
// 修复 UserModal，使其匹配 AddUserRequest (name, username, password)
const UserModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (id: number | null, data: { name: string, username?: string, password?: string }) => void;
}> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  // 仅在“添加新用户”时显示这些字段
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('请至少填写用户名称。');
      return;
    }
    
    // 如果是添加新用户 (user 为 null)
    if (!user) {
      if (!username.trim() || !password.trim()) {
        alert('添加新用户时，必须填写登录账号和密码。');
        return;
      }
      onSave(null, { name: name.trim(), username: username.trim(), password: password.trim() });
    } else {
      // 如果是编辑用户（暂时只允许改名字）
      onSave(user.id, { name: name.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-sky-400">{user ? '编辑用户' : '添加新用户'}</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* 名称 (始终显示) */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">名称*</label>
            <input
              id="userName" type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200"
              placeholder="例如, 张三"
            />
          </div>
          
          {/* 仅在“添加新用户”时显示账号密码框 */}
          {!user && (
            <>
              <div>
                <label htmlFor="userUsername" className="block text-sm font-medium text-slate-300 mb-2">登录账号*</label>
                <input
                  id="userUsername" type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200"
                  placeholder="例如, tech1"
                />
              </div>
              <div>
                <label htmlFor="userPassword" className="block text-sm font-medium text-slate-300 mb-2">登录密码*</label>
                <input
                  id="userPassword" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200"
                  placeholder="新用户密码"
                />
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
          <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">保存</button>
        </div>
      </div>
    </div>
  );
}


// 主组件
export const UserManagement: React.FC<UserManagementProps> = ({ users, pigsties, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = (id: number | null, data: { name: string, username?: string, password?: string }) => {
    if (id && data.name) { // 编辑
      onUpdateUser(id, data.name);
    } else if (data.name && data.username && data.password) { // 添加
      onAddUser(data as AddUserRequest); // 强制转换
    }
    closeModal();
  };
  
  const handleDelete = (id: number) => {
    // 检查该技术员是否仍被猪舍分配
    const isAssigned = pigsties.some(p => p.technicianId === id);
    if (isAssigned) {
        alert('无法删除用户。该用户当前被分配到一个或多个猪舍。请先在“猪舍管理”中解除分配。');
        return;
    }
    
    if (window.confirm('您确定要删除该用户吗？此操作无法撤销。')) {
      onDeleteUser(id);
    }
  }

  // 过滤掉 Admin 用户，只显示技术员 (Role === USER)
  const technicians = users.filter(u => u.role === UserRole.Technician || u.role?.toString() === 'USER');

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-400">用户管理</h2>
        <button onClick={() => openModal()} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
          添加技术员
        </button>
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              {/* [!!! 关键修复 !!!] 调整表头 */}
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">名称</th>
              {/* [!!! 关键修复 !!!] 
                  将“分配的猪舍”和“操作”合并到同一个表头，
                  并使用 text-left 来匹配内容
              */}
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">分配的猪舍</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {/* Admin 用户单独显示，不可编辑/删除 */}
            {users.filter(u => u.role === UserRole.Admin).map(admin => (
                 <tr key={admin.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{admin.name} (管理员)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 italic">N/A (所有猪舍)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4 text-slate-500">
                        (不可编辑)
                    </td>
                 </tr>
            ))}
            
            {/* 技术员列表 */}
            {technicians.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowBrap text-sm font-medium text-slate-200">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {/* [!!! 关键修复 !!!] 
                      这是第二列，正确对应 "分配的猪舍"
                  */}
                  {pigsties.filter(p => p.technicianId === user.id).map(p => p.name).join(', ') || '无'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  {/* [!!! 关键修复 !!!] 
                      这是第三列，正确对应 "操作"
                  */}
                  <button onClick={() => openModal(user)} className="text-sky-400 hover:text-sky-300">编辑</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && <UserModal user={editingUser} onClose={closeModal} onSave={handleSave} />}
    </div>
  );
};

