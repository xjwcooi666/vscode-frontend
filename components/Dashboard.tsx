import React from 'react';
// [!!! 关键修复 !!!] 
// 恢复为 './' 相对路径，并 *移除* .ts/.tsx 扩展名
import { Pigsty as RealPigsty, Device as RealDevice, MetricType } from '../services/api';
import { UserRole, User } from '../types';

// [!!! 关键修复 !!!] 
// 定义一个 CurrentUser 接口 (从 App.tsx 移过来，或者从 App.tsx 导出并导入)
// 为简单起见，我们在这里重新定义
interface CurrentUser extends User {
  username?: string; // 确保 username 是可选的，以匹配 User 接口
}

// 导入读数类型
type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  light?: number | null;
  pigstyId: string;
  timestamp: string;
};

// [!!! 关键修复 !!!] 
// 恢复为 './' 相对路径，并 *移除* .ts/.tsx 扩展名
import { MetricCard } from './MetricCard';
import { LineChartCard } from './LineChartCard';

interface DashboardProps {
  realPigsties: RealPigsty[];
  realDevices: RealDevice[];
  realReadings: PigstyReading[];
  currentUser: CurrentUser; // 接收 currentUser 对象
}

// 辅助函数：转换阈值格式 (使用字符串 key)
const transformThresholds = (pigsty: RealPigsty) => {
    const thresholds: any = {};
    if (pigsty.tempThresholdHigh !== undefined || pigsty.tempThresholdLow !== undefined) {
        thresholds["TEMPERATURE"] = { high: pigsty.tempThresholdHigh, low: pigsty.tempThresholdLow };
    }
    if (pigsty.humidityThresholdHigh !== undefined || pigsty.humidityThresholdLow !== undefined) {
        thresholds["HUMIDITY"] = { high: pigsty.humidityThresholdHigh, low: pigsty.humidityThresholdLow };
    }
    if (pigsty.ammoniaThresholdHigh !== undefined) {
        thresholds["AMMONIA"] = { high: pigsty.ammoniaThresholdHigh };
    }
    if (pigsty.lightThresholdHigh !== undefined || pigsty.lightThresholdLow !== undefined) {
        thresholds["LIGHT"] = { high: pigsty.lightThresholdHigh, low: pigsty.lightThresholdLow };
    }
    return thresholds;
};


export const Dashboard: React.FC<DashboardProps> = ({ realPigsties, realDevices, realReadings, currentUser }) => {

  // 根据当前用户的角色过滤猪舍
  const userPigsties = (currentUser.role === UserRole.Admin || currentUser.role === 'ADMIN')
    ? realPigsties
    : realPigsties?.filter(p => p.technicianId === currentUser.id);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6">
        {userPigsties?.map(pigsty => {
          const pigstyIdStr = String(pigsty.id);
          const activeDevices = realDevices?.filter(d => d.pigstyId === pigsty.id && d.active) || [];
          const pigstyReadings = realReadings?.filter(r => r.pigstyId === pigstyIdStr) || [];
          pigstyReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const latestReading = pigstyReadings.length > 0 ? pigstyReadings[pigstyReadings.length - 1] : null;
          const formattedThresholds = transformThresholds(pigsty);
          const hasActiveDevices = activeDevices.length > 0;
          const hasLatestReading = latestReading !== null;

          return (
            <div key={pigsty.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-lg">
              <h2 className="text-2xl font-bold text-sky-400 mb-4">
                {pigsty.name}
                {pigsty.location && <span className="text-sm font-normal text-slate-400 ml-2">({pigsty.location})</span>}
              </h2>

              {hasActiveDevices && hasLatestReading ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {activeDevices.map(device => (
                      <MetricCard
                        key={device.id}
                        metric={device.type}
                        reading={latestReading}
                        thresholds={formattedThresholds[device.type]} 
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {activeDevices.map(device => (
                        <LineChartCard
                            key={device.id}
                            metric={device.type}
                            readings={pigstyReadings}
                        />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-500">
                   {realDevices?.some(d => d.pigstyId === pigsty.id) ? "此猪舍的设备均未激活或无最新读数。" : "此猪舍尚未添加任何设备。" }
                </div>
              )}
            </div>
          );
        })}
        {(!userPigsties || userPigsties.length === 0) && (
          <div className="text-center py-10">
            <p className="text-slate-400">
              {/* [!!! 关键改动 !!!] 简化提示 */}
              {currentUser.role === UserRole.Admin ? "尚未创建任何猪舍。" : "您尚未被分配到任何猪舍。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

