
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricType, SensorReading } from '../types';
import { METRIC_NAMES } from '../constants';

interface LineChartCardProps {
  metric: MetricType;
  readings: SensorReading[];
}

export const LineChartCard: React.FC<LineChartCardProps> = ({ metric, readings }) => {
  const dataKey = metric.toLowerCase();
  const metricName = METRIC_NAMES[metric];

  const data = readings
    .map(r => {
        const value = r[metric.toLowerCase() as keyof Omit<SensorReading, 'timestamp'>];
        return {
            timestamp: r.timestamp,
            [dataKey]: value !== null ? parseFloat(value.toFixed(1)) : null,
        }
    })
    .filter(d => d[dataKey] !== null);


  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg shadow-inner">
      <h4 className="text-md font-semibold text-slate-300 mb-4">{metricName}趋势</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp} 
            stroke="#9ca3af" 
            tick={{ fontSize: 10 }} 
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fontSize: 10 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            allowDataOverflow={true}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} 
            labelFormatter={formatTimestamp}
          />
          <Line connectNulls type="monotone" dataKey={dataKey} name={metricName} stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
