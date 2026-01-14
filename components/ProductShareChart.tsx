
import React from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '../constants'

interface ProductShareChartProps {
  data: { name: string; value: number }[];
  formatCurrency: (val: number) => string;
  formatLabelValue: (val: number) => string;
}

const ProductShareChart: React.FC<ProductShareChartProps> = ({ data, formatCurrency, formatLabelValue }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h4 className="font-black text-slate-800 mb-8 flex items-center justify-between uppercase tracking-tight">
        <span>Доля товаров</span>
        <i className="fas fa-chart-pie text-slate-200 text-2xl"></i>
      </h4>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              stroke="#fff"
              strokeWidth={4}
              isAnimationActive={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 25; // Push label out further
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="#1e293b" 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'sans-serif' }}
                  >
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontWeight: 700, fontSize: '11px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductShareChart;
