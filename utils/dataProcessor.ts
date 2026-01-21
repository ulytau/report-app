
import { DAYS_EN_MAP, DAYS_RU } from '../constants';
import { ReportData, SaleRecord } from '../types';

const findColumn = (headers: string[], candidates: string[]): string | undefined => {
  return headers.find(h => 
    candidates.some(c => h.toLowerCase().includes(c.toLowerCase()))
  );
};

export const processSalesData = (data: any[]): ReportData => {
  if (!data || data.length === 0) throw new Error("No data found");

  const headers = Object.keys(data[0]);

  const colDate = findColumn(headers, ['date', 'дата', 'день']);
  const colHour = findColumn(headers, ['hour', 'час', 'time', 'время']);
  const colProduct = findColumn(headers, ['product', 'товар', 'item', 'name', 'наимен']);
  const colQty = findColumn(headers, ['qty', 'количество', 'quantity', 'кол']);
  const colRevenue = findColumn(headers, ['revenue', 'выруч', 'сумм', 'total', 'стоимость', 'итого']);

  if (!colRevenue) throw new Error("Revenue column not found (Выручка/Сумма)");
  if (!colProduct) throw new Error("Product column not found (Товар/Наименование)");

  const records: SaleRecord[] = data.map(row => {
    let revenue = parseFloat(String(row[colRevenue]).replace(/[^\d.-]/g, '')) || 0;
    let qty = parseFloat(String(row[colQty || 'qty']).replace(/[^\d.-]/g, '')) || 1;
    let product = String(row[colProduct]).trim();
    
    let dateObj: Date | undefined;
    if (colDate && row[colDate]) {
      dateObj = new Date(row[colDate]);
    }

    let hour: number | undefined;
    if (colHour && row[colHour]) {
      hour = parseInt(row[colHour]);
    } else if (dateObj && !isNaN(dateObj.getTime())) {
      hour = dateObj.getHours();
    } else {
      // Hour not found
      hour = undefined;
    }

    let dayName = "Пн";
    if (dateObj && !isNaN(dateObj.getTime())) {
      const enDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      dayName = DAYS_EN_MAP[enDay] || "Пн";
    } else {
      // Day not found
      dayName = "Unknown";
    }

    return {
      product,
      revenue,
      qty,
      date: isNaN(dateObj?.getTime() ?? NaN) ? undefined : dateObj,
      hour,
      dayOfWeek: dayName
    };
  }).filter(r => r.revenue > 0);

  // Aggregations
  const totalRevenue = records.reduce((acc, r) => acc + r.revenue, 0);
  const totalItems = records.reduce((acc, r) => acc + r.qty, 0);
  const totalTransactions = records.length;
  const avgCheck = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // By Day
  const dayRevMap: Record<string, number> = {};
  const dayTxMap: Record<string, number> = {};
  DAYS_RU.forEach(d => { dayRevMap[d] = 0; dayTxMap[d] = 0; });
  records.forEach(r => {
    if (r.dayOfWeek && r.dayOfWeek !== "Unknown") {
      dayRevMap[r.dayOfWeek] += r.revenue;
      dayTxMap[r.dayOfWeek] += 1;
    }
  });

  // By Hour (Ensuring all 24 hours are present)
  const hourMap: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourMap[i] = 0;
  }
  
  records.forEach(r => {
    if (r.hour !== undefined && r.hour >= 0 && r.hour < 24) {
      hourMap[r.hour] += r.revenue;
    }
  });

  const revenueByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    value: hourMap[i]
  }));

  // Products
  const prodRevMap: Record<string, number> = {};
  const prodQtyMap: Record<string, number> = {};
  records.forEach(r => {
    prodRevMap[r.product] = (prodRevMap[r.product] || 0) + r.revenue;
    prodQtyMap[r.product] = (prodQtyMap[r.product] || 0) + r.qty;
  });

  const topProductsByRevenue = Object.entries(prodRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const topProductsByQty = Object.entries(prodQtyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const productShare = Object.entries(prodRevMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return {
    totalRevenue,
    totalTransactions,
    avgCheck,
    totalItems,
    revenueByDay: DAYS_RU.map(d => ({ day: d, value: dayRevMap[d] })),
    transactionsByDay: DAYS_RU.map(d => ({ day: d, value: dayTxMap[d] })),
    revenueByHour,
    topProductsByRevenue,
    topProductsByQty,
    productShare: productShare.slice(0, 7).concat(productShare.length > 7 ? [{ name: 'Другое', value: productShare.slice(7).reduce((a, b) => a + b.value, 0) }] : []),
    rawRecords: records
  };
};
