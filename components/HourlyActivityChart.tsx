
import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface HourlyActivityChartProps {
  data: { hour: string; value: number }[];
  busiestHour: { hour: string; value: number } | null;
  formatCurrency: (val: number) => string;
}

const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({ data, busiestHour, formatCurrency }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Почасовая активность (24 часа)</h3>
          <p className="text-slate-500 text-sm font-medium">Распределение выручки по времени суток</p>
        </div>
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
          <i className="fas fa-clock text-2xl"></i>
        </div>
      </div>
      
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorRevHourly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="hour" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 800 }} 
              interval={0}
            />
            <YAxis 
              tickFormatter={(val) => `${val / 1000}k`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', padding: '14px' }}
              formatter={(value: number) => [formatCurrency(value), 'Выручка']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={5} 
              fillOpacity={1} 
              fill="url(#colorRevHourly)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {data.map((h, i) => (
          <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${h.value === busiestHour?.value ? 'bg-indigo-100 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50'}`}>
            <span className={`text-[11px] font-black ${h.value === busiestHour?.value ? 'text-indigo-600' : 'text-slate-400'}`}>{h.hour}</span>
            <span className={`text-xs font-black ${h.value === busiestHour?.value ? 'text-indigo-800' : 'text-slate-700'}`}>
              {h.value > 0 ? (h.value >= 1000 ? `${(h.value/1000).toFixed(1)}k` : Math.round(h.value)) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyActivityChart;
