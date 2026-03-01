import React from "react";
import { Alert, AlertLevel } from "../types";
import { ALERT_LEVEL_CONFIG, METRIC_CONFIG, METRIC_NAMES, ALERT_LEVEL_NAMES } from "../constants";

interface AlertsTableProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
  onAcknowledgeWarning: (id: number) => Promise<void>;
  canAcknowledge: boolean;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, onAlertClick, onAcknowledgeWarning, canAcknowledge }) => {
  const getAlertValue = (alert: any): string => {
    const value = alert.actualValue;
    if (typeof value === "number") return value.toFixed(1);
    if (value) return String(value);
    return "--";
  };

  const getUnit = (alert: any): string => {
    const metricString = alert.metricType;
    if (metricString && METRIC_CONFIG[metricString]) return METRIC_CONFIG[metricString].unit || "";
    return "";
  };

  const getMetricName = (alert: any): string => {
    const metricString = alert.metricType;
    if (metricString && METRIC_NAMES[metricString]) return METRIC_NAMES[metricString];
    return metricString || "未知指标";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              {canAcknowledge ? "时间" : "处理时间"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">猪舍 ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">指标</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">数值</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">级别</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">详情</th>
            <th className="relative px-6 py-3"><span className="sr-only">操作</span></th>
          </tr>
        </thead>
        <tbody className="bg-slate-900 divide-y divide-slate-800">
          {alerts?.map((alert: any) => {
            const level = AlertLevel.Warning;
            const levelConfig = ALERT_LEVEL_CONFIG[level];
            return (
              <tr key={alert.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {new Date((canAcknowledge ? alert.timestamp : alert.acknowledgedAt || alert.timestamp)).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{alert.pigstyId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getMetricName(alert)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getAlertValue(alert)} {getUnit(alert)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {levelConfig ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelConfig.color}`}>
                      {levelConfig.icon}
                      {ALERT_LEVEL_NAMES[level]}
                    </span>
                  ) : (
                    <span className="text-slate-400">未知</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 max-w-xs truncate">{alert.message}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  {canAcknowledge ? (
                    <button
                      onClick={async () => {
                        await onAcknowledgeWarning(alert.id);
                      }}
                      className="text-green-400 hover:text-green-300"
                    >
                      确认
                    </button>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
