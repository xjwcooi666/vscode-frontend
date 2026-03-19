import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertLevel, User } from '../types';
import { Pigsty as RealPigsty } from '../services/api';
import { AlertsTable } from './AlertsTable';
import { AlertModal } from './AlertModal';
import { DangerAlertPopup } from './DangerAlertPopup';
import { METRIC_NAMES } from '../constants';

type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null;
  light?: number | null;
  pigstyId: string;
  timestamp: string;
};

interface AlertsViewProps {
  alerts: Alert[];
  realReadings: PigstyReading[];
  realPigsties: RealPigsty[];
  users: User[];
  onAcknowledgeWarning: (id: number) => Promise<void>;
  pageInfo: { totalElements: number; totalPages: number; number: number; size: number };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  acknowledgedFilter: boolean;
  onFilterChange: (ack: boolean) => void;
  filterPigstyId: string;
  filterMetric: string;
  onFilterPigstyChange: (id: string) => void;
  onFilterMetricChange: (metric: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  realReadings,
  realPigsties,
  users,
  onAcknowledgeWarning,
  pageInfo,
  onPageChange,
  onPageSizeChange,
  acknowledgedFilter,
  onFilterChange,
  filterPigstyId,
  filterMetric,
  onFilterPigstyChange,
  onFilterMetricChange,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dangerAlerts, setDangerAlerts] = useState<Alert[]>([]);
  const [currentDangerAlert, setCurrentDangerAlert] = useState<Alert | null>(null);
  const lastShownAlertIds = useRef<Set<string>>(new Set());

  const totalElements = pageInfo?.totalElements ?? alerts.length;
  const totalPages = Math.max(1, pageInfo?.totalPages ?? 1);
  const currentPage = pageInfo?.number ?? 0;
  const pageSize = pageInfo?.size ?? (alerts.length || 1);
  const canPrev = currentPage > 0;
  const canNext = currentPage + 1 < totalPages;

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    
    if (acknowledgedFilter) {
      return;
    }
    
    const unacknowledgedDangerAlerts = alerts.filter(
      (alert) => {
        const isDanger = alert.level === AlertLevel.Danger || alert.level === 'Danger' as any;
        const isUnacknowledged = alert.acknowledged === false;
        const notShown = !lastShownAlertIds.current.has(alert.id);
        return isDanger && isUnacknowledged && notShown;
      }
    );
    
    if (unacknowledgedDangerAlerts.length > 0) {
      setDangerAlerts(unacknowledgedDangerAlerts);
      setCurrentDangerAlert(unacknowledgedDangerAlerts[0]);
      unacknowledgedDangerAlerts.forEach(alert => {
        lastShownAlertIds.current.add(alert.id);
      });
    }
  }, [alerts, acknowledgedFilter]);

  const handleAlertClick = (alert: Alert) => setSelectedAlert(alert);
  const handleCloseModal = () => setSelectedAlert(null);

  const handleCloseDangerPopup = () => {
    setCurrentDangerAlert(null);
    setDangerAlerts((prev) => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        setTimeout(() => {
          setCurrentDangerAlert(remaining[0]);
        }, 300);
      }
      return remaining;
    });
  };

  const handleAcknowledge = async (id: number) => {
    await onAcknowledgeWarning(id);
    setSuccessMessage("已确认处理");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleAcknowledgeAll = async (alerts: Alert[]) => {
    try {
      await Promise.all(
        alerts.map((alert) => onAcknowledgeWarning(Number(alert.id)))
      );
      setDangerAlerts([]);
      setCurrentDangerAlert(null);
      setSuccessMessage(`已处理 ${alerts.length} 条警报`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error('Failed to acknowledge all alerts:', error);
      setSuccessMessage('处理失败，请重试');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const getLatestReadingForAlert = (alert: Alert) => {
    const pigstyIdStr = String(alert.pigstyId);
    const pigstyReadings = realReadings?.filter((r) => String(r.pigstyId) === pigstyIdStr) || [];
    pigstyReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return pigstyReadings.length > 0 ? pigstyReadings[pigstyReadings.length - 1] : undefined;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-sky-400">警报记录</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onFilterChange(false)}
              className={`px-3 py-1 rounded border border-slate-700 ${!acknowledgedFilter ? 'bg-sky-600 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
            >
              未处理
            </button>
            <button
              onClick={() => onFilterChange(true)}
              className={`px-3 py-1 rounded border border-slate-700 ${acknowledgedFilter ? 'bg-sky-600 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
            >
              已处理
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mx-6 mb-2 px-4 py-2 rounded bg-green-600/20 text-green-200 text-sm border border-green-500/40">
          {successMessage}
        </div>
      )}

      <div className="px-6 pb-4 flex items-center justify-between text-sm text-slate-300">
        <div>共 {totalElements} 条，第 {currentPage + 1} / {totalPages} 页</div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <span className="text-slate-400">猪舍</span>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              value={filterPigstyId}
              onChange={(e) => onFilterPigstyChange(e.target.value)}
            >
              <option value="all">全部</option>
              {realPigsties.map((pigsty) => (
                <option key={String(pigsty.id)} value={String(pigsty.id)}>
                  {pigsty.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center space-x-2">
            <span className="text-slate-400">指标</span>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              value={filterMetric}
              onChange={(e) => onFilterMetricChange(e.target.value)}
            >
              <option value="all">全部</option>
              {Array.from(new Set((alerts || []).map((a: any) => a.metricType || a.metric))).map((metric) => {
                const metricKey = typeof metric === 'string' ? metric.toUpperCase() : metric as keyof typeof METRIC_NAMES;
                const metricName = METRIC_NAMES[metricKey] || metric || "未知";
                return (
                  <option key={metric || "unknown"} value={metric || ""}>
                    {metricName}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="flex items-center space-x-2">
            <span className="text-slate-400">每页</span>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[20, 50, 100].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => canPrev && onPageChange(Math.max(0, currentPage - 1))}
              disabled={!canPrev}
              className={`px-3 py-1 rounded border border-slate-700 ${canPrev ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-500 cursor-not-allowed'}`}
            >
              上一页
            </button>
            <button
              onClick={() => canNext && onPageChange(currentPage + 1)}
              disabled={!canNext}
              className={`px-3 py-1 rounded border border-slate-700 ${canNext ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-500 cursor-not-allowed'}`}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        {alerts && alerts.length > 0 ? (
          <AlertsTable
            alerts={alerts}
            onAlertClick={handleAlertClick}
            onAcknowledgeWarning={handleAcknowledge}
            canAcknowledge={!acknowledgedFilter}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400">当前没有符合条件的警报。</p>
          </div>
        )}
      </div>

      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          onClose={handleCloseModal}
          latestReading={getLatestReadingForAlert(selectedAlert)}
        />
      )}

      {currentDangerAlert && (
        <DangerAlertPopup
          alert={currentDangerAlert}
          pigsties={realPigsties}
          users={users}
          onClose={handleCloseDangerPopup}
          onAcknowledge={handleAcknowledge}
          remainingCount={dangerAlerts.length - 1}
          allDangerAlerts={dangerAlerts.filter(a => a.id !== currentDangerAlert.id)}
          onAcknowledgeAll={handleAcknowledgeAll}
        />
      )}
    </div>
  );
};
