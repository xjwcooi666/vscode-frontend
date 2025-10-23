
import React, { useState } from 'react';

interface DataControlsProps {
  onFilter: (dates: { startDate: string; endDate: string }) => void;
  onReset: () => void;
  onExport: (dates: { startDate: string; endDate: string }) => void;
  exportLabel?: string;
}

export const DataControls: React.FC<DataControlsProps> = ({ onFilter, onReset, onExport, exportLabel }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleFilterClick = () => {
        onFilter({ startDate, endDate });
    };

    const handleResetClick = () => {
        setStartDate('');
        setEndDate('');
        onReset();
    };

    const handleExportClick = () => {
        onExport({ startDate, endDate });
    };

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-300">按日期筛选:</span>
            <div>
                <label htmlFor="start-date" className="sr-only">Start Date</label>
                <input 
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-slate-700 text-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>
            <span className="text-slate-500">-</span>
            <div>
                 <label htmlFor="end-date" className="sr-only">End Date</label>
                <input 
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-slate-700 text-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleFilterClick}
                    className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 text-sm font-semibold transition-colors duration-200"
                >
                    查询
                </button>
                <button
                    onClick={handleResetClick}
                    className="text-slate-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-slate-700 transition-colors duration-200"
                >
                    重置
                </button>
            </div>
        </div>
        <button
            onClick={handleExportClick}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-semibold flex items-center gap-2 transition-colors duration-200"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exportLabel || '导出为CSV'}
        </button>
    </div>
  );
};
