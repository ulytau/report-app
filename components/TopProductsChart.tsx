
import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '../constants';

interface TopProductsChartProps {
  data: { name: string; value: number }[];
  formatCurrency: (val: number) => string;
  formatLabelValue: (val: number) => string;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data, formatCurrency, formatLabelValue }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
      <h4 className="font-black text-slate-800 mb-10 uppercase tracking-tight">ТОП-10 товаров по выручке</h4>
      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} width={140} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
              formatter={(value: number) => [formatCurrency(value), 'Выручка']}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24}>
              <LabelList dataKey="value" position="right" formatter={formatLabelValue} style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} offset={10} />
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

export default TopProductsChart;
