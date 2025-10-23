import React, { useState, useEffect } from 'react';
import { Alert, Pigsty } from '../types';
import { AlertsTable } from './AlertsTable';
import { AlertModal } from './AlertModal';
import { DataControls } from './DataControls';
import { exportToCsv } from '../utils/csvExporter';
import { getFilteredAlerts } from '../services/apiService';
import { METRIC_NAMES, ALERT_LEVEL_NAMES } from '../constants';

interface AlertsViewProps {
  alerts: Alert[]; // Represents the latest alerts from the polling update
  pigsties: Pigsty[];
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts: initialAlerts, pigsties }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>(initialAlerts);
  const [isQuerying, setIsQuerying] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    // Only update with polled data if the user hasn't run a specific query
    if (!hasQueried) {
      setDisplayedAlerts(initialAlerts);
    }
  }, [initialAlerts, hasQueried]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };
  
  const handleCloseModal = () => {
    setSelectedAlert(null);
  };

  const getLatestReadingForAlert = (alert: Alert) => {
    const pigsty = pigsties.find(p => p.id === alert.pigstyId);
    return pigsty ? pigsty.readings[pigsty.readings.length - 1] : undefined;
  };

  const handleFilter = async (dates: { startDate: string; endDate: string }) => {
    setIsQuerying(true);
    setHasQueried(true);
    try {
      const filtered = await getFilteredAlerts(dates.startDate, dates.endDate);
      setDisplayedAlerts(filtered);
    } catch (error) {
      console.error("Failed to fetch filtered alerts:", error);
      alert("查询警报失败。");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleReset = () => {
    setDisplayedAlerts(initialAlerts);
    setHasQueried(false);
  };

  const handleExport = () => {
    const dataToExport = displayedAlerts.map(alert => ({
        id: alert.id,
        timestamp: new Date(alert.timestamp).toISOString(),
        pigsty_id: alert.pigstyId,
        pigsty_name: alert.pigstyName,
        metric: METRIC_NAMES[alert.metric],
        value: alert.value.toFixed(2),
        level: ALERT_LEVEL_NAMES[alert.level],
        message: alert.message,
    }));
    exportToCsv(`猪舍警报_${new Date().toISOString().split('T')[0]}.csv`, dataToExport);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-sky-400 mb-6">警报历史</h2>
        <DataControls onFilter={handleFilter} onReset={handleReset} onExport={handleExport} />
      </div>
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        {isQuerying ? (
          <div className="text-center py-10 text-slate-400">正在查询...</div>
        ) : displayedAlerts.length > 0 ? (
          <AlertsTable alerts={displayedAlerts} onAlertClick={handleAlertClick} />
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400">
              {hasQueried
                ? "选定日期范围内没有警报。"
                : "最近没有触发任何警报。"
              }
            </p>
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
    </div>
  );
};
