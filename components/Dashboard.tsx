
import React from 'react';
import { Pigsty, MetricType, UserRole, Device, User } from '../types';
import { MetricCard } from './MetricCard';
import { LineChartCard } from './LineChartCard';
import { PIGSTY_TYPE_NAMES } from '../constants';

interface DashboardProps {
  pigsties: Pigsty[];
  devices: Device[];
  currentUserRole: UserRole;
  viewingAsTechnician: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ pigsties, devices, currentUserRole, viewingAsTechnician }) => {
  const userPigsties = currentUserRole === UserRole.Admin 
    ? pigsties 
    : pigsties.filter(p => p.technicianId === viewingAsTechnician?.id); 

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6">
        {userPigsties.map(pigsty => {
          const activeDevices = devices.filter(d => d.pigstyId === pigsty.id && d.isActive);
          const latestReading = pigsty.readings[pigsty.readings.length - 1];
          const pigstyTypeName = PIGSTY_TYPE_NAMES[pigsty.type] || pigsty.type;

          return (
            <div key={pigsty.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-lg">
              <h2 className="text-2xl font-bold text-sky-400 mb-4">{pigsty.name} <span className="text-sm font-normal text-slate-400 ml-2">({pigstyTypeName})</span></h2>
              
              {activeDevices.length > 0 && latestReading ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {activeDevices.map(device => (
                      <MetricCard key={device.id} metric={device.type} reading={latestReading} thresholds={pigsty.thresholds?.[device.type]} />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {activeDevices.map(device => (
                      <LineChartCard key={device.id} metric={device.type} readings={pigsty.readings} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  此猪舍无活动设备。
                </div>
              )}
            </div>
          )
        })}
         {userPigsties.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-400">
                {currentUserRole === UserRole.Technician 
                  ? "未给该技术员分配猪舍。"
                  : "尚未创建任何猪舍。"
                }
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
