
import React, { useState } from 'react';
import { Device, Pigsty, MetricType } from '../types';
import { METRIC_NAMES } from '../constants';

interface DeviceManagementProps {
    devices: Device[];
    pigsties: Pigsty[];
    onAddDevice: (pigstyId: number, type: MetricType) => void;
    onToggleDeviceStatus: (id: string) => void;
}

const AddDeviceModal: React.FC<{
    pigsties: Pigsty[];
    devices: Device[];
    onClose: () => void;
    onSave: (pigstyId: number, type: MetricType) => void;
}> = ({ pigsties, devices, onClose, onSave }) => {
    const [pigstyId, setPigstyId] = useState<number | ''>(pigsties[0]?.id || '');
    const [type, setType] = useState<MetricType>(MetricType.Temperature);

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

        onSave(pigstyId, type);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-sky-400">添加新设备</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">猪舍</label>
                        <select value={pigstyId} onChange={e => setPigstyId(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md">
                           {pigsties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">设备类型</label>
                        <select value={type} onChange={e => setType(e.target.value as MetricType)} className="w-full bg-slate-700 p-2 rounded-md">
                           {Object.values(MetricType).map(t => <option key={t} value={t}>{METRIC_NAMES[t]}</option>)}
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


export const DeviceManagement: React.FC<DeviceManagementProps> = ({ devices, pigsties, onAddDevice, onToggleDeviceStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (pigstyId: number, type: MetricType) => {
        onAddDevice(pigstyId, type);
        setIsModalOpen(false);
    };

    const pigstiesWithDevices = pigsties.map(pigsty => ({
        ...pigsty,
        devices: devices.filter(d => d.pigstyId === pigsty.id),
    }));

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
            <div className="p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-sky-400">设备管理</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold">
                    添加设备
                </button>
            </div>
            <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-6">
                {pigstiesWithDevices.map(pigsty => (
                    <div key={pigsty.id}>
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">{pigsty.name}</h3>
                        <div className="bg-slate-900/50 rounded-md">
                            <table className="min-w-full divide-y divide-slate-700/50">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">设备类型</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                                        <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {pigsty.devices.map(device => (
                                        <tr key={device.id}>
                                            <td className="px-4 py-3 text-sm text-slate-200">{METRIC_NAMES[device.type]}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {device.isActive ? '激活' : '未激活'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium">
                                                <button onClick={() => onToggleDeviceStatus(device.id)} className={`${device.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}>
                                                    {device.isActive ? '停用' : '激活'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                     {pigsty.devices.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-sm text-slate-500">未给该猪舍分配设备。</td>
                                        </tr>
                                     )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <AddDeviceModal pigsties={pigsties} devices={devices} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};
