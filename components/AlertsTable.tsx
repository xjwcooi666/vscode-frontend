import React from 'react';
import { Alert, AlertLevel } from '../types';
import { ALERT_LEVEL_CONFIG, METRIC_CONFIG, METRIC_NAMES, ALERT_LEVEL_NAMES } from '../constants';

interface AlertsTableProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, onAlertClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">时间戳</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">猪舍</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">指标</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">数值</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">级别</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">详情</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">AI分析</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-900 divide-y divide-slate-800">
          {alerts.map((alert) => {
            const levelConfig = ALERT_LEVEL_CONFIG[alert.level as AlertLevel];
            const metricConfig = METRIC_CONFIG[alert.metric];
            return (
              <tr key={alert.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(alert.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{alert.pigstyName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{METRIC_NAMES[alert.metric]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{alert.value.toFixed(2)} {metricConfig.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelConfig.color}`}>
                    {levelConfig.icon}{ALERT_LEVEL_NAMES[alert.level]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 max-w-xs truncate">{alert.message}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onAlertClick(alert)} className="text-sky-400 hover:text-sky-300">
                    AI分析
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};