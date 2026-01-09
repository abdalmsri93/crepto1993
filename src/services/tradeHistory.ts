// 📜 خدمة سجل العمليات - لتتبع جميع عمليات الشراء والبيع التلقائية

export interface TradeRecord {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;        // الكمية
  price: number;         // السعر وقت العملية
  total: number;         // المجموع بـ USDT
  profit?: number;       // الربح/الخسارة (للبيع فقط)
  profitPercent?: number; // نسبة الربح/الخسارة
  timestamp: string;     // التاريخ والوقت
  status: 'success' | 'failed';
  error?: string;        // رسالة الخطأ إذا فشلت
}

const STORAGE_KEY = 'trade_history';
const MAX_RECORDS = 100; // الحد الأقصى للسجلات

// جلب كل السجلات
export const getTradeHistory = (): TradeRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// إضافة سجل جديد
export const addTradeRecord = (record: Omit<TradeRecord, 'id' | 'timestamp'>): TradeRecord => {
  const newRecord: TradeRecord = {
    ...record,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  const history = getTradeHistory();
  
  // إضافة السجل الجديد في البداية
  history.unshift(newRecord);
  
  // الاحتفاظ بآخر 100 سجل فقط
  if (history.length > MAX_RECORDS) {
    history.splice(MAX_RECORDS);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  
  console.log(`📜 تم حفظ عملية ${record.type === 'buy' ? 'شراء' : 'بيع'}: ${record.asset}`);
  
  return newRecord;
};

// إضافة سجل شراء
export const addBuyRecord = (
  asset: string,
  amount: number,
  price: number,
  total: number,
  success: boolean,
  error?: string
): TradeRecord => {
  return addTradeRecord({
    type: 'buy',
    asset,
    amount,
    price,
    total,
    status: success ? 'success' : 'failed',
    error,
  });
};

// إضافة سجل بيع
export const addSellRecord = (
  asset: string,
  amount: number,
  price: number,
  total: number,
  profit: number,
  profitPercent: number,
  success: boolean,
  error?: string
): TradeRecord => {
  return addTradeRecord({
    type: 'sell',
    asset,
    amount,
    price,
    total,
    profit,
    profitPercent,
    status: success ? 'success' : 'failed',
    error,
  });
};

// مسح كل السجلات
export const clearTradeHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ تم مسح سجل العمليات');
};

// إحصائيات السجل
export const getTradeStats = () => {
  const history = getTradeHistory();
  
  const successfulBuys = history.filter(r => r.type === 'buy' && r.status === 'success');
  const successfulSells = history.filter(r => r.type === 'sell' && r.status === 'success');
  
  const totalBought = successfulBuys.reduce((sum, r) => sum + r.total, 0);
  const totalSold = successfulSells.reduce((sum, r) => sum + r.total, 0);
  const totalProfit = successfulSells.reduce((sum, r) => sum + (r.profit || 0), 0);
  
  return {
    totalTrades: history.length,
    successfulBuys: successfulBuys.length,
    successfulSells: successfulSells.length,
    failedTrades: history.filter(r => r.status === 'failed').length,
    totalBought,
    totalSold,
    totalProfit,
    avgProfitPercent: successfulSells.length > 0 
      ? successfulSells.reduce((sum, r) => sum + (r.profitPercent || 0), 0) / successfulSells.length 
      : 0,
  };
};
