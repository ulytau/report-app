
import React, { useState, useCallback, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
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

const App: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  
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
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc' // slate-50 matches our body bg
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save('CafeInsight_Report.pdf');
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

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {exporting ? (
                  <i className="fas fa-spinner animate-spin"></i>
                ) : (
                  <i className="fas fa-file-pdf text-red-500"></i>
                )}
                <span>{exporting ? 'Генерация...' : 'Экспорт в PDF'}</span>
              </button>
            )}
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-sm">
              <i className="fas fa-file-upload"></i>
              <span>Загрузить данные</span>
              <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 text-slate-300">
              <i className="fas fa-file-csv text-5xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Добро пожаловать в CafeInsight</h2>
            <p className="text-slate-500 max-w-md">Загрузите файл Excel или CSV с продажами вашего кафе, чтобы получить детальный отчет и умные советы по развитию бизнеса в KZT.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Анализируем ваши данные...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-start space-x-3 mb-8">
            <i className="fas fa-exclamation-circle mt-1"></i>
            <div>
              <p className="font-bold">Ошибка загрузки</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <div ref={reportRef} id="report-container" className="space-y-8 animate-in fade-in duration-700 p-4 -m-4">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Общая Выручка" value={formatCurrency(data.totalRevenue)} icon="fa-wallet" color="bg-emerald-500" />
              <KPICard title="Чеков всего" value={data.totalTransactions.toLocaleString()} icon="fa-receipt" color="bg-sky-500" />
              <KPICard title="Средний чек" value={formatCurrency(data.avgCheck)} icon="fa-calculator" color="bg-amber-500" />
              <KPICard title="Продано единиц" value={data.totalItems.toLocaleString()} icon="fa-box" color="bg-violet-500" />
            </div>

            {/* AI Insights Section */}
            {insights && (
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 text-indigo-600">
                  <i className="fas fa-wand-magic-sparkles text-xl"></i>
                  <h3 className="font-bold text-lg tracking-tight">AI Анализ Администратора</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {insights.summary}
                    </p>
                  </div>
                  <div className="bg-white/50 p-5 rounded-2xl border border-white/80">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Главные тезисы</p>
                    <ul className="space-y-2">
                      {insights.highlights.map((h, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                          <i className="fas fa-check-circle text-indigo-400 mt-1"></i>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/50 p-5 rounded-2xl border border-white/80">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Рекомендации</p>
                    <ul className="space-y-2">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                          <i className="fas fa-lightbulb text-amber-400 mt-1"></i>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Day of Week */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-6 flex items-center justify-between">
                  <span>Выручка по дням недели</span>
                  <i className="fas fa-calendar-day text-slate-300"></i>
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByDay} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Выручка']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.revenueByDay.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Activity */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-6 flex items-center justify-between">
                  <span>Выручка по часам</span>
                  <i className="fas fa-clock text-slate-300"></i>
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueByHour} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10 }} 
                        interval={1}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Выручка']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products Revenue */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-6">ТОП-10 товаров по выручке</h4>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProductsByRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Выручка']}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.topProductsByRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Share */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-6">Доля товаров в выручке</h4>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.productShare}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {data.productShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                      />
                      <Legend verticalAlign="bottom" height={100} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} CafeInsight. Разработано для администраторов кофейни. Все расчеты в KZT.</p>
      </footer>
    </div>
  );
};

export default App;
