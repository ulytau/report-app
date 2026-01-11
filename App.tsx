
import React, { useState, useCallback, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList 
} from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ReportData, AIInsight } from './types';
import { processSalesData } from './utils/dataProcessor';
import { getAIInsights } from './services/geminiService';
import { CHART_COLORS } from './constants';
import KPICard from './components/KPICard';

type TabType = 'overview' | 'hourly';

const App: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setData(null);
    setInsights(null);

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = async (e) => {
      try {
        let results: any[] = [];
        if (extension === 'csv') {
          const csvText = e.target?.result as string;
          results = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
        } else {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          results = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        const processed = processSalesData(results);
        setData(processed);
        
        // Fetch AI Insights
        const aiResponse = await getAIInsights(processed);
        setInsights(aiResponse);
      } catch (err: any) {
        setError(err.message || "Ошибка обработки файла");
      } finally {
        setLoading(false);
      }
    };

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    window.scrollTo(0, 0);

    try {
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2.5, canvas.height / 2.5]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2.5, canvas.height / 2.5);
      pdf.save(`CafeInsight_${activeTab === 'overview' ? 'Overview' : 'Hourly'}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Ошибка при генерации PDF');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('kk-KZ', { 
      style: 'currency', 
      currency: 'KZT', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const formatLabelValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return Math.round(val).toString();
  };

  const getBusiestHour = () => {
    if (!data) return null;
    return [...data.revenueByHour].sort((a, b) => b.value - a.value)[0];
  };

  const busiestHour = getBusiestHour();

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-mug-hot"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">CafeInsight</h1>
          </div>
          <div className="flex items-center space-x-3">
            {data && (
              <button 
                onClick={handleExportPDF}
                disabled={exporting}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50 active:scale-95"
              >
                {exporting ? (
                  <i className="fas fa-circle-notch animate-spin"></i>
                ) : (
                  <i className="fas fa-file-pdf text-red-500"></i>
                )}
                <span>{exporting ? 'Генерация...' : 'Экспорт в PDF'}</span>
              </button>
            )}
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 shadow-sm active:scale-95">
              <i className="fas fa-file-upload"></i>
              <span>Загрузить данные</span>
              <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        
        {/* Tabs */}
        {data && (
          <div className="max-w-7xl mx-auto px-4 border-t border-slate-50">
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-chart-pie mr-2"></i>
                Общий обзор
              </button>
              <button 
                onClick={() => setActiveTab('hourly')}
                className={`py-3 px-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'hourly' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-history mr-2"></i>
                Анализ по часам
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
              <i className="fas fa-file-excel text-5xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Добро пожаловать в CafeInsight</h2>
            <p className="text-slate-500 max-w-md">Загрузите файл Excel или CSV с продажами вашего кафе, чтобы получить детальный отчет и умные советы по развитию бизнеса в KZT.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <i className="fas fa-coffee animate-pulse"></i>
              </div>
            </div>
            <p className="text-slate-600 font-bold mt-6 tracking-wide">Анализируем ваши данные...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-start space-x-3 mb-8 animate-in slide-in-from-top duration-300">
            <i className="fas fa-exclamation-triangle mt-1"></i>
            <div>
              <p className="font-black">Ошибка загрузки</p>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {data && activeTab === 'overview' && (
          <div ref={reportRef} id="overview-report" className="space-y-8 animate-in fade-in duration-700 p-4 -m-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Общая Выручка" value={formatCurrency(data.totalRevenue)} icon="fa-wallet" color="bg-emerald-500" />
              <KPICard title="Чеков всего" value={data.totalTransactions.toLocaleString()} icon="fa-receipt" color="bg-sky-500" />
              <KPICard title="Средний чек" value={formatCurrency(data.avgCheck)} icon="fa-calculator" color="bg-amber-500" />
              <KPICard title="Продано единиц" value={data.totalItems.toLocaleString()} icon="fa-box" color="bg-violet-500" />
            </div>

            {insights && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-6 text-indigo-600">
                  <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                    <i className="fas fa-robot text-sm"></i>
                  </div>
                  <h3 className="font-black text-lg tracking-tight uppercase">AI Анализ Администратора</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <p className="text-slate-700 leading-relaxed font-bold text-lg">
                      {insights.summary}
                    </p>
                  </div>
                  <div className="bg-white/50 p-6 rounded-2xl border border-white/80 backdrop-blur-sm">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Главные тезисы</p>
                    <ul className="space-y-3">
                      {insights.highlights.map((h, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-600 font-medium">
                          <i className="fas fa-check-circle text-indigo-400 mt-1"></i>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/50 p-6 rounded-2xl border border-white/80 backdrop-blur-sm">
                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Рекомендации</p>
                    <ul className="space-y-3">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-600 font-medium">
                          <i className="fas fa-lightbulb text-amber-400 mt-1"></i>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Day of Week - With Static Labels */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 mb-8 flex items-center justify-between uppercase tracking-tight">
                  <span>Выручка по дням</span>
                  <i className="fas fa-calendar-alt text-slate-200 text-2xl"></i>
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByDay} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
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
                        {data.revenueByDay.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Share - With Static Labels */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 mb-8 flex items-center justify-between uppercase tracking-tight">
                  <span>Доля товаров</span>
                  <i className="fas fa-chart-pie text-slate-200 text-2xl"></i>
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.productShare}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={4}
                        label={({ name, value }) => `${name}: ${formatLabelValue(value)}`}
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      >
                        {data.productShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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

              {/* Top Products Revenue - With Static Labels */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                <h4 className="font-black text-slate-800 mb-10 uppercase tracking-tight">ТОП-10 товаров по выручке</h4>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProductsByRevenue} layout="vertical" margin={{ top: 5, right: 60, left: 60, bottom: 5 }}>
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
                        {data.topProductsByRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {data && activeTab === 'hourly' && (
          <div ref={reportRef} id="hourly-report" className="space-y-8 animate-in slide-in-from-right duration-500 p-4 -m-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard 
                title="Пиковый час" 
                value={busiestHour ? busiestHour.hour : 'N/A'} 
                icon="fa-bolt" 
                color="bg-orange-500" 
              />
              <KPICard 
                title="Выручка в пик" 
                value={busiestHour ? formatCurrency(busiestHour.value) : '0 ₸'} 
                icon="fa-chart-line" 
                color="bg-indigo-500" 
              />
            </div>

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
                  <AreaChart data={data.revenueByHour} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
                {data.revenueByHour.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${h.value === busiestHour?.value ? 'bg-indigo-100 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50'}`}>
                    <span className={`text-[11px] font-black ${h.value === busiestHour?.value ? 'text-indigo-600' : 'text-slate-400'}`}>{h.hour}</span>
                    <span className={`text-xs font-black ${h.value === busiestHour?.value ? 'text-indigo-800' : 'text-slate-700'}`}>
                      {h.value > 0 ? (h.value >= 1000 ? `${(h.value/1000).toFixed(1)}k` : Math.round(h.value)) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 pb-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} CafeInsight. Разработано для профессиональных администраторов. Все расчеты в KZT.</p>
      </footer>
    </div>
  );
};

export default App;
