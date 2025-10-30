import React, { useState, useEffect } from 'react';
// [!!! 关键修复 !!!] 从 types.ts 导入正确的 Pigsty, User, MetricType
import { Pigsty, User, MetricType } from '../types'; 
// 移除 ThresholdConfig, 我们直接在 Pigsty 类型里定义阈值字段
// import { ThresholdConfig } from '../types'; 

// 导入常量
import { PIGSTY_TYPE_NAMES } from '../constants'; // 假设这个常量仍然有用 (虽然 Pigsty 类型里没有 type 了)

// 接口定义：组件接收的 Props (使用正确的 Pigsty 类型)
interface PigstyManagementProps {
  pigsties: Pigsty[]; 
  users: User[];
  onAddPigsty: (pigstyData: Omit<Pigsty, 'id'>) => Promise<void>; 
  onUpdatePigsty: (id: number, pigstyData: Pigsty) => Promise<void>; 
  onDeletePigsty: (id: number) => Promise<void>;
}

// 猪舍添加/编辑弹窗组件 (使用正确的 Pigsty 类型)
const PigstyModal: React.FC<{
  pigsty: Pigsty | null; 
  users: User[];
  onClose: () => void;
  onSave: (pigstyData: Omit<Pigsty, 'id'> | Pigsty) => void; 
}> = ({ pigsty, users, onClose, onSave }) => {
  // 状态与 types.ts 中的 Pigsty 接口匹配
  const [name, setName] = useState(pigsty?.name || '');
  const [location, setLocation] = useState(pigsty?.location || ''); 
  const [capacity, setCapacity] = useState(pigsty?.capacity || 100);
  const [technicianId, setTechnicianId] = useState<number | null>(pigsty?.technicianId || null);
  const [tempThresholdHigh, setTempThresholdHigh] = useState(pigsty?.tempThresholdHigh ?? 30);
  const [tempThresholdLow, setTempThresholdLow] = useState(pigsty?.tempThresholdLow ?? 18);
  const [humidityThresholdHigh, setHumidityThresholdHigh] = useState(pigsty?.humidityThresholdHigh ?? 80);
  const [humidityThresholdLow, setHumidityThresholdLow] = useState(pigsty?.humidityThresholdLow ?? 50);
  const [ammoniaThresholdHigh, setAmmoniaThresholdHigh] = useState(pigsty?.ammoniaThresholdHigh ?? 20);

  const handleSave = () => {
    if (!name.trim() || capacity <= 0) {
      alert('请正确填写名称和容量。');
      return;
    }
    // [!!! 关键修复 !!!] 构建与 types.ts 的 Pigsty 匹配的对象
    const pigstyData: Omit<Pigsty, 'id'> = {
      name: name.trim(),
      location: location.trim(), // location 是可选的，但我们这里传递空字符串如果没填
      capacity,
      // 如果 technicianId 是 null，我们应该传递 null 或 undefined (取决于后端如何处理)
      // 假设后端接受 null
      technicianId: technicianId, 
      tempThresholdHigh,
      tempThresholdLow,
      humidityThresholdHigh,
      humidityThresholdLow,
      ammoniaThresholdHigh,
    };

    if (pigsty) {
      // 传递完整的 Pigsty 对象给 onSave，包含 id
      onSave({ ...pigsty, ...pigstyData }); 
    } else {
      // 传递不包含 id 的对象给 onSave
      onSave(pigstyData); 
    }
  };

  // 假设技术员的角色是 'USER'，或者你可以根据实际情况调整
  const technicians = users.filter(u => u.role === 'USER' || u.role?.toString() === 'USER'); 

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-sky-400">{pigsty ? '编辑猪舍' : '添加新猪舍'}</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 名称 */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">名称*</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required/>
          </div>
          {/* 位置 */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">位置</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
          </div>
          {/* 容量 */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">容量*</label>
            <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md" required min="1"/>
          </div>
          {/* 分配的技术员 */}
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
                <div>
                    <label className="block text-sm text-slate-300 mb-1">温度上限 (°C)</label>
                    <input type="number" step="0.1" value={tempThresholdHigh} onChange={e => setTempThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-1">温度下限 (°C)</label>
                    <input type="number" step="0.1" value={tempThresholdLow} onChange={e => setTempThresholdLow(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-1">湿度上限 (%)</label>
                    <input type="number" step="0.1" value={humidityThresholdHigh} onChange={e => setHumidityThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                 <div>
                    <label className="block text-sm text-slate-300 mb-1">湿度下限 (%)</label>
                    <input type="number" step="0.1" value={humidityThresholdLow} onChange={e => setHumidityThresholdLow(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-1">氨气上限 (ppm)</label>
                    <input type="number" step="0.1" value={ammoniaThresholdHigh} onChange={e => setAmmoniaThresholdHigh(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
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

// 主组件：猪舍管理页面 (使用正确的 Pigsty 类型)
export const PigstyManagement: React.FC<PigstyManagementProps> = ({ pigsties, users, onAddPigsty, onUpdatePigsty, onDeletePigsty }) => {
  const [editingPigsty, setEditingPigsty] = useState<Pigsty | null>(null); 
  const [isAddingPigsty, setIsAddingPigsty] = useState(false);

  // handleSavePigsty 现在直接调用 App.tsx 传来的函数，不再需要在这里实现
  const handleSavePigstyWrapper = async (pigstyData: Omit<Pigsty, 'id'> | Pigsty) => {
    try {
        if ('id' in pigstyData) {
          // 调用 App.tsx 的 onUpdatePigsty
          await onUpdatePigsty(pigstyData.id, pigstyData); 
        } else {
          // 调用 App.tsx 的 onAddPigsty
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
              // 调用 App.tsx 的 onDeletePigsty
              await onDeletePigsty(id); 
          } catch (error) {
              console.error("Failed to delete pigsty:", error);
              alert(`删除猪舍失败: ${error}`);
          }
      }
  }

  // 获取技术员姓名
  const getTechnicianName = (id: number | null | undefined) => {
    if (id === null || id === undefined) return '未分配';
    // 确保 users 数组已加载
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
              {/* [!!! 关键修复 !!!] 确保 pigsties 数组存在再 map */}
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
          users={users}
          onClose={() => {setEditingPigsty(null); setIsAddingPigsty(false);}}
          // [!!! 关键修复 !!!] 传递正确的包装函数
          onSave={handleSavePigstyWrapper} 
        />
      )}
    </div>
  );
};