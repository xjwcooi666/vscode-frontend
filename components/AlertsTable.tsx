import React from 'react';
// [!!! 关键修复 !!!] 
// 我们的 props.alerts 实际上是后端的 WarningLog[]。
// 我们在这里使用 any 来避免类型冲突，或者你需要一个 WarningLog 接口
// 我们假设 App.tsx 传来的 Alert 类型已经和后端 WarningLog 匹配
import { Alert, AlertLevel } from '../types'; 
import { ALERT_LEVEL_CONFIG, METRIC_CONFIG, METRIC_NAMES, ALERT_LEVEL_NAMES } from '../constants';

interface AlertsTableProps {
  alerts: Alert[]; // 实际上是 WarningLog[]
  onAlertClick: (alert: Alert) => void;
  // [!!! 新增 !!!] 接收“确认”函数
  onAcknowledgeWarning: (id: number) => void; 
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, onAlertClick, onAcknowledgeWarning }) => {
  
  // 辅助函数，安全地获取值
  const getAlertValue = (alert: any): string => {
      // [!!! 关键修复 !!!] 读取 actualValue 而不是 value
      const value = alert.actualValue; 
      if (typeof value === 'number') {
          return value.toFixed(1); // 修复 toFixed 错误
      }
      if (value) {
          return String(value); // 万一是其他类型
      }
      return '--'; // 如果是 null 或 undefined
  };

  // 辅助函数，安全地获取单位
  const getUnit = (alert: any): string => {
      // [!!! 关键修复 !!!] 读取 metricType 而不是 metric
      const metricString = alert.metricType; 
      if (metricString && METRIC_CONFIG[metricString]) {
          return METRIC_CONFIG[metricString].unit || '?';
      }
      return '?';
  };

  // 辅助函数，安全地获取指标名称
  const getMetricName = (alert: any): string => {
      const metricString = alert.metricType;
      if (metricString && METRIC_NAMES[metricString]) {
          return METRIC_NAMES[metricString];
      }
      return metricString || '未知指标';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">时间戳</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">猪舍 ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">指标</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">数值</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">级别</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">详情</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-900 divide-y divide-slate-800">
          {/* [!!! 关键修复 !!!] 确保 alerts 存在再 map */}
          {alerts?.map((alert: any) => { // 使用 any 来访问 actualValue
            
            // [!!! 关键修复 !!!] 
            // 后端 WarningLog 没有 level 字段, 我们需要根据值和阈值 *重新计算* // (这是一个简化的占位逻辑，你需要一个更复杂的 getStatus)
            const level = AlertLevel.Warning; // 暂时硬编码为 Warning
            const levelConfig = ALERT_LEVEL_CONFIG[level];
            
            return (
              <tr key={alert.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(alert.timestamp).toLocaleString()}</td>
                {/* [!!! 关键修复 !!!] 读取 pigstyId */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{alert.pigstyId}</td>
                {/* [!!! 关键修复 !!!] 使用辅助函数 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getMetricName(alert)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getAlertValue(alert)} {getUnit(alert)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {levelConfig ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelConfig.color}`}>
                      {levelConfig.icon}{ALERT_LEVEL_NAMES[level]}
                    </span>
                  ) : (
                    <span className="text-slate-400">未知</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 max-w-xs truncate">{alert.message}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  {/* [!!! 新增 !!!] 确认按钮 */}
                  <button 
                    onClick={() => onAcknowledgeWarning(alert.id)} 
                    className="text-green-400 hover:text-green-300"
                  >
                    确认
                  </button>
                  {/* [!!! 移除 !!!] 移除 AI 分析按钮 (因为它依赖 gemini) */}
                  {/* <button onClick={() => onAlertClick(alert)} className="text-sky-400 hover:text-sky-300">
                    AI分析
                  </button> */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};