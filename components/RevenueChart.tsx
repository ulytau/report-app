
import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '../constants';

interface RevenueChartProps {
  data: { day: string; value: number }[];
  formatCurrency: (val: number) => string;
  formatLabelValue: (val: number) => string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, formatCurrency, formatLabelValue }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h4 className="font-black text-slate-800 mb-8 flex items-center justify-between uppercase tracking-tight">
        <span>Выручка по дням</span>
        <i className="fas fa-calendar-alt text-slate-200 text-2xl"></i>
      </h4>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
              formatter={(value: number) => [formatCurrency(value), 'Выручка']}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
              <LabelList dataKey="value" position="top" formatter={formatLabelValue} style={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} offset={8} />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
