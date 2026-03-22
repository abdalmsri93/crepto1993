/**
 * خدمة التداول مع Binance API
 * تنفيذ أوامر الشراء عبر Supabase Functions
 */

import { supabase } from '@/integrations/supabase/client';
import { backupCoinInvestment } from './investmentBackupService';
import { getCoinTargetProfit, saveCoinTargetProfit, registerBuy } from './smartTradingService';

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
  AUTO_SELL_ENABLED: 'binance_auto_sell_enabled',
  AUTO_SELL_PROFIT_PERCENT: 'binance_auto_sell_profit_percent',
  TRADE_HISTORY: 'binance_trade_history',
  TESTNET_MODE: 'binance_testnet_mode',
  USDT_BALANCE: 'binance_usdt_balance',  // 💰 رصيد USDT المحدث
  LAST_BALANCE_UPDATE: 'binance_last_balance_update', // آخر تحديث للرصيد
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
// Auto-Sell Settings (البيع التلقائي عند الربح)
// ==============================

export interface AutoSellSettings {
  enabled: boolean;
  profitPercent: number;   // نسبة الربح للبيع (مثل 10%)
}

export function getAutoSellSettings(): AutoSellSettings {
  // ✅ تفعيل تلقائي عند أول استخدام
  const storedEnabled = localStorage.getItem(STORAGE_KEYS.AUTO_SELL_ENABLED);
  if (storedEnabled === null) {
    // أول مرة - فعّل تلقائياً
    localStorage.setItem(STORAGE_KEYS.AUTO_SELL_ENABLED, 'true');
    console.log('🎯 تم تفعيل البيع التلقائي تلقائياً');
  }
  
  return {
    enabled: localStorage.getItem(STORAGE_KEYS.AUTO_SELL_ENABLED) === 'true',
    profitPercent: parseFloat(localStorage.getItem(STORAGE_KEYS.AUTO_SELL_PROFIT_PERCENT) || '10'),
  };
}

export function saveAutoSellSettings(settings: Partial<AutoSellSettings>): void {
  if (settings.enabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_SELL_ENABLED, String(settings.enabled));
  }
  if (settings.profitPercent !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_SELL_PROFIT_PERCENT, String(settings.profitPercent));
  }
  console.log('⚙️ تم حفظ إعدادات البيع التلقائي:', settings);
}

/**
 * بيع عملة وتحويلها إلى USDT
 */
