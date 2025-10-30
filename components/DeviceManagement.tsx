import React, { useState } from 'react';
// [!!! 关键修复 !!!] 从 api.ts 或 types.ts 导入正确的类型
// 我们假设 api.ts 导出了这些类型
import { Device, Pigsty, MetricType } from '../services/api';
// 如果你的 METRIC_NAMES 来自 constants.ts, 确保导入
import { METRIC_NAMES } from '../constants';

// 接口定义：组件接收的 Props
interface DeviceManagementProps {
  devices: Device[]; // 使用真实的 Device 类型
  pigsties: Pigsty[]; // 使用真实的 Pigsty 类型
  onAddDevice: (deviceData: Omit<Device, 'id' | 'active'>) => Promise<void>; // 修改了参数
  onToggleDeviceStatus: (id: number) => Promise<void>; // ID 改为 number
  onDeleteDevice: (id: number) => Promise<void>; // 新增删除函数
}

// 添加设备弹窗 (基本不变，但类型使用导入的)
const AddDeviceModal: React.FC<{
  pigsties: Pigsty[];
  devices: Device[];
  onClose: () => void;
  onSave: (deviceData: Omit<Device, 'id' | 'active'>) => void; // 修改参数类型
}> = ({ pigsties, devices, onClose, onSave }) => {
  const [pigstyId, setPigstyId] = useState<number | ''>(pigsties[0]?.id || '');
  const [type, setType] = useState<MetricType>(MetricType.TEMPERATURE); // 使用导入的 MetricType

  const handleSave = () => {
    if (pigstyId === '') {
      alert('请选择一个猪舍。');
      return;
    }

    // 检查是否已存在同类型设备 (逻辑保持不变)
    const existingDevice = devices.find(d => d.pigstyId === pigstyId && d.type === type);
    if (existingDevice) {
      alert(`该猪舍已存在一个${METRIC_NAMES[type]}传感器。`);
      return;
    }

    // 构建要传递给 onSave 的数据对象
    const deviceData: Omit<Device, 'id' | 'active'> = {
        pigstyId: pigstyId,
        type: type,
        // modelNumber 和 serialNumber 是可选的，可以在这里添加输入框
        // modelNumber: '',
        // serialNumber: '',
    };
    onSave(deviceData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-sky-400">添加新设备</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">猪舍</label>
            <select value={pigstyId} onChange={e => setPigstyId(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md">
              {/* 添加一个默认空选项 */}
              <option value="" disabled>请选择猪舍</option>
              {pigsties.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">设备类型</label>
            <select value={type} onChange={e => setType(e.target.value as MetricType)} className="w-full bg-slate-700 p-2 rounded-md">
              {/* 使用 Object.keys 遍历枚举 */}
              {Object.keys(MetricType).map((key) => (
                  <option key={key} value={MetricType[key as keyof typeof MetricType]}>
                      {METRIC_NAMES[MetricType[key as keyof typeof MetricType]] || key}
                  </option>
              ))}
            </select>
          </div>
          {/* 可选：添加型号和序列号的输入框 */}
          {/*
          <div>
            <label className="block text-sm text-slate-300 mb-1">设备型号 (可选)</label>
            <input type="text" ... />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">序列号 (可选)</label>
            <input type="text" ... />
          </div>
          */}
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
          <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">添加设备</button>
        </div>
      </div>
    </div>
  );
};


// 主组件：设备管理页面
export const DeviceManagement: React.FC<DeviceManagementProps> = ({ devices, pigsties, onAddDevice, onToggleDeviceStatus, onDeleteDevice }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 保存设备的处理函数 (调用 App.tsx 传来的 onAddDevice)
  const handleSaveDevice = async (deviceData: Omit<Device, 'id' | 'active'>) => {
    try {
      await onAddDevice(deviceData);
      setIsModalOpen(false); // 添加成功后关闭弹窗
    } catch (error) {
      console.error("Failed to add device:", error);
      alert(`添加设备失败: ${error}`);
    }
  };

  // 切换状态的处理函数 (调用 App.tsx 传来的 onToggleDeviceStatus)
  const handleToggle = async (id: number) => {
      try {
          await onToggleDeviceStatus(id);
          // 状态更新由 App.tsx 处理，这里不需要手动更新 UI
      } catch (error) {
          console.error("Failed to toggle device status:", error);
          alert(`切换设备状态失败: ${error}`);
      }
  };

  // [!!! 新增 !!!] 删除设备的处理函数
  const handleDelete = async (id: number) => {
      if (window.confirm('您确定要删除这个设备吗？')) {
          try {
              await onDeleteDevice(id);
          } catch (error) {
              console.error("Failed to delete device:", error);
              alert(`删除设备失败: ${error}`);
          }
      }
  };


  // 按猪舍分组设备 (逻辑不变)
  const pigstiesWithDevices = pigsties.map(pigsty => ({
    ...pigsty,
    // [!!! 关键修复 !!!] 确保 devices 数组存在再 filter
    devices: devices?.filter(d => d.pigstyId === pigsty.id) || [],
  }));

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-400">设备管理</h2>
        {/* 只有当有猪舍时才显示添加按钮 */}
        {pigsties && pigsties.length > 0 && (
            <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
                添加设备
            </button>
        )}
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-6">
        {/* [!!! 关键修复 !!!] 确保 pigstiesWithDevices 数组存在再 map */}
        {pigstiesWithDevices?.map(pigsty => (
          <div key={pigsty.id}>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">{pigsty.name} (ID: {pigsty.id})</h3>
            <div className="bg-slate-900/50 rounded-md">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">设备类型</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">型号 (可选)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">序列号 (可选)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                    <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pigsty.devices.map(device => (
                    // [!!! 关键修复 !!!] 使用 device.id 作为 key
                    <tr key={device.id}>
                      <td className="px-4 py-3 text-sm text-slate-200">{METRIC_NAMES[device.type] || device.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{device.modelNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{device.serialNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {device.active ? '激活' : '停用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium space-x-4">
                        {/* [!!! 关键修复 !!!] 传递 device.id (number) */}
                        <button onClick={() => handleToggle(device.id)} className={`${device.active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}>
                          {device.active ? '停用' : '激活'}
                        </button>
                         {/* [!!! 新增 !!!] 删除按钮 */}
                         {/* [!!! 关键修复 !!!] 传递 device.id (number) */}
                         <button onClick={() => handleDelete(device.id)} className="text-red-400 hover:text-red-300 ml-2">
                           删除
                         </button>
                      </td>
                    </tr>
                  ))}
                  {pigsty.devices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-sm text-slate-500">该猪舍尚无设备。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
         {/* 如果没有猪舍 */}
         {(!pigsties || pigsties.length === 0) && (
             <p className="text-center text-slate-500 py-4">请先在“猪舍管理”中添加猪舍。</p>
         )}
      </div>
      {/* [!!! 关键修复 !!!] 确保 pigsties 数组存在再渲染 Modal */}
      {isModalOpen && pigsties && pigsties.length > 0 && (
          <AddDeviceModal
              pigsties={pigsties}
              devices={devices} // 传递当前设备列表用于检查重复
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveDevice}
          />
       )}
    </div>
  );
};
