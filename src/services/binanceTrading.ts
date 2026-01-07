/**
 * خدمة التداول مع Binance API
 * تنفيذ أوامر الشراء عبر Supabase Functions
 */

import { supabase } from '@/integrations/supabase/client';

// ==============================
// Types & Interfaces
// ==============================

export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface TradeOrder {
  symbol: string;          // e.g., "BTCUSDT"
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity?: number;       // الكمية
  quoteOrderQty?: number;  // المبلغ بـ USDT (للشراء بمبلغ محدد)
  price?: number;          // السعر (لأوامر LIMIT فقط)
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface TradeResult {
  success: boolean;
  orderId?: string;
  symbol?: string;
  side?: string;
  executedQty?: string;
  cummulativeQuoteQty?: string;
  avgPrice?: string;
  status?: string;
  error?: string;
  errorCode?: number;
}

export interface AccountBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface SymbolInfo {
  symbol: string;
  minNotional: number;      // الحد الأدنى للصفقة بـ USDT
  stepSize: number;         // أصغر وحدة للكمية
  minQty: number;           // أقل كمية مسموحة
  tickSize: number;         // أصغر وحدة للسعر
}

// ==============================
// Storage Keys
// ==============================

const STORAGE_KEYS = {
  CREDENTIALS: 'binance_credentials',  // تخزين المفاتيح ككائن واحد
  AUTO_BUY_ENABLED: 'binance_auto_buy_enabled',
  AUTO_BUY_AMOUNT: 'binance_auto_buy_amount',
  TRADE_HISTORY: 'binance_trade_history',
  TESTNET_MODE: 'binance_testnet_mode',
};

// ==============================
// Credentials Management (بدون تشفير - يُخزن في Supabase)
// ==============================

export function saveCredentials(apiKey: string, secretKey: string): void {
  const credentials = { apiKey, secretKey };
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  console.log('🔐 تم حفظ مفاتيح API');
}

export function getCredentials(): BinanceCredentials | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
  
  if (!stored) {
    return null;
  }
  
  try {
    const credentials = JSON.parse(stored);
    if (credentials.apiKey && credentials.secretKey) {
      return credentials;
    }
  } catch (e) {
    console.error('خطأ في قراءة المفاتيح:', e);
  }
  
  return null;
}

export function hasCredentials(): boolean {
  return getCredentials() !== null;
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
  console.log('🗑️ تم حذف مفاتيح API');
}

// ==============================
// Auto-Buy Settings
// ==============================

export interface AutoBuySettings {
  enabled: boolean;
  amount: number;          // المبلغ الثابت بـ USDT
  testnetMode: boolean;    // وضع الاختبار
}

export function getAutoBuySettings(): AutoBuySettings {
  return {
    enabled: localStorage.getItem(STORAGE_KEYS.AUTO_BUY_ENABLED) === 'true',
    amount: parseFloat(localStorage.getItem(STORAGE_KEYS.AUTO_BUY_AMOUNT) || '10'),
    testnetMode: localStorage.getItem(STORAGE_KEYS.TESTNET_MODE) === 'true',
  };
}

export function saveAutoBuySettings(settings: Partial<AutoBuySettings>): void {
  if (settings.enabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_BUY_ENABLED, String(settings.enabled));
  }
  if (settings.amount !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_BUY_AMOUNT, String(settings.amount));
  }
  if (settings.testnetMode !== undefined) {
    localStorage.setItem(STORAGE_KEYS.TESTNET_MODE, String(settings.testnetMode));
  }
  console.log('⚙️ تم حفظ إعدادات الشراء التلقائي:', settings);
}

// ==============================
// Account Functions (عبر Supabase)
// ==============================

/**
 * جلب رصيد الحساب عبر Supabase Function
 */
export async function getAccountBalance(): Promise<AccountBalance[]> {
  console.log('🔍 [getAccountBalance] بدء جلب الرصيد...');
  
  const credentials = getCredentials();
  if (!credentials) {
    console.error('❌ [getAccountBalance] لا توجد مفاتيح API');
    throw new Error('لم يتم إعداد مفاتيح API');
  }

  console.log('✅ [getAccountBalance] المفاتيح موجودة');

  try {
    console.log('📤 [getAccountBalance] استدعاء دالة binance-portfolio...');
    
    const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apiKey: credentials.apiKey, 
        secretKey: credentials.secretKey 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [getAccountBalance] خطأ في الاستجابة:', errorData);
      throw new Error(errorData.error || 'فشل الاتصال بـ Binance');
    }

    const data = await response.json();
    console.log('📥 [getAccountBalance] الاستجابة:', data);

    if (!data || !data.balances) {
      console.error('❌ [getAccountBalance] بيانات غير صحيحة:', data);
      throw new Error('لم يتم استقبال بيانات من Binance');
    }

    console.log('✅ [getAccountBalance] تم جلب', data.balances.length, 'رصيد');
    
    return data.balances.filter((b: AccountBalance) => 
      parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  } catch (error: any) {
    console.error('❌ [getAccountBalance] خطأ:', error);
    throw error;
  }
}

