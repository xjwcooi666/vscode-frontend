import React, { useState } from 'react';

import { Device, Pigsty, MetricType } from '../services/api';

import { METRIC_NAMES } from '../constants';

type OperatingStatus = 'online' | 'error';

const getOperatingStatusConfig = (status: string | undefined): { label: string; color: string; icon: string } => {
  const normalizedStatus = (status || 'online').toLowerCase() as OperatingStatus;
  switch (normalizedStatus) {
    case 'online':
      return {
        label: '在线正常',
        color: 'bg-green-500/20 text-green-400',
        icon: '🟢',
      };
    case 'error':
      return {
        label: '传感器故障',
        color: 'bg-red-500/20 text-red-400',
        icon: '🔴',
      };
    default:
      return {
        label: '在线正常',
        color: 'bg-green-500/20 text-green-400',
        icon: '🟢',
      };
  }
};

interface DeviceManagementProps {
  devices: Device[]; 
  pigsties: Pigsty[];
  onAddDevice: (deviceData: Omit<Device, 'id' | 'active'>) => Promise<void>;
  onToggleDeviceStatus: (id: number) => Promise<void>;
  onDeleteDevice: (id: number) => Promise<void>;
  onResetDevice: (id: number) => Promise<void>;
}

const AddDeviceModal: React.FC<{
  pigsties: Pigsty[];
  devices: Device[];
  onClose: () => void;
  onSave: (deviceData: Omit<Device, 'id' | 'active'>) => void;
}> = ({ pigsties, devices, onClose, onSave }) => {
  const [pigstyId, setPigstyId] = useState<number | ''>(pigsties[0]?.id || '');
  const [type, setType] = useState<MetricType>(MetricType.TEMPERATURE);

  const handleSave = () => {
    if (pigstyId === '') {
      alert('请选择一个猪舍。');
      return;
    }

    const existingDevice = devices.find(d => d.pigstyId === pigstyId && d.type === type);
    if (existingDevice) {
      alert(`该猪舍已存在一个${METRIC_NAMES[type]}传感器。`);
      return;
    }

    const deviceData: Omit<Device, 'id' | 'active'> = {
        pigstyId: pigstyId,
        type: type,
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
              <option value="" disabled>请选择猪舍</option>
              {pigsties.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">设备类型</label>
            <select value={type} onChange={e => setType(e.target.value as MetricType)} className="w-full bg-slate-700 p-2 rounded-md">
              {Object.keys(MetricType).map((key) => (
                  <option key={key} value={MetricType[key as keyof typeof MetricType]}>
                      {METRIC_NAMES[MetricType[key as keyof typeof MetricType]] || key}
                  </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">取消</button>
          <button onClick={handleSave} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">添加设备</button>
        </div>
      </div>
    </div>
  );
};

export const DeviceManagement: React.FC<DeviceManagementProps> = ({ 
  devices, 
  pigsties, 
  onAddDevice, 
  onToggleDeviceStatus, 
  onDeleteDevice,
  onResetDevice 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resettingDeviceId, setResettingDeviceId] = useState<number | null>(null);

  const handleResetDevice = async (deviceId: number) => {
    setResettingDeviceId(deviceId);
    try {
      await onResetDevice(deviceId);
      alert('设备复位指令已发送');
    } catch (error) {
      console.error("Failed to reset device:", error);
      alert(`设备复位失败: ${error}`);
    } finally {
      setResettingDeviceId(null);
    }
  };

  const handleSaveDevice = async (deviceData: Omit<Device, 'id' | 'active'>) => {
    try {
      await onAddDevice(deviceData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add device:", error);
      alert(`添加设备失败: ${error}`);
    }
  };

  const handleToggle = async (id: number) => {
      try {
          await onToggleDeviceStatus(id);
      } catch (error) {
          console.error("Failed to toggle device status:", error);
          alert(`切换设备状态失败: ${error}`);
      }
  };

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

  const pigstiesWithDevices = pigsties.map(pigsty => ({
    ...pigsty,
    devices: devices?.filter(d => d.pigstyId === pigsty.id) || [],
  }));

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-400">设备管理</h2>
        {pigsties && pigsties.length > 0 && (
            <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
                添加设备
            </button>
        )}
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-6">
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
                  {pigsty.devices.map(device => {
                    const operatingStatus = device.operatingStatus || 'online';
                    const statusConfig = getOperatingStatusConfig(operatingStatus);
                    const showResetButton = device.active && operatingStatus === 'error';
                    const isResetting = resettingDeviceId === device.id;
                    
                    return (
                      <tr key={device.id}>
                        <td className="px-4 py-3 text-sm text-slate-200">{METRIC_NAMES[device.type] || device.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{device.modelNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{device.serialNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm w-32 min-w-32">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`block px-2 py-0.5 text-xs font-semibold rounded-full ${device.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                              {device.active ? '激活' : '停用'}
                            </span>
                            {device.active ? (
                              <span className={`block px-2 py-0.5 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                                {statusConfig.icon} {statusConfig.label}
                              </span>
                            ) : (
                              <span className="block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-500">
                                ⚪ 未监控
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium w-40 min-w-40">
                          <div className="flex items-center justify-end gap-3">
                            {showResetButton && (
                              <button 
                                onClick={() => handleResetDevice(device.id)} 
                                disabled={isResetting}
                                className={`text-orange-400 hover:text-orange-300 whitespace-nowrap ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isResetting ? '复位中...' : '复位'}
                              </button>
                            )}
                            <button 
                              onClick={() => handleToggle(device.id)} 
                              className={`whitespace-nowrap ${device.active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                            >
                              {device.active ? '停用' : '激活'}
                            </button>
                            <button 
                              onClick={() => handleDelete(device.id)} 
                              className="text-red-400 hover:text-red-300 whitespace-nowrap"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
         {(!pigsties || pigsties.length === 0) && (
             <p className="text-center text-slate-500 py-4">请先在"猪舍管理"中添加猪舍。</p>
         )}
      </div>
      {isModalOpen && pigsties && pigsties.length > 0 && (
          <AddDeviceModal
              pigsties={pigsties}
              devices={devices}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveDevice}
          />
       )}
    </div>
  );
};
