
import React, { useState } from 'react';
import { Pigsty, MetricType, ThresholdConfig, User } from '../types';
import { ThresholdModal } from './ThresholdModal';
import { PIGSTY_TYPE_NAMES } from '../constants';

interface PigstyManagementProps {
  pigsties: Pigsty[];
  users: User[];
  onUpdateThresholds: (pigstyId: number, newThresholds: { [key in MetricType]?: Partial<ThresholdConfig> }) => void;
  onAddPigsty: (pigsty: Omit<Pigsty, 'id' | 'readings'>) => void;
  onUpdatePigsty: (pigsty: Pigsty) => void;
  onDeletePigsty: (id: number) => void;
}

const PigstyModal: React.FC<{
  pigsty: Pigsty | null;
  users: User[];
  onClose: () => void;
  onSave: (pigsty: Omit<Pigsty, 'id' | 'readings'> | Pigsty) => void;
}> = ({ pigsty, users, onClose, onSave }) => {
    const [name, setName] = useState(pigsty?.name || '');
    const [type, setType] = useState(pigsty?.type || 'Finishing');
    const [capacity, setCapacity] = useState(pigsty?.capacity || 100);
    const [technicianId, setTechnicianId] = useState<number | null>(pigsty?.technicianId || null);
    const pigstyTypes = Object.keys(PIGSTY_TYPE_NAMES);

    const handleSave = () => {
        if (!name.trim() || !type.trim() || capacity <= 0) {
            alert('请正确填写所有字段。');
            return;
        }
        const pigstyData = { name, type, capacity, technicianId, thresholds: pigsty?.thresholds || {} };
        if (pigsty) {
            onSave({ ...pigsty, ...pigstyData });
        } else {
            onSave(pigstyData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-sky-400">{pigsty ? '编辑猪舍' : '添加新猪舍'}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">名称</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm text-slate-300 mb-1">类型</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md">
                            {pigstyTypes.map(typeKey => (
                                <option key={typeKey} value={typeKey}>{PIGSTY_TYPE_NAMES[typeKey]}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm text-slate-300 mb-1">容量</label>
                        <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm text-slate-300 mb-1">分配的技术员</label>
                        <select value={technicianId ?? ''} onChange={e => setTechnicianId(e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-700 p-2 rounded-md">
                            <option value="">无</option>
                            {users.filter(u => u.id !== 1).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
                    <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">保存</button>
                </div>
            </div>
        </div>
    );
}

export const PigstyManagement: React.FC<PigstyManagementProps> = ({ pigsties, users, onUpdateThresholds, onAddPigsty, onUpdatePigsty, onDeletePigsty }) => {
  const [editingThresholds, setEditingThresholds] = useState<Pigsty | null>(null);
  const [editingPigsty, setEditingPigsty] = useState<Pigsty | null>(null);
  const [isAddingPigsty, setIsAddingPigsty] = useState(false);

  const handleSaveThresholds = (newThresholds: { [key in MetricType]?: Partial<ThresholdConfig> }) => {
    if (editingThresholds) {
      onUpdateThresholds(editingThresholds.id, newThresholds);
      setEditingThresholds(null);
    }
  };
  
  const handleSavePigsty = (pigstyData: Omit<Pigsty, 'id' | 'readings'> | Pigsty) => {
    if ('id' in pigstyData) {
      onUpdatePigsty(pigstyData);
    } else {
      onAddPigsty(pigstyData);
    }
    setEditingPigsty(null);
    setIsAddingPigsty(false);
  }
  
  const handleDelete = (id: number) => {
      if (window.confirm('您确定要删除这个猪舍吗？此操作还将删除其所有关联设备且无法撤销。')) {
          onDeletePigsty(id);
      }
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-400">猪舍管理</h2>
         <button onClick={() => setIsAddingPigsty(true)} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
            添加猪舍
        </button>
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">技术员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">警报阈值</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {pigsties.map(pigsty => (
                <tr key={pigsty.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{pigsty.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{PIGSTY_TYPE_NAMES[pigsty.type]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{users.find(u => u.id === pigsty.technicianId)?.name || '未分配'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => setEditingThresholds(pigsty)} className="text-sky-400 hover:text-sky-300">
                      管理
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => setEditingPigsty(pigsty)} className="text-sky-400 hover:text-sky-300">编辑</button>
                    <button onClick={() => handleDelete(pigsty.id)} className="text-red-400 hover:text-red-300">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      {editingThresholds && (
        <ThresholdModal 
          pigsty={editingThresholds}
          onSave={handleSaveThresholds}
          onClose={() => setEditingThresholds(null)}
        />
      )}
      {(editingPigsty || isAddingPigsty) && (
        <PigstyModal
          pigsty={editingPigsty}
          users={users}
          onClose={() => {setEditingPigsty(null); setIsAddingPigsty(false);}}
          onSave={handleSavePigsty}
        />
      )}
    </div>
  );
};