/**
 * جلب رصيد USDT
 */
export async function getUSDTBalance(): Promise<number> {
  const balances = await getAccountBalance();
  const usdt = balances.find(b => b.asset === 'USDT');
  return usdt ? parseFloat(usdt.free) : 0;
}

/**
 * التحقق من صلاحية المفاتيح
 */
export async function validateCredentials(): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log('🔍 التحقق من صلاحية مفاتيح API...');
    const balances = await getAccountBalance();
    console.log('✅ المفاتيح صالحة! عدد الأصول:', balances.length);
    return { valid: true };
  } catch (error: any) {
    console.error('❌ فشل التحقق:', error);
    
    let errorMsg = error.message || 'فشل التحقق من المفاتيح';
    
    // إضافة تفاصيل أكثر للأخطاء الشائعة
    if (error.code === -2015) {
      errorMsg = 'مفاتيح API غير صالحة. تأكد من:\n1. نسخ API Key كاملاً\n2. نسخ Secret Key عند الإنشاء (يظهر مرة واحدة)';
    } else if (error.code === -1022) {
      errorMsg = 'Secret Key خطأ. أنشئ API جديد وانسخ Secret Key فوراً';
    } else if (error.code === -2014) {
      errorMsg = 'API Key غير موجود أو تم حذفه. أنشئ API جديد';
    }
    
    return { 
      valid: false, 
      error: errorMsg
    };
  }
}

// ==============================
// Symbol Info Functions
// ==============================

/**
 * جلب معلومات الرمز (الحدود والقواعد)
 */
export async function getSymbolInfo(symbol: string): Promise<SymbolInfo | null> {
  try {
    const response = await fetch(`${BINANCE_API_URL}/api/v3/exchangeInfo?symbol=${symbol}`);
    const data = await response.json();
    
    if (!data.symbols || data.symbols.length === 0) {
      return null;
    }

    const symbolData = data.symbols[0];
    const filters = symbolData.filters;

    const lotSizeFilter = filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const minNotionalFilter = filters.find((f: any) => f.filterType === 'NOTIONAL' || f.filterType === 'MIN_NOTIONAL');
    const priceFilter = filters.find((f: any) => f.filterType === 'PRICE_FILTER');

    return {
      symbol: symbolData.symbol,
      minNotional: parseFloat(minNotionalFilter?.minNotional || '10'),
      stepSize: parseFloat(lotSizeFilter?.stepSize || '0.00001'),
      minQty: parseFloat(lotSizeFilter?.minQty || '0.00001'),
      tickSize: parseFloat(priceFilter?.tickSize || '0.01'),
    };
  } catch (error) {
    console.error('Error fetching symbol info:', error);
    return null;
  }
}

/**
 * جلب السعر الحالي للعملة
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`${BINANCE_API_URL}/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching price:', error);
    return 0;
  }
}

// ==============================
// Trading Functions
// ==============================

/**
 * تحويل USDT إلى عملة معينة باستخدام Binance Convert (أبسط وأسهل من Market Order)
 */
export async function buyWithAmount(
  symbol: string, 
  usdtAmount: number
): Promise<TradeResult> {
  const credentials = getCredentials();
  if (!credentials) {
    return { success: false, error: 'لم يتم إعداد مفاتيح API' };
  }

  try {
    // إزالة USDT من السمبول إذا كان موجوداً (Convert API يحتاج فقط BTC وليس BTCUSDT)
    const cleanSymbol = symbol.toUpperCase().replace('USDT', '');
    
    console.log(`💱 محاولة تحويل $${usdtAmount} USDT إلى ${cleanSymbol}`);

    // تنفيذ التحويل عبر Supabase Function
    const convertParams = {
      apiKey: credentials.apiKey,
      secretKey: credentials.secretKey,
      fromAsset: 'USDT',
      toAsset: cleanSymbol,
      fromAmount: usdtAmount,
    };

    console.log('📤 إرسال طلب تحويل عبر Supabase:', convertParams);

    const { data, error } = await supabase.functions.invoke('binance-convert', {
      body: convertParams,
    });

    if (error) {
      console.error('❌ خطأ من Supabase Function:', error);
      return {
        success: false,
        error: error.message || 'فشل تنفيذ التحويل',
      };
    }

    if (!data || !data.success) {
      console.error('❌ فشل التحويل:', data);
      return {
        success: false,
        error: data?.error || 'فشل تنفيذ التحويل',
      };
    }

    console.log('✅ نتيجة التحويل:', data);

    // حفظ الصفقة في السجل
    saveTradeToHistory({
      orderId: data.orderId || String(Date.now()),
      symbol: `${cleanSymbol}USDT`,
      side: 'BUY',
      executedQty: data.toAmount || '0',
      cummulativeQuoteQty: String(usdtAmount),
      avgPrice: data.inversePrice || '0',
      status: 'FILLED',
      timestamp: Date.now(),
    });

    return {
      success: true,
      orderId: data.orderId,
      symbol: `${cleanSymbol}USDT`,
      side: 'BUY',
      executedQty: data.toAmount,
      cummulativeQuoteQty: String(usdtAmount),
      avgPrice: data.inversePrice,
      status: 'FILLED',
    };
  } catch (error: any) {
    console.error('❌ خطأ في التحويل:', error);
    return {
      success: false,
      error: error.message || 'فشل تنفيذ التحويل',
      errorCode: error.code,
    };
  }
}

