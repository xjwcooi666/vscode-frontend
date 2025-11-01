import React, { useState, useEffect } from 'react';
// [!!! 关键改动 !!!] 导入我们需要的真实类型
import { Alert, Pigsty } from '../types';
import { Pigsty as RealPigsty } from '../services/api';

// 导入子组件
import { AlertsTable } from './AlertsTable';
import { AlertModal } from './AlertModal';
// import { DataControls } from './DataControls'; // 移除模拟 API 的组件
// import { exportToCsv } from '../utils/csvExporter'; // 移除模拟 API 的功能
// import { getFilteredAlerts } from '../services/apiService'; // 移除模拟 API
import { METRIC_NAMES, ALERT_LEVEL_NAMES } from '../constants';

// PigstyReading 类型 (最好从 types.ts 或 api.ts 导入)
type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  pigstyId: string;
  timestamp: string;
};

interface AlertsViewProps {
  alerts: Alert[]; // 接收 App.tsx 传来的 realAlerts
  pigsties: RealPigsty[]; // 接收 App.tsx 传来的 realPigsties
  realReadings: PigstyReading[]; // [!!! 新增 !!!] 接收真实读数
  onAcknowledgeWarning: (id: number) => Promise<void>; // [!!! 新增 !!!] 接收确认函数
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, pigsties, realReadings, onAcknowledgeWarning }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  
  // [!!! 简化 !!!] 
  // 我们不再需要 displayedAlerts, isQuerying, hasQueried
  // App.tsx 传来的 `alerts` prop (即 realAlerts) 已经是最新/未处理的列表
  const displayedAlerts = alerts;

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };
  
  const handleCloseModal = () => {
    setSelectedAlert(null);
  };

  // [!!! 修复 !!!] 
  // 从 realReadings 中查找当前猪舍的最新读数
  const getLatestReadingForAlert = (alert: Alert) => {
    // 后端 WarningLog 里的 pigstyId 可能是数字，也可能是字符串，我们统一转为字符串比较
    const pigstyIdStr = String(alert.pigstyId); 
    const pigstyReadings = realReadings?.filter(r => String(r.pigstyId) === pigstyIdStr) || [];
    
    // 确保按时间排序
    pigstyReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return pigstyReadings.length > 0 ? pigstyReadings[pigstyReadings.length - 1] : undefined;
  };

  // [!!! 移除 !!!] 移除基于模拟 API 的 handleFilter, handleReset, handleExport
  // const handleFilter = async (...) => { ... }
  // const handleReset = () => { ... }
  // const handleExport = () => { ... }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-sky-400 mb-6">警报记录 (未处理)</h2>
        {/* [!!! 移除 !!!] 移除了 DataControls */}
        {/* <DataControls onFilter={handleFilter} onReset={handleReset} onExport={handleExport} /> */}
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        {/* [!!! 简化 !!!] 移除了 isQuerying 逻辑 */}
        {displayedAlerts && displayedAlerts.length > 0 ? (
          <AlertsTable 
            alerts={displayedAlerts} 
            onAlertClick={handleAlertClick}
            // [!!! 新增 !!!] 传递“确认”函数给子组件
            // 你需要在 AlertsTable.tsx 中添加一个按钮来调用这个
            onAcknowledgeWarning={onAcknowledgeWarning} 
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400">
              {/* [!!! 简化 !!!] */}
              "最近没有触发任何未处理的警报。"
            </p>
          </div>
        )}
      </div>
      {selectedAlert && (
        <AlertModal 
          alert={selectedAlert} 
          onClose={handleCloseModal}
          // [!!! 修复 !!!] 传递正确的读数
          latestReading={getLatestReadingForAlert(selectedAlert)}
        />
      )}
    </div>
  );
};