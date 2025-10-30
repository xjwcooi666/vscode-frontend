import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricType } from '../services/api'; 
type PigstyReading = {
  id: number;
  temperature?: number | null;
  humidity?: number | null;
  ammoniaLevel?: number | null; // 确保包含 ammoniaLevel
  light?: number | null;
  pigstyId: string;
  timestamp: string;
};
import { METRIC_NAMES } from '../constants';

interface LineChartCardProps {
  metric: MetricType | string;
  readings: PigstyReading[]; 
}

// [!!! 关键修复 !!!] 辅助函数，获取正确的 dataKey
const getChartDataKey = (metric: MetricType | string): string => {
  const metricEnumKey = metric as MetricType;
  switch (metricEnumKey) {
    case MetricType.AMMONIA:
      return 'ammoniaLevel'; // 后端返回的是 ammoniaLevel
    case MetricType.TEMPERATURE:
      return 'temperature';
    case MetricType.HUMIDITY:
      return 'humidity';
    case MetricType.LIGHT:
      return 'light';
    default:
      return String(metric).toLowerCase();
  }
}

export const LineChartCard: React.FC<LineChartCardProps> = ({ metric, readings }) => {
  // [!!! 关键修复 !!!] 使用辅助函数
  const dataKey = getChartDataKey(metric);
  
  const metricName = METRIC_NAMES[metric as MetricType] || metric;

  const data = readings
    .filter(r => r && r[dataKey as keyof PigstyReading] !== undefined && r[dataKey as keyof PigstyReading] !== null)
    .map(r => {
        const value = r[dataKey as keyof PigstyReading];
        const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
        const timestampMs = new Date(r.timestamp).getTime();
        return {
            timestamp: timestampMs,
            [dataKey]: !isNaN(numericValue) ? parseFloat(numericValue.toFixed(1)) : null,
        }
    })
    .filter(d => d[dataKey] !== null && !isNaN(d.timestamp));

  const formatTimestamp = (timestampMs: number) => {
      if (isNaN(timestampMs)) return '';
      return new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const renderTooltipContent = (props: any) => {
      const { active, payload, label } = props;
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const value = data[dataKey]; // [!!! 关键修复 !!!] 使用正确的 dataKey
          return (
              <div className="bg-slate-700/80 backdrop-blur-sm border border-slate-600 rounded-md p-2 shadow-lg">
                  <p className="text-sm text-slate-300">{`时间: ${formatTimestamp(label)}`}</p>
                  <p className="text-sm font-semibold" style={{ color: payload[0].color }}>
                      {`${metricName}: ${typeof value === 'number' ? value.toFixed(1) : 'N/A'}`}
                  </p>
              </div>
          );
      }
      return null;
  };


  return (
    <div className="bg-slate-900/50 p-4 rounded-lg shadow-inner min-h-[260px]">
      <h4 className="text-md font-semibold text-slate-300 mb-4">{metricName} 趋势</h4>
      {/* [!!! 关键修复 !!!] 检查 data.length 而不是 readings.length */}
      {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.3)" />
              <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatTimestamp} stroke="#9ca3af" tick={{ fontSize: 10 }} scale="time" />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} domain={[ (dataMin: number) => (isNaN(dataMin) ? 0 : Math.floor(dataMin - 1)), (dataMax: number) => (isNaN(dataMax) ? 50 : Math.ceil(dataMax + 1)) ]} allowDataOverflow={true} />
              <Tooltip content={renderTooltipContent} cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Line connectNulls type="monotone" dataKey={dataKey} name={metricName} stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#38bdf8' }} />
            </LineChart>
          </ResponsiveContainer>
      ) : (
           <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
               暂无数据显示
           </div>
      )}
    </div>
  );
};