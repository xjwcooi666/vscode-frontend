import React from 'react';
// 导入后端定义的类型 (从 api.ts 或 types.ts)
import { Pigsty as RealPigsty, Device as RealDevice, MetricType } from '../services/api';
// 导入前端 UI 类型 (如果需要)
import { UserRole, User } from '../types';
// 导入读数类型 (最好移到 types.ts 或 api.ts)
type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  pigstyId: string; // 后端是 string
  timestamp: string; // ISO 字符串
};

import { MetricCard } from './MetricCard';
import { LineChartCard } from './LineChartCard';
import { PIGSTY_TYPE_NAMES, METRIC_NAMES } from '../constants'; // 导入 METRIC_NAMES

interface DashboardProps {
  realPigsties: RealPigsty[];
  realDevices: RealDevice[];
  realReadings: PigstyReading[];
  currentUserRole: UserRole;
  viewingAsTechnician: User | null;
}

// 辅助函数：转换阈值格式
const transformThresholds = (pigsty: RealPigsty) => {
    const thresholds: any = {};
    if (pigsty.tempThresholdHigh !== undefined || pigsty.tempThresholdLow !== undefined) {
        thresholds[MetricType.TEMPERATURE] = { high: pigsty.tempThresholdHigh, low: pigsty.tempThresholdLow };
    }
    if (pigsty.humidityThresholdHigh !== undefined || pigsty.humidityThresholdLow !== undefined) {
        thresholds[MetricType.HUMIDITY] = { high: pigsty.humidityThresholdHigh, low: pigsty.humidityThresholdLow };
    }
    if (pigsty.ammoniaThresholdHigh !== undefined) {
        thresholds[MetricType.AMMONIA] = { high: pigsty.ammoniaThresholdHigh };
    }
    // 添加其他指标...
    return thresholds;
};


export const Dashboard: React.FC<DashboardProps> = ({ realPigsties, realDevices, realReadings, currentUserRole, viewingAsTechnician }) => {

  // 可以在这里加一个顶层日志，确认 props 是否存在
  // console.log("Dashboard received props:", { realPigsties, realDevices, realReadings });

  const userPigsties = currentUserRole === UserRole.Admin
    ? realPigsties
    : realPigsties?.filter(p => p.technicianId === viewingAsTechnician?.id);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6">
        {userPigsties?.map(pigsty => {
          const pigstyIdStr = String(pigsty.id);

          // [!!! 调试日志 1 !!!] 检查正在处理哪个猪舍
          console.log(`--- Processing Pigsty ID: ${pigsty.id} (Name: ${pigsty.name}) ---`);

          const activeDevices = realDevices?.filter(d => {
              // [!!! 调试日志 2 !!!] 检查每个设备的过滤条件
              const isMatch = d.pigstyId === pigsty.id && d.active;
              console.log(`  Device ID: ${d.id}, pigstyId: ${d.pigstyId} (Type: ${typeof d.pigstyId}), active: ${d.active}. Matches pigsty ${pigsty.id}? ${isMatch}`);
              return isMatch;
          }) || [];

          // [!!! 调试日志 3 !!!] 打印过滤后的 activeDevices 数组
          console.log(`  Filtered activeDevices:`, JSON.stringify(activeDevices)); // 使用 JSON.stringify 查看完整内容


          const pigstyReadings = realReadings?.filter(r => {
              // [!!! 调试日志 4 !!!] 检查每个读数的过滤条件
              const isMatch = r.pigstyId === pigstyIdStr;
              console.log(`  Reading ID: ${r.id}, readingPigstyId: "${r.pigstyId}" (Type: ${typeof r.pigstyId}). Matches pigstyIdStr "${pigstyIdStr}"? ${isMatch}`);
              return isMatch;
          }) || [];

          // [!!! 调试日志 5 !!!] 打印过滤后的 pigstyReadings 数组
          console.log(`  Filtered pigstyReadings:`, JSON.stringify(pigstyReadings));

          // [!!! 调试日志 5.1 !!!] 排序读数，确保最新的在最后
          pigstyReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const latestReading = pigstyReadings.length > 0 ? pigstyReadings[pigstyReadings.length - 1] : null;
          console.log(`  Latest reading found:`, latestReading ? JSON.stringify(latestReading) : 'null');


          // [!!! 调试日志 6 !!!] 打印最终的判断条件及其组成部分
          const hasActiveDevices = activeDevices.length > 0;
          const hasLatestReading = latestReading !== null;
          console.log(`  Condition check: hasActiveDevices (${hasActiveDevices}) && hasLatestReading (${hasLatestReading}) = ${hasActiveDevices && hasLatestReading}`);

          const formattedThresholds = transformThresholds(pigsty);

          return (
            <div key={pigsty.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-lg">
              <h2 className="text-2xl font-bold text-sky-400 mb-4">
                {pigsty.name}
                {pigsty.location && <span className="text-sm font-normal text-slate-400 ml-2">({pigsty.location})</span>}
              </h2>

              {hasActiveDevices && hasLatestReading ? ( // 使用计算好的布尔值
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {activeDevices.map(device => (
                      <MetricCard
                        key={device.id}
                        metric={device.type}
                        // [!!! 调试日志 7 !!!] 确认传递给 MetricCard 的读数
                        reading={latestReading} // latestReading 保证不为 null
                        thresholds={formattedThresholds[device.type]}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {activeDevices.map(device => (
                        <LineChartCard
                            key={device.id}
                            metric={device.type}
                            // [!!! 调试日志 8 !!!] 确认传递给 LineChartCard 的读数数组
                            readings={pigstyReadings}
                        />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-500">
                   {/* 保持这个逻辑不变 */}
                   {realDevices?.some(d => d.pigstyId === pigsty.id) ? "此猪舍的设备均未激活或无最新读数。" : "此猪舍尚未添加任何设备。" }
                </div>
              )}
            </div>
          );
        })}
        {(!userPigsties || userPigsties.length === 0) && (
          <div className="text-center py-10">
            <p className="text-slate-400">
              {currentUserRole === UserRole.Technician ? "未给该技术员分配猪舍。" : "尚未创建任何猪舍。" }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};