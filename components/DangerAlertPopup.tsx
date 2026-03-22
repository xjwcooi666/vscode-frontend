import React, { useEffect, useState } from 'react';
import { Alert, User } from '../types';
import { Pigsty as RealPigsty } from '../services/api';
import { METRIC_CONFIG, METRIC_NAMES } from '../constants';

interface DangerAlertPopupProps {
  alert: Alert;
  pigsties: RealPigsty[];
  users: User[];
  onClose: () => void;
  onAcknowledge: (id: number) => Promise<void>;
  remainingCount: number;
  allDangerAlerts?: Alert[];
  onAcknowledgeAll?: (alerts: Alert[]) => Promise<void>;
}

export const DangerAlertPopup: React.FC<DangerAlertPopupProps> = ({
  alert,
  pigsties,
  users,
  onClose,
  onAcknowledge,
  remainingCount,
  allDangerAlerts = [],
  onAcknowledgeAll,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  if (!alert) {
    return null;
  }

  const pigstyId = alert.pigstyId ?? alert.pigsty_id;
  const pigsty = pigsties?.find((p) => String(p.id) === String(pigstyId));
  const pigstyName = pigsty?.name || alert.pigstyName || `猪舍 #${pigstyId ?? '未知'}`;
  const location = pigsty?.location || '未设置位置';
  const technicianId = pigsty?.technicianId;
  const technician = users?.find((u) => String(u.id) === String(technicianId));
  const technicianName = technician?.name || '未分配负责人';
  
  const metricKey = typeof alert.metric === 'string' ? alert.metric.toUpperCase() : 
                    typeof alert.metricType === 'string' ? alert.metricType.toUpperCase() : '';
  const metricName = METRIC_NAMES[metricKey] || alert.metric || alert.metricType || '未知指标';
  const metricConfig = METRIC_CONFIG[metricKey];
  const unit = metricConfig?.unit || '';
  const alertTime = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '未知时间';
  const alertValue = alert.value ?? alert.actualValue;
  
  const isDeviceError = metricName === '设备故障' || metricKey.includes('DEVICE') || metricKey === '设备故障';

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  }, [countdown, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAcknowledge = async () => {
    setIsProcessing(true);
    try {
      await onAcknowledge(Number(alert.id));
      setIsVisible(false);
      setTimeout(onClose, 300);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcknowledgeAll = async () => {
    setIsProcessingAll(true);
    try {
      const allAlerts = [alert, ...allDangerAlerts];
      if (onAcknowledgeAll) {
        await onAcknowledgeAll(allAlerts);
      } else {
        await Promise.all(
          allAlerts.map((a) => onAcknowledge(Number(a.id)))
        );
      }
      setIsVisible(false);
      setTimeout(onClose, 300);
    } catch (error) {
      console.error('Failed to acknowledge all alerts:', error);
    } finally {
      setIsProcessingAll(false);
    }
  };

  const getThresholdInfo = (): string => {
    if (!pigsty) return '未设置阈值';
    
    let threshold = '';
    
    if (metricKey === 'TEMPERATURE') {
      const high = pigsty.tempThresholdHigh;
      const low = pigsty.tempThresholdLow;
      if (alertValue > (high || Infinity)) {
        threshold = `危险阈值上限: ${high}°C`;
      } else if (alertValue < (low || -Infinity)) {
        threshold = `危险阈值下限: ${low}°C`;
      } else if (high || low) {
        threshold = `阈值范围: ${low || '--'}°C ~ ${high || '--'}°C`;
      }
    } else if (metricKey === 'HUMIDITY') {
      const high = pigsty.humidityThresholdHigh;
      const low = pigsty.humidityThresholdLow;
      if (alertValue > (high || Infinity)) {
        threshold = `危险阈值上限: ${high}%`;
      } else if (alertValue < (low || -Infinity)) {
        threshold = `危险阈值下限: ${low}%`;
      } else if (high || low) {
        threshold = `阈值范围: ${low || '--'}% ~ ${high || '--'}%`;
      }
    } else if (metricKey === 'AMMONIA') {
      const high = pigsty.ammoniaThresholdHigh;
      if (alertValue > (high || Infinity)) {
        threshold = `危险阈值上限: ${high}ppm`;
      } else if (high) {
        threshold = `安全阈值: ≤${high}ppm`;
      }
    } else if (metricKey === 'LIGHT') {
      const high = pigsty.lightThresholdHigh;
      const low = pigsty.lightThresholdLow;
      if (alertValue > (high || Infinity)) {
        threshold = `危险阈值上限: ${high}lux`;
      } else if (alertValue < (low || -Infinity)) {
        threshold = `危险阈值下限: ${low}lux`;
      } else if (high || low) {
        threshold = `阈值范围: ${low || '--'}lux ~ ${high || '--'}lux`;
      }
    }
    
    return threshold || '未设置阈值';
  };

  const getActionSuggestion = (): string => {
    if (isDeviceError) {
      return '建议立即检查设备连接状态，必要时更换传感器硬件';
    }
    
    if (metricKey === 'TEMPERATURE') {
      if (alertValue > (pigsty?.tempThresholdHigh || 0)) {
        return '建议立即启动降温系统，检查通风设备是否正常运行';
      } else {
        return '建议立即启动加热系统，检查保温设施是否完好';
      }
    } else if (metricKey === 'HUMIDITY') {
      if (alertValue > (pigsty?.humidityThresholdHigh || 0)) {
        return '建议立即启动除湿设备，检查排水系统是否畅通';
      } else {
        return '建议立即启动加湿设备，检查水源供应是否正常';
      }
    } else if (metricKey === 'AMMONIA') {
      return '建议立即启动通风系统，检查粪便清理情况';
    } else if (metricKey === 'LIGHT') {
      if (alertValue > (pigsty?.lightThresholdHigh || 0)) {
        return '建议调暗照明设备，检查光照控制系统';
      } else {
        return '建议增加照明强度，检查灯具是否正常工作';
      }
    }
    
    return '请立即检查相关设备并采取相应措施';
  };

  const totalCount = remainingCount + 1;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-gradient-to-br from-red-900/95 to-slate-900 border-2 border-red-500 rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-red-500/50 bg-red-600/20">
          <h2 className="text-2xl font-bold text-red-400 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-3 animate-pulse"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            危险环境警报
          </h2>
          <div className="flex items-center space-x-4">
            {totalCount > 1 && (
              <span className="text-sm text-red-300 bg-red-600/30 px-3 py-1 rounded-full">
                共 {totalCount} 条待处理
              </span>
            )}
            <button
              onClick={handleClose}
              className="text-red-300 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-300 font-semibold text-lg">{pigstyName}</span>
              <span className="text-slate-400 text-sm">{location}</span>
            </div>
            {isDeviceError ? (
              <div className="text-xl font-bold text-red-400 py-2">
                {alert.message || '硬件传感器发生故障'}
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {metricName}: {alertValue?.toFixed(2) ?? '--'} {unit}
                </div>
                <div className="text-sm text-red-300">{getThresholdInfo()}</div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <p className="text-slate-400 font-semibold mb-1">发生时间</p>
              <p className="text-slate-200">{alertTime}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <p className="text-slate-400 font-semibold mb-1">负责人</p>
              <p className="text-slate-200">{technicianName}</p>
            </div>
          </div>

          {!isDeviceError && (
            <div className="bg-slate-800/50 p-3 rounded-lg text-sm">
              <p className="text-slate-400 font-semibold mb-1">警报信息</p>
              <p className="text-slate-200">{alert.message}</p>
            </div>
          )}

          <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 font-semibold mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              处理建议
            </p>
            <p className="text-yellow-200 text-sm">{getActionSuggestion()}</p>
          </div>
        </div>

        <div className="p-4 border-t border-red-500/50 bg-slate-900/50 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            <span className="text-red-400 font-semibold">{countdown}</span> 秒后自动关闭
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              稍后处理
            </button>
            <button
              onClick={handleAcknowledge}
              disabled={isProcessing || isProcessingAll}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '处理中...' : '处理当前'}
            </button>
            {totalCount > 1 && (
              <button
                onClick={handleAcknowledgeAll}
                disabled={isProcessing || isProcessingAll}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingAll ? `处理中(${totalCount}条)...` : `一键处理全部(${totalCount}条)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
