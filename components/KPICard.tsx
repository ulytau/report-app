
import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md group">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className={`${color} w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight truncate">{title}</p>
      </div>
      <div className="pl-4">
        <p className="text-xl font-black text-slate-800 whitespace-nowrap">{value}</p>
      </div>
    </div>
  );
};

export default KPICard;