export async function sellAsset(asset: string, quantity?: number): Promise<TradeResult> {
  const credentials = getCredentials();
  if (!credentials) {
    return { success: false, error: 'لم يتم إعداد مفاتيح API' };
  }

  try {
    console.log(`💰 بيع ${asset}${quantity ? ` (كمية: ${quantity})` : ' (كل الرصيد)'}`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/binance-sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({
        apiKey: credentials.apiKey,
        secretKey: credentials.secretKey,
        asset: asset,
        quantity: quantity,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ خطأ في البيع:', data);
      return {
        success: false,
        error: data?.error || 'فشل تنفيذ البيع',
      };
    }

    console.log('✅ تم البيع بنجاح:', data);
    
    return {
      success: true,
      orderId: data.orderId,
      symbol: data.symbol,
      side: 'SELL',
      executedQty: data.executedQty,
      cummulativeQuoteQty: data.receivedUsdt,
      avgPrice: data.avgPrice,
      status: data.status,
    };
  } catch (error: any) {
    console.error('❌ خطأ في البيع:', error);
    return {
      success: false,
      error: error.message || 'فشل تنفيذ البيع',
    };
  }
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
  console.log('🔑 [getAccountBalance] API Key length:', credentials.apiKey?.length);
  console.log('🔑 [getAccountBalance] Secret Key length:', credentials.secretKey?.length);
  console.log('🔑 [getAccountBalance] API Key prefix:', credentials.apiKey?.substring(0, 8) + '...');

  try {
    console.log('📤 [getAccountBalance] استدعاء دالة binance-portfolio...');
    
    const requestBody = { 
      apiKey: credentials.apiKey, 
      secretKey: credentials.secretKey 
    };
    console.log('📦 [getAccountBalance] Request body:', JSON.stringify(requestBody));
    
    const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(requestBody)
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
 * جلب رصيد USDT - المصدر الرئيسي للحقيقة
 * يجلب من API ويحفظ في localStorage تلقائياً
 */
export async function getUSDTBalance(): Promise<number> {
  try {
    const balances = await getAccountBalance();
    const usdt = balances.find(b => b.asset === 'USDT');
    const balance = usdt ? parseFloat(usdt.free) : 0;
    
    // 💰 حفظ الرصيد في localStorage كمصدر موثوق
    localStorage.setItem(STORAGE_KEYS.USDT_BALANCE, String(balance));
    localStorage.setItem(STORAGE_KEYS.LAST_BALANCE_UPDATE, String(Date.now()));
    console.log('💰 [getUSDTBalance] رصيد USDT:', balance);
    
    return balance;
  } catch (error) {
    console.error('❌ [getUSDTBalance] فشل جلب الرصيد من API');
    // fallback للكاش
    return getCachedUSDTBalance();
  }
}

/**
 * قراءة رصيد USDT من الكاش (للاستخدام السريع)
 */
export function getCachedUSDTBalance(): number {
  const cached = localStorage.getItem(STORAGE_KEYS.USDT_BALANCE);
  return cached ? parseFloat(cached) : 0;
}

/**
 * تحديث رصيد USDT بعد عملية شراء/بيع
 */
export function updateCachedBalance(newBalance: number): void {
  localStorage.setItem(STORAGE_KEYS.USDT_BALANCE, String(newBalance));
  localStorage.setItem(STORAGE_KEYS.LAST_BALANCE_UPDATE, String(Date.now()));
  console.log('💾 [updateCachedBalance] تم تحديث الرصيد:', newBalance);
}

/**
 * خصم مبلغ من الرصيد المحفوظ (بعد الشراء)
 */
export function deductFromCachedBalance(amount: number): void {
  const current = getCachedUSDTBalance();
  const newBalance = Math.max(0, current - amount);
  updateCachedBalance(newBalance);
  console.log(`💸 [deductFromCachedBalance] خصم $${amount} → الرصيد الجديد: $${newBalance}`);
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

// Supabase Configuration
const SUPABASE_URL = 'https://dpxuacnrncwyopehwxsj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHVhY25ybmN3eW9wZWh3eHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTE1ODksImV4cCI6MjA4MjkyNzU4OX0.1AIdMc4COv30K-XUL3zU6wHAZ_1JlCaNKpmOY90AXRk';

/**
 * إنشاء توقيع HMAC-SHA256 للمتصفح
 */
async function createSignature(queryString: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(queryString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * تحويل USDT إلى عملة معينة باستخدام Market Order مباشرة
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
    // تحضير الرمز
    const tradingSymbol = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase().replace('USDT', '')}USDT`;
    
    console.log(`💱 محاولة شراء $${usdtAmount} من ${tradingSymbol}`);

    // التحقق من الحد الأدنى
    if (usdtAmount < 5) {
      return { 
        success: false, 
        error: `الحد الأدنى للشراء هو $5` 
      };
    }

    // 💰 جلب الرصيد الحقيقي من API قبل الشراء
    console.log('💰 جلب رصيد USDT الحقيقي من API...');
    const realBalance = await getUSDTBalance();
    console.log(`💵 رصيد USDT الحقيقي: $${realBalance}`);
    
    if (realBalance < usdtAmount) {
      return {
        success: false,
        error: `رصيد USDT غير كافٍ. المتاح: $${realBalance.toFixed(2)}، المطلوب: $${usdtAmount}`,
      };
    }

    console.log('📤 إرسال أمر الشراء مباشرة عبر Vite Proxy...');
    console.log('💱 Symbol:', tradingSymbol);
    console.log('💵 Amount: $', usdtAmount);

    // 🚀 استخدام Vite proxy للوصول إلى Binance API
    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol: tradingSymbol,
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: usdtAmount.toFixed(2),
      timestamp: timestamp.toString(),
    });

    // إنشاء التوقيع
    const signature = await createSignature(params.toString(), credentials.secretKey);
    params.append('signature', signature);

    const response = await fetch(`/api/binance/api/v3/order?${params.toString()}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
      },
    });

    const data = await response.json();
    console.log('📥 Binance Response:', data);

    if (!response.ok || data.code) {
      console.error('❌ خطأ من Binance:', data);
      
      // توضيح الخطأ بشكل أفضل
      let errorMessage = data?.msg || 'فشل تنفيذ الشراء';
      if (data?.code === -2010) {
        errorMessage = 'رصيد غير كافٍ في حساب Binance';
      } else if (data?.code === -1021) {
        errorMessage = 'خطأ في التوقيت - تحقق من ساعة النظام';
      } else if (data?.code === -1022) {
        errorMessage = 'توقيع غير صحيح - تحقق من Secret Key';
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: data?.code,
      };
    }

    console.log('✅ نتيجة الشراء:', data);

    // تحضير اسم الرمز للحفظ
    const cleanSymbol = tradingSymbol.replace('USDT', '');

    // حساب السعر المتوسط
    const avgPrice = data.fills && data.fills.length > 0 
      ? data.fills[0].price 
      : (parseFloat(data.cummulativeQuoteQty) / parseFloat(data.executedQty)).toFixed(8);

    // حفظ الصفقة في السجل
    saveTradeToHistory({
      orderId: data.orderId || String(Date.now()),
      symbol: tradingSymbol,
      side: 'BUY',
      executedQty: data.executedQty || '0',
      cummulativeQuoteQty: data.cummulativeQuoteQty || String(usdtAmount),
      avgPrice: avgPrice,
      status: data.status || 'FILLED',
      timestamp: Date.now(),
    });

    // 🔒 حفظ بيانات الاستثمار في النسخة الاحتياطية
    const targetProfit = getCoinTargetProfit(cleanSymbol);
    backupCoinInvestment(cleanSymbol, usdtAmount, targetProfit);
    console.log(`💾 تم حفظ بيانات استثمار ${cleanSymbol}: $${usdtAmount}, ربح ${targetProfit}%`);

    // 🎯 تسجيل الشراء في Smart Trading وتخصيص نسبة ربح
    registerBuy(cleanSymbol);
    console.log(`✅ تم تسجيل ${cleanSymbol} في Smart Trading`);

    // 💸 خصم المبلغ من الرصيد المحفوظ
    deductFromCachedBalance(usdtAmount);

    return {
      success: true,
      orderId: data.orderId,
      symbol: data.symbol || tradingSymbol,
      side: data.side || 'BUY',
      executedQty: data.executedQty || '0',
      cummulativeQuoteQty: data.cummulativeQuoteQty || String(usdtAmount),
      avgPrice: avgPrice,
      status: data.status || 'FILLED',
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
 * وضع أمر Limit Sell على Binance بسعر الهدف
 * الأمر يبقى على Binance ويُنفَّذ تلقائياً حتى لو أُغلق المتصفح
 */
export async function placeLimitSellOrder(
  symbol: string,
  quantity: number,
  targetPrice: number
): Promise<TradeResult> {
  const credentials = getCredentials();
  if (!credentials) {
    return { success: false, error: 'لم يتم إعداد مفاتيح API' };
  }

  try {
    const tradingSymbol = symbol.toUpperCase().endsWith('USDT')
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase().replace('USDT', '')}USDT`;

    console.log(`🎯 وضع Limit Sell: ${tradingSymbol} | كمية: ${quantity} | سعر: ${targetPrice}`);

    // جلب معلومات الرمز لضبط الكمية والسعر
    const symbolInfo = await getSymbolInfo(tradingSymbol);
    const stepSize = symbolInfo?.stepSize || 0.00001;
    const tickSize = symbolInfo?.tickSize || 0.00001;
    const minQty = symbolInfo?.minQty || 0.00001;

    // ضبط الكمية حسب stepSize
    const adjustedQty = Math.floor(quantity / stepSize) * stepSize;
    if (adjustedQty < minQty) {
      return { success: false, error: `الكمية أقل من الحد الأدنى (${minQty})` };
    }

    // ضبط السعر حسب tickSize
    const adjustedPrice = Math.round(targetPrice / tickSize) * tickSize;

    // تحضير الباراميترات
    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol: tradingSymbol,
      side: 'SELL',
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: adjustedQty.toFixed(8).replace(/\.?0+$/, ''),
      price: adjustedPrice.toFixed(8).replace(/\.?0+$/, ''),
      timestamp: timestamp.toString(),
    });

    const signature = await createSignature(params.toString(), credentials.secretKey);
    params.append('signature', signature);

    const response = await fetch(`/api/binance/api/v3/order?${params.toString()}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
      },
    });

    const data = await response.json();
    console.log('📥 Limit Sell Response:', data);

    if (!response.ok || data.code) {
      let errorMessage = data?.msg || 'فشل وضع أمر البيع';
      if (data?.code === -1013) {
        errorMessage = 'الكمية أو السعر خارج النطاق المسموح';
      } else if (data?.code === -2010) {
        errorMessage = 'رصيد غير كافٍ من العملة';
      }
      return { success: false, error: errorMessage, errorCode: data?.code };
    }

    console.log(`✅ تم وضع Limit Sell Order: #${data.orderId} على Binance`);

    return {
      success: true,
      orderId: data.orderId,
      symbol: tradingSymbol,
      side: 'SELL',
      executedQty: data.origQty,
      avgPrice: adjustedPrice.toString(),
      status: data.status,
    };
  } catch (error: any) {
    console.error('❌ خطأ في Limit Sell:', error);
    return { success: false, error: error.message || 'فشل وضع أمر البيع' };
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
  getAutoSellSettings,
  saveAutoSellSettings,
  
  // Account
  getAccountBalance,
  getUSDTBalance,
  
  // Trading
  buyWithAmount,
  buyWithQuantity,
  executeAutoBuy,
  bulkBuy,
  sellAsset,
  placeLimitSellOrder,
  
  // Symbol Info
  getSymbolInfo,
  getCurrentPrice,
  
  // History
  getTradeHistory,
  clearTradeHistory,
};
