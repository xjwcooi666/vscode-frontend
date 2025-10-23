
import React, { useState } from 'react';
import { User, Pigsty } from '../types';

interface UserManagementProps {
    users: User[];
    pigsties: Pigsty[];
    onAddUser: (name: string) => void;
    onUpdateUser: (id: number, name: string) => void;
    onDeleteUser: (id: number) => void;
}

const UserModal: React.FC<{
    user: User | null;
    onClose: () => void;
    onSave: (id: number | null, name: string) => void;
}> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user?.name || '');
    
    const handleSave = () => {
        if (name.trim()) {
            onSave(user?.id || null, name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-sky-400">{user ? '编辑用户' : '添加新用户'}</h2>
                </div>
                <div className="p-6">
                    <label htmlFor="userName" className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
                    <input
                        id="userName"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="例如, 张三"
                    />
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
                    <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">保存</button>
                </div>
            </div>
        </div>
    );
}

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

    const handleSave = (id: number | null, name: string) => {
        if (id) {
            onUpdateUser(id, name);
        } else {
            onAddUser(name);
        }
        closeModal();
    };
    
    const handleDelete = (id: number) => {
        if (window.confirm('您确定要删除该用户吗？此操作无法撤销。')) {
            onDeleteUser(id);
        }
    }

    // Exclude the 'Admin User' from being managed
    const technicians = users.filter(u => u.id !== 1);

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
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">分配的猪舍</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {technicians.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    {pigsties.filter(p => p.technicianId === user.id).map(p => p.name).join(', ') || '无'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
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
