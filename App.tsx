
import React, { useRef, useState } from 'react'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import HourlyActivityChart from './components/HourlyActivityChart'
import ProductShareChart from './components/ProductShareChart'
import RevenueChart from './components/RevenueChart'
import TopProductsChart from './components/TopProductsChart'

import KPICard from './components/KPICard'
import { getAIInsights } from './services/geminiService'
import { AIInsight, ReportData } from './types'
import { processSalesData } from './utils/dataProcessor'

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
      // Increased delay to ensure Recharts animations are finished
      await new Promise(r => setTimeout(r, 2000));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Slightly reduced scale for better performance with large content
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // PDF Dimensions (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight; // Shift the image up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const dateStr = new Date().toLocaleDateString('ru-RU');
      pdf.save(`CafeInsight_[${dateStr}].pdf`);
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
                <span>{exporting ? 'Генерация отчета...' : 'Полный отчет (PDF)'}</span>
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

      <main ref={reportRef} className="max-w-7xl mx-auto px-4 mt-8">
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

        {/* Overview Section - Visible if active OR exporting */}
        {data && (activeTab === 'overview' || exporting) && (
          <div id="overview-report" className="space-y-8 animate-in fade-in duration-700 p-4 -m-4">
             {exporting && <div className="text-center mb-8"><h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Общий отчет</h2></div>}
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
              <RevenueChart data={data.revenueByDay} formatCurrency={formatCurrency} formatLabelValue={formatLabelValue} />

              {/* Product Share - With Static Labels */}
              <ProductShareChart data={data.productShare} formatCurrency={formatCurrency} formatLabelValue={formatLabelValue} />

              {/* Top Products Revenue - With Static Labels */}
              <TopProductsChart data={data.topProductsByRevenue} formatCurrency={formatCurrency} formatLabelValue={formatLabelValue} />
            </div>
          </div>
        )}

        {/* Separator for PDF export */}
        {exporting && <div className="h-20 break-before-page"></div>}

        {/* Hourly Section - Visible if active OR exporting */}
        {data && (activeTab === 'hourly' || exporting) && (
          <div id="hourly-report" className="space-y-8 animate-in slide-in-from-right duration-500 p-4 -m-4">
             {exporting && <div className="text-center mb-8"><h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Почасовой анализ</h2></div>}
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

            <HourlyActivityChart 
              data={data.revenueByHour} 
              busiestHour={busiestHour || null} 
              formatCurrency={formatCurrency} 
            />
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
