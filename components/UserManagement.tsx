import React, { useState } from 'react';
import { User, Pigsty } from '../types';

interface UserManagementProps {
    users: User[];
    pigsties: Pigsty[];
    // [!! 关键改动 !!] onAddUser 不再只接收 name
    onAddUser: (data: { name: string, username: string, password: string }) => void;
    onUpdateUser: (id: number, name: string) => void;
    onDeleteUser: (id: number) => void;
}

// --- 升级版的 UserModal ---
const UserModal: React.FC<{
    user: User | null; // user 为 null 时, 表示“添加新用户”
    onClose: () => void;
    // [!! 关键改动 !!] onSave 现在传递一个完整的数据对象
    onSave: (data: { id: number | null, name: string, username: string, password: string }) => void;
}> = ({ user, onClose, onSave }) => {
    // [!! 新增 !!] 我们现在需要管理 3 个状态
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSave = () => {
        if (name.trim()) {
            // [!! 关键改动 !!] 把所有状态都传回去
            onSave({
              id: user?.id || null, 
              name: name.trim(), 
              username: username.trim(),
              password: password.trim()
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-sky-400">{user ? '编辑用户' : '添加新技术员'}</h2>
                </div>
                
                {/* --- 表单内容 --- */}
                <div className="p-6 space-y-4">
                  {/* 字段 1: 名称 (始终显示) */}
                    <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">名称</label>
                    <input
                        id="userName"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="例如, 张三"
                    />
                  </div>

                  {/* [!! 新增 !!] 字段 2 & 3 (仅在“添加”时显示) */}
                  {!user && (
                    <>
                      <div>
                        <label htmlFor="userUsername" className="block text-sm font-medium text-slate-300 mb-2">登录账号 (Username)</label>
                        <input
                            id="userUsername"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="用于登录, 例如, zhangsan"
                        />
                      </div>
                      <div>
                        <label htmlFor="userPassword" className="block text-sm font-medium text-slate-300 mb-2">登录密码 (Password)</label>
                        <input
                            id="userPassword"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="至少 6 位"
                        />
                      </div>
                    </>
                  )}
                </div>
                {/* --- 表单内容结束 --- */}

                <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
                    <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">保存</button>
                </div>
            </div>
        </div>
    );
}


// --- 升级版的 UserManagement ---
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

    // [!! 关键改动 !!] handleSave 现在接收完整的数据对象
    const handleSave = (data: { id: number | null, name: string, username: string, password: string }) => {
        if (data.id) {
            // 编辑: 我们暂时只更新 name
            onUpdateUser(data.id, data.name);
        } else {
            // 添加:
            if (!data.username || !data.password) {
              // 简单的客户端验证
              alert("创建新用户时，必须填写登录账号和密码。");
              return; // 不关闭弹窗
            }
            onAddUser({ name: data.name, username: data.username, password: data.password });
        }
        closeModal();
    };
    
    const handleDelete = (id: number) => {
      // (使用自定义弹窗替换 window.confirm 会更好, 但我们暂时保留它)
        if (window.confirm('您确定要删除该用户吗？此操作无法撤销。')) {
            onDeleteUser(id);
        }
    }

    // Exclude the 'Admin User' from being managed
    const technicians = users.filter(u => u.id !== 1);

    return (
      // ... (下面的 JSX 保持不变) ...
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">分配的猪舍</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {technicians.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{user.name}</td>
*                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    {pigsties.filter(p => p.technicianId === user.id).map(p => p.name).join(', ') || '无'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => openModal(user)} className="text-sky-400 hover:text-sky-300">编辑</button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300">删除</button>
            _                 </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserModal user={editingUser} onClose={closeModal} onSave={handleSave} />}
        </div>
    );
};
