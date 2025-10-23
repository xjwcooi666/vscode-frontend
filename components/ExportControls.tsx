
import React from 'react';

interface ExportControlsProps {
  onDateChange: (dates: { startDate: string; endDate: string }) => void;
  onExport: () => void;
  exportLabel?: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onDateChange, onExport, exportLabel = "Export to CSV" }) => {
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        onDateChange({ startDate: newStartDate, endDate });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);
        onDateChange({ startDate, endDate: newEndDate });
    };

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-300">Filter by Date:</span>
            <div>
                <label htmlFor="start-date" className="sr-only">Start Date</label>
                <input 
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={handleStartDateChange}
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
                    onChange={handleEndDateChange}
                    className="bg-slate-700 text-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>
        </div>
        <button
            onClick={onExport}
            className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 text-sm font-semibold flex items-center gap-2 transition-colors duration-200"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exportLabel}
        </button>
    </div>
  );
};
