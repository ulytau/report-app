
export interface SaleRecord {
  product: string;
  revenue: number;
  qty: number;
  date?: Date;
  hour?: number;
  dayOfWeek?: string;
}

export interface ReportData {
  totalRevenue: number;
  totalTransactions: number;
  avgCheck: number;
  totalItems: number;
  revenueByDay: { day: string; value: number }[];
  transactionsByDay: { day: string; value: number }[];
  revenueByHour: { hour: string; value: number }[];
  topProductsByRevenue: { name: string; value: number }[];
  topProductsByQty: { name: string; value: number }[];
  productShare: { name: string; value: number }[];
  rawRecords: SaleRecord[];
}

export interface AIInsight {
  summary: string;
  highlights: string[];
  recommendations: string[];
}