/**
 * تنفيذ أمر شراء بكمية محددة
 */
/**
 * تنفيذ أمر شراء بكمية محددة
 */
export async function buyWithQuantity(
  symbol: string, 
  quantity: number
): Promise<TradeResult> {
  try {
    const tradingSymbol = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}USDT`;

    console.log(`🛒 محاولة شراء ${quantity} من ${tradingSymbol}`);

    const symbolInfo = await getSymbolInfo(tradingSymbol);
    if (!symbolInfo) {
      return { 
        success: false, 
        error: `الرمز ${tradingSymbol} غير موجود` 
      };
    }

    // تقريب الكمية حسب stepSize
    const adjustedQty = Math.floor(quantity / symbolInfo.stepSize) * symbolInfo.stepSize;
    
    if (adjustedQty < symbolInfo.minQty) {
      return { 
        success: false, 
        error: `الكمية أقل من الحد الأدنى (${symbolInfo.minQty})` 
      };
    }

    const orderParams = {
      symbol: tradingSymbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: adjustedQty.toFixed(8).replace(/\.?0+$/, ''),
    };

    const result = await signedRequest('/api/v3/order', 'POST', orderParams);

    saveTradeToHistory({
      orderId: result.orderId,
      symbol: tradingSymbol,
      side: 'BUY',
      executedQty: result.executedQty,
      cummulativeQuoteQty: result.cummulativeQuoteQty,
      avgPrice: (parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty)).toFixed(8),
      status: result.status,
      timestamp: Date.now(),
    });

    return {
      success: true,
      orderId: result.orderId,
      symbol: tradingSymbol,
      side: 'BUY',
      executedQty: result.executedQty,
      cummulativeQuoteQty: result.cummulativeQuoteQty,
      avgPrice: (parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty)).toFixed(8),
      status: result.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'فشل تنفيذ أمر الشراء',
      errorCode: error.code,
    };
  }
}

// ==============================
// Trade History
// ==============================

export interface TradeHistoryItem {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  executedQty: string;
  cummulativeQuoteQty: string;
  avgPrice: string;
  status: string;
  timestamp: number;
}

export function getTradeHistory(): TradeHistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveTradeToHistory(trade: TradeHistoryItem): void {
  const history = getTradeHistory();
  history.unshift(trade); // إضافة في البداية (الأحدث أولاً)
  
  // الاحتفاظ بآخر 100 صفقة فقط
  const trimmed = history.slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trimmed));
  
  console.log('📝 تم حفظ الصفقة في السجل:', trade.symbol);
}

export function clearTradeHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.TRADE_HISTORY);
}

// ==============================
// Auto-Buy Execution
// ==============================

/**
 * تنفيذ شراء تلقائي لعملة
 * يُستدعى عند إضافة عملة للمفضلات
 */
export async function executeAutoBuy(symbol: string): Promise<TradeResult> {
  const settings = getAutoBuySettings();
  
  if (!settings.enabled) {
    return { success: false, error: 'الشراء التلقائي معطّل' };
  }
  
  if (!hasCredentials()) {
    return { success: false, error: 'لم يتم إعداد مفاتيح API' };
  }
  
  console.log(`🤖 تنفيذ شراء تلقائي: ${symbol} بمبلغ $${settings.amount}`);
  
  return await buyWithAmount(symbol, settings.amount);
}

/**
 * شراء جماعي لقائمة عملات
 */
export async function bulkBuy(
  symbols: string[], 
  amountPerCoin: number
): Promise<{ symbol: string; result: TradeResult }[]> {
  const results: { symbol: string; result: TradeResult }[] = [];
  
  for (const symbol of symbols) {
    console.log(`🛒 شراء ${symbol}...`);
    const result = await buyWithAmount(symbol, amountPerCoin);
    results.push({ symbol, result });
    
    // تأخير بين الأوامر لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// ==============================
// Export Default
// ==============================

export default {
  // Credentials
  saveCredentials,
  getCredentials,
  hasCredentials,
  clearCredentials,
  validateCredentials,
  
  // Settings
  getAutoBuySettings,
  saveAutoBuySettings,
  
  // Account
  getAccountBalance,
  getUSDTBalance,
  
  // Trading
  buyWithAmount,
  buyWithQuantity,
  executeAutoBuy,
  bulkBuy,
  
  // Symbol Info
  getSymbolInfo,
  getCurrentPrice,
  
  // History
  getTradeHistory,
  clearTradeHistory,
};
