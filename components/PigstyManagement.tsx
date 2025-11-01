import React, { useState, useEffect } from 'react';
// 导入我们将在 App.tsx 中定义的真实 Pigsty 类型
import { Pigsty as RealPigsty, User, UserRole } from '../types'; // [!!!] 确保导入 UserRole
import { PIGSTY_TYPE_NAMES } from '../constants';

// 接口定义：组件接收的 Props
interface PigstyManagementProps {
  pigsties: RealPigsty[];
  users: User[];
  onAddPigsty: (pigstyData: Omit<RealPigsty, 'id'>) => Promise<void>;
  onUpdatePigsty: (id: number, pigstyData: RealPigsty) => Promise<void>;
  onDeletePigsty: (id: number) => Promise<void>;
}

// 猪舍添加/编辑弹窗组件
const PigstyModal: React.FC<{
  pigsty: RealPigsty | null;
  users: User[];
  onClose: () => void;
  onSave: (pigstyData: Omit<RealPigsty, 'id'> | RealPigsty) => void;
}> = ({ pigsty, users, onClose, onSave }) => {
  const [name, setName] = useState(pigsty?.name || '');
  const [location, setLocation] = useState(pigsty?.location || '');
  const [capacity, setCapacity] = useState(pigsty?.capacity || 100);
  const [technicianId, setTechnicianId] = useState<number | null>(pigsty?.technicianId || null);

  // 阈值状态 - 匹配后端模型
  const [tempThresholdHigh, setTempThresholdHigh] = useState(pigsty?.tempThresholdHigh ?? 30);
  const [tempThresholdLow, setTempThresholdLow] = useState(pigsty?.tempThresholdLow ?? 18);
  const [humidityThresholdHigh, setHumidityThresholdHigh] = useState(pigsty?.humidityThresholdHigh ?? 80);
  const [humidityThresholdLow, setHumidityThresholdLow] = useState(pigsty?.humidityThresholdLow ?? 50);
  const [ammoniaThresholdHigh, setAmmoniaThresholdHigh] = useState(pigsty?.ammoniaThresholdHigh ?? 20);
  const [lightThresholdHigh, setLightThresholdHigh] = useState(pigsty?.lightThresholdHigh ?? 150);
  const [lightThresholdLow, setLightThresholdLow] = useState(pigsty?.lightThresholdLow ?? 50);


  const handleSave = () => {
    if (!name.trim() || capacity <= 0) {
      alert('请正确填写名称和容量。');
      return;
    }
    const pigstyData: Omit<RealPigsty, 'id'> = {
      name: name.trim(),
      location: location.trim(),
      capacity,
      technicianId: technicianId === null ? undefined : technicianId,
      tempThresholdHigh,
      tempThresholdLow,
      humidityThresholdHigh,
      humidityThresholdLow,
      ammoniaThresholdHigh,
      lightThresholdHigh,
      lightThresholdLow,
    };
    if (pigsty) {
      onSave({ ...pigsty, ...pigstyData });
    } else {
      onSave(pigstyData);
    }
  };

  // [!!! 关键修复 !!!] 
  // 过滤 users 数组时，使用 types.ts 中定义的 UserRole.Technician
  const technicians = users.filter(u => u.role === UserRole.Technician);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-sky-400">{pigsty ? '编辑猪舍' : '添加新猪舍'}</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 名称, 位置, 容量 */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">名称*</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required/>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">位置</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">容量*</label>
            <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md" required min="1"/>
          </div>
          
          {/* 分配的技术员 (下拉菜单现在可以正确工作了) */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">分配的技术员</label>
            <select value={technicianId ?? ''} onChange={e => setTechnicianId(e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-700 p-2 rounded-md">
              <option value="">未分配</option>
              {technicians.map(u => <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>)}
            </select>
          </div>

          {/* 阈值设置 */}
          <div className="pt-4 border-t border-slate-700 mt-4">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">警报阈值设置</h3>
             <div className="grid grid-cols-2 gap-4">
                {/* 温度 */}
                <div>
                    <label className="block text-sm text-slate-300 mb-1">温度上限 (°C)</label>
                    <input type="number" step="0.1" value={tempThresholdHigh} onChange={e => setTempThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-1">温度下限 (°C)</label>
                    <input type="number" step="0.1" value={tempThresholdLow} onChange={e => setTempThresholdLow(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                {/* 湿度 */}
                <div>
                    <label className="block text-sm text-slate-300 mb-1">湿度上限 (%)</label>
                    <input type="number" step="0.1" value={humidityThresholdHigh} onChange={e => setHumidityThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                 <div>
                    <label className="block text-sm text-slate-300 mb-1">湿度下限 (%)</label>
                    <input type="number" step="0.1" value={humidityThresholdLow} onChange={e => setHumidityThresholdLow(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                {/* 氨气 */}
                <div>
                    <label className="block text-sm text-slate-300 mb-1">氨气上限 (ppm)</label>
                    <input type="number" step="0.1" value={ammoniaThresholdHigh} onChange={e => setAmmoniaThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                {/* 光照 */}
                <div>
                    <label className="block text-sm text-slate-300 mb-1">光照上限 (lux)</label>
                    <input type="number" step="1" value={lightThresholdHigh} onChange={e => setLightThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-1">光照下限 (lux)</label>
                    <input type="number" step="1" value={lightThresholdLow} onChange={e => setLightThresholdLow(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
             </div>
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

// 主组件：猪舍管理页面
export const PigstyManagement: React.FC<PigstyManagementProps> = ({ pigsties, users, onAddPigsty, onUpdatePigsty, onDeletePigsty }) => {
  const [editingPigsty, setEditingPigsty] = useState<RealPigsty | null>(null);
  const [isAddingPigsty, setIsAddingPigsty] = useState(false);

  const handleSavePigsty = async (pigstyData: Omit<RealPigsty, 'id'> | RealPigsty) => {
    try {
        if ('id' in pigstyData) {
          await onUpdatePigsty(pigstyData.id, pigstyData);
        } else {
          await onAddPigsty(pigstyData);
        }
        setEditingPigsty(null);
        setIsAddingPigsty(false);
    } catch (error) {
        console.error("Failed to save pigsty:", error);
        alert(`保存猪舍失败: ${error}`);
    }
  }
  
  const handleDelete = async (id: number) => {
      if (window.confirm('您确定要删除这个猪舍吗？此操作无法撤销。')) {
          try {
              await onDeletePigsty(id);
          } catch (error) {
              console.error("Failed to delete pigsty:", error);
              alert(`删除猪舍失败: ${error}`);
          }
      }
  }

  const getTechnicianName = (id: number | null | undefined) => {
    if (id === null || id === undefined) return '未分配';
    // [!!! 关键修复 !!!] 确保 users 数组存在再 find
    return users?.find(u => u.id === id)?.name || `未知用户 (ID: ${id})`;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-400">猪舍管理</h2>
          <button onClick={() => { setEditingPigsty(null); setIsAddingPigsty(true); }} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
            添加猪舍
        </button>
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">位置</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">技术员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">容量</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {pigsties?.map(pigsty => (
                <tr key={pigsty.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{pigsty.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{pigsty.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{getTechnicianName(pigsty.technicianId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{pigsty.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => { setIsAddingPigsty(false); setEditingPigsty(pigsty); }} className="text-sky-400 hover:text-sky-300">编辑</button>
                    <button onClick={() => handleDelete(pigsty.id)} className="text-red-400 hover:text-red-300">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      
      {(editingPigsty || isAddingPigsty) && (
        <PigstyModal
          pigsty={editingPigsty}
          users={users} // 传递的是 App.tsx 里的完整 users 列表
          onClose={() => {setEditingPigsty(null); setIsAddingPigsty(false);}}
          onSave={handleSavePigsty}
        />
      )}
    </div>
  );
};


