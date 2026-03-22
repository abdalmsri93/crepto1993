/**
 * 🔄 Context البحث التلقائي - يعمل في الخلفية دائماً
 * لا يتوقف عند تغيير الصفحات
 * ✅ يستخدم نفس معايير البحث اليدوي
 * 🛡️ يتضمن فلاتر أمان للحماية من العملات المشبوهة
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SearchCoin } from '@/utils/advancedSearch';
import { getDualAIAnalysis, DualAnalysis } from '@/lib/ai-analysis';
import { 
  getSmartTradingSettings, 
  getSmartTradingState,
  checkSufficientBalance,
  checkPortfolioCapacity,
  canStartNewCycle,
  registerBuy,
  getCurrentProfitPercent,
  saveSmartTradingState
} from '@/services/smartTradingService';
import { buyWithAmount, placeLimitSellOrder, hasCredentials, getAutoBuySettings, getAccountBalance, getUSDTBalance, getCachedUSDTBalance } from '@/services/binanceTrading';
import { addBuyRecord } from '@/services/tradeHistory';
// 🛡️ استيراد خدمة التحقق من العملات
import { 
  quickVerifyCoin, 
  verifyCoinOnCoinGecko, 
  WHITELIST_COINS, 
  EXTENDED_BLACKLIST 
} from '@/services/coinVerificationService';

// 🔧 دالة لحساب معايير Binance تلقائياً (نفس البحث اليدوي)
function calculateBinanceMetrics(ticker: any) {
  const volume24h = parseFloat(ticker.quoteVolume || 0);
  const priceChangePercent = parseFloat(ticker.priceChangePercent || 0);
  
  // حساب السيولة بناءً على الحجم
  let liquidity = "منخفضة";
  if (volume24h >= 1000000) liquidity = "عالية";
  else if (volume24h >= 500000) liquidity = "متوسطة";
  
  // حساب مستوى المخاطرة بناءً على التقلب والحجم
  let riskLevel = "متوسط";
  if (Math.abs(priceChangePercent) <= 3 && volume24h >= 500000) {
    riskLevel = "منخفض";
  } else if (Math.abs(priceChangePercent) > 10 || volume24h < 500000) {
    riskLevel = "عالي";
  }
  
  // حساب درجة الأداء
  const stabilityScore = Math.max(0, 10 - Math.abs(priceChangePercent));
  const volumeScore = Math.min(10, (volume24h / 5000000) * 10);
  let performanceScore = Math.round((stabilityScore + volumeScore) / 2);
  performanceScore = Math.min(10, Math.max(1, performanceScore));
  
  // التوصية بناءً على التغير السعري
  let recommendation = "💼 احتفاظ";
  if (priceChangePercent > 2) recommendation = "✅ شراء";
  else if (priceChangePercent < -2) recommendation = "📉 بيع";
  
  return {
    liquidity,
    riskLevel,
    performanceScore,
    recommendation,
  };
}

// ثوابت النظام
const DEFAULT_INTERVAL = 3 * 60 * 1000; // 3 دقائق
const COINS_PER_SEARCH = 5;
const MIN_USDT_BALANCE = 1;

// 🎯 نطاق السعر حسب نسبة الربح (ثابت)
const PRICE_RANGE_BY_PROFIT: { [key: number]: number } = {
  3: 5.00,    // نسبة 3% → سعر حتى $5.00
  5: 3.00,    // نسبة 5% → سعر حتى $3.00
  7: 2.00,    // نسبة 7% → سعر حتى $2.00
  9: 1.00,    // نسبة 9% → سعر حتى $1.00
  11: 0.50,   // نسبة 11% → سعر حتى $0.50
  13: 0.30,   // نسبة 13% → سعر حتى $0.30
  15: 0.20,   // نسبة 15% → سعر حتى $0.20
};

// 🚫 القائمة السوداء - نستخدم القائمة الموسعة من coinVerificationService
const BLACKLIST: string[] = EXTENDED_BLACKLIST;

// 📊 حدود تغير السعر 24 ساعة
const PRICE_CHANGE_LIMITS = {
  MIN: -10,    // الحد الأدنى: -10% (تجنب الانهيار)
  MAX: 3,      // الحد الأقصى: +3% (تجنب الشراء بعد الارتفاع)
  PUMP: 15,    // رفض Pump: > +15%
  DUMP: -15,   // رفض Dump: < -15%
};

// 💰 الحد الأدنى لحجم التداول
const MIN_VOLUME = 300000; // $300K — رفعناه لضمان سيولة حقيقية

// 🏆 الحد الأدنى لـ Pre-Score لإرسال العملة للـ AI
const MIN_PRE_SCORE = 5;

// 📊 عدد أفضل العملات التي نرسلها للـ AI بعد الفلترة
const TOP_COINS_FOR_AI = 8;

// حساب Pre-Score لكل عملة قبل AI (0-10)
function calculatePreScore(ticker: any): number {
  let score = 0;
  const volume24h = parseFloat(ticker.quoteVolume || 0);
  const priceChange = parseFloat(ticker.priceChangePercent || 0);
  const high24h = parseFloat(ticker.highPrice || 0);
  const low24h = parseFloat(ticker.lowPrice || 0);
  const lastPrice = parseFloat(ticker.lastPrice || 0);
  const numTrades = parseInt(ticker.count || 0);

  // 1. نقاط الحجم (0-3): حجم عالٍ = سيولة وثقة أعلى
  if (volume24h >= 5_000_000) score += 3;
  else if (volume24h >= 1_000_000) score += 2;
  else if (volume24h >= 300_000) score += 1;

  // 2. نقاط تغير السعر (0-2): نريد تغيراً هادئاً سلبياً قليلاً أو صفرياً
  if (priceChange >= -3 && priceChange <= 1) score += 2;       // مثالي
  else if (priceChange >= -5 && priceChange <= 2.5) score += 1; // مقبول

  // 3. نقاط الموضع في النطاق اليومي (0-2): قريب من القاع = أفضل للشراء
  if (high24h > low24h && lastPrice > 0) {
    const rangePos = ((lastPrice - low24h) / (high24h - low24h)) * 100;
    if (rangePos <= 25) score += 2;       // في ربع القاع — فرصة قوية
    else if (rangePos <= 45) score += 1;  // أقل من المنتصف
  }

  // 4. نقاط عدد الصفقات (0-2): صفقات كثيرة = اهتمام حقيقي
  if (numTrades >= 10000) score += 2;
  else if (numTrades >= 3000) score += 1;

  // 5. بونص القائمة البيضاء (0-1)
  const symbol = ticker.symbol.replace('USDT', '');
  if (WHITELIST_COINS.includes(symbol.toUpperCase())) score += 1;

  return Math.min(10, score);
}

// مفاتيح localStorage
const AUTO_SEARCH_KEY = 'auto_search_settings';
const FAVORITES_KEY = 'binance_watch_favorites';

export interface AutoSearchSettings {
  enabled: boolean;
  interval: number;
  coinsPerSearch: number;
  minBalance: number;
  lastRun?: string;
  totalSearches?: number;
  totalAdded?: number;
}

export interface AutoSearchStatus {
  isRunning: boolean;
  isSearching: boolean;
  lastSearch: string | null;
  nextSearch: string | null;
  currentCoin: string | null;
  searchCount: number;
  addedCount: number;
  skippedCount: number;
  error: string | null;
  logs: AutoSearchLog[];
}

export interface AutoSearchLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  coin?: string;
}

interface AutoSearchContextType {
  status: AutoSearchStatus;
  settings: AutoSearchSettings;
  startAutoSearch: () => void;
  stopAutoSearch: () => void;
  runManualSearch: () => Promise<void>;
  setSearchInterval: (minutes: number) => void;
  clearLogs: () => void;
  resetStats: () => void;
  isRunning: boolean;
  isSearching: boolean;
  calculatePriceRange: (balance: number) => { min: number; max: number };
  getUSDTBalance: () => number;
}

const AutoSearchContext = createContext<AutoSearchContextType | null>(null);

// دالة حساب نطاق السعر حسب نسبة الربح الحالية
function calculatePriceRange(usdtBalance: number): { min: number; max: number } {
  if (usdtBalance < MIN_USDT_BALANCE) {
    return { min: 0, max: 0 };
  }
  // جلب نسبة الربح الحالية
  const currentProfitPercent = getCurrentProfitPercentForSearch();
  
  // الحصول على الحد الأقصى للسعر حسب النسبة
  const maxPrice = PRICE_RANGE_BY_PROFIT[currentProfitPercent] || 5.00;
  
  console.log(`🎯 نسبة الربح: ${currentProfitPercent}% → نطاق السعر: $0.0001 - $${maxPrice}`);
  
  return { min: 0.0001, max: maxPrice };
}

// دالة مساعدة لجلب نسبة الربح الحالية للبحث
function getCurrentProfitPercentForSearch(): number {
  try {
    const stateKey = 'smart_trading_state';
    const stored = localStorage.getItem(stateKey);
    if (stored) {
      const state = JSON.parse(stored);
      return state.currentProfitPercent || 3;
    }
  } catch (error) {
    console.error('خطأ في قراءة نسبة الربح:', error);
  }
  return 3; // النسبة الافتراضية
}

// دالة قراءة رصيد USDT - تستخدم الدالة المركزية من binanceTrading
async function getUSDTBalanceLive(): Promise<number> {
  try {
    // استخدام الدالة المركزية التي تجلب من API وتحفظ تلقائياً
    return await getUSDTBalance();
  } catch (error) {
    console.log('⚠️ فشل جلب الرصيد من API، استخدام الكاش...');
    return getCachedUSDTBalance();
  }
}

// دالة متزامنة للقراءة السريعة من الكاش
function getUSDTBalanceFromCache(): number {
  return getCachedUSDTBalance();
}

// دالة حساب عدد العملات في المحفظة (غير USDT)
function getPortfolioCoinsCount(): number {
  try {
    const portfolioData = localStorage.getItem('binance_portfolio_data');
    if (portfolioData) {
      const data = JSON.parse(portfolioData);
      if (data.balances) {
        // عد العملات التي قيمتها > $1 (غير USDT)
        return data.balances.filter((b: any) => {
          const asset = b.asset?.toUpperCase();
          const value = parseFloat(b.usdValue || '0');
          return asset !== 'USDT' && value > 1;
        }).length;
      }
    }
    return 0;
  } catch (error) {
    console.error('❌ خطأ في حساب عدد العملات:', error);
    return 0;
  }
}

// جلب وفلترة العملات (نفس معايير البحث اليدوي)
async function fetchAndFilterCoins(priceRange: { min: number; max: number }): Promise<SearchCoin[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const tickers = await response.json();
    
    console.log(`📊 عدد العملات المتاحة: ${tickers.length}`);
    console.log(`🔍 البحث عن: USDT pairs, السعر: $${priceRange.min}-$${priceRange.max}, الحجم: >= $${MIN_VOLUME/1000}K`);
    
    // 1. تصفية أزواج USDT فقط
    const usdtCoins = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
    console.log(`📊 USDT Pairs: ${usdtCoins.length}`);
    
    // 2. 🚫 استبعاد القائمة السوداء
    const nonBlacklisted = usdtCoins.filter((t: any) => {
      const symbol = t.symbol.replace('USDT', '');
      const isBlacklisted = BLACKLIST.includes(symbol);
      if (isBlacklisted) {
        console.log(`🚫 مستبعد (قائمة سوداء): ${symbol}`);
      }
      return !isBlacklisted;
    });
    console.log(`🚫 بعد استبعاد القائمة السوداء: ${nonBlacklisted.length}`);
    
    // 3. فلترة السعر
    const priceFilteredCoins = nonBlacklisted.filter((t: any) => {
      const price = parseFloat(t.lastPrice || 0);
      return price >= priceRange.min && price <= priceRange.max;
    });
    console.log(`📈 بعد فلتر السعر: ${priceFilteredCoins.length}`);
    
    // 4. فلترة حجم التداول
    const volumeFilteredCoins = priceFilteredCoins.filter((t: any) => {
      const volume = parseFloat(t.quoteVolume || 0);
      return volume >= MIN_VOLUME;
    });
    console.log(`💰 بعد فلتر الحجم (${MIN_VOLUME/1000}K): ${volumeFilteredCoins.length}`);
    
    // 5. 📊 فلترة تغير السعر 24h (تجنب Pump و Dump)
    const priceChangeFilteredCoins = volumeFilteredCoins.filter((t: any) => {
      const priceChangePercent = parseFloat(t.priceChangePercent || 0);
      
      // رفض Pump (ارتفاع مفرط > 15%)
      if (priceChangePercent > PRICE_CHANGE_LIMITS.PUMP) {
        console.log(`🚀 مستبعد (Pump +${priceChangePercent.toFixed(1)}%): ${t.symbol.replace('USDT', '')}`);
        return false;
      }
      
      // رفض Dump (انهيار < -15%)
      if (priceChangePercent < PRICE_CHANGE_LIMITS.DUMP) {
        console.log(`📉 مستبعد (Dump ${priceChangePercent.toFixed(1)}%): ${t.symbol.replace('USDT', '')}`);
        return false;
      }
      
      // قبول فقط العملات المستقرة أو الهابطة قليلاً (-10% إلى +3%)
      if (priceChangePercent >= PRICE_CHANGE_LIMITS.MIN && priceChangePercent <= PRICE_CHANGE_LIMITS.MAX) {
        return true;
      }
      
      // العملات المرتفعة قليلاً (+3% إلى +15%) - نقبلها بحذر
      if (priceChangePercent > PRICE_CHANGE_LIMITS.MAX && priceChangePercent <= PRICE_CHANGE_LIMITS.PUMP) {
        // نقبلها لكن بأولوية أقل (سيتم ترتيبها لاحقاً)
        return true;
      }
      
      return false;
    });
    console.log(`📊 بعد فلتر تغير السعر (-10% إلى +15%): ${priceChangeFilteredCoins.length}`);
    
    // 6. تحويل لصيغة SearchCoin مع حساب المعايير + Pre-Score
    let coins: SearchCoin[] = priceChangeFilteredCoins.map((ticker: any) => {
      const price = parseFloat(ticker.lastPrice);
      const quoteVolume = parseFloat(ticker.quoteVolume || 0);
      const symbol = ticker.symbol.replace('USDT', '');
      const priceChangePercent = parseFloat(ticker.priceChangePercent);
      const metrics = calculateBinanceMetrics(ticker);
      const preScore = calculatePreScore(ticker);

      return {
        symbol: symbol,
        name: symbol,
        price: price,
        priceChange24h: priceChangePercent,
        volume24h: quoteVolume,
        volumePrice: quoteVolume,
        marketCap: quoteVolume,
        highPrice24h: ticker.highPrice,
        lowPrice24h: ticker.lowPrice,
        numTrades: parseInt(ticker.count || 0),
        rank: 0,
        category: 'Binance Direct',
        score: preScore,
        liquidity: metrics.liquidity,
        riskLevel: metrics.riskLevel,
        recommendation: metrics.recommendation,
        performanceScore: metrics.performanceScore,
        preScore: preScore,
      };
    });

    console.log(`✅ تم جلب ${coins.length} عملة من Binance بعد الفلاتر الأساسية`);

    // 7. فلترة السيولة
    coins = coins.filter(coin =>
      coin.liquidity === "عالية" || coin.liquidity === "متوسطة"
    );
    console.log(`بعد فلتر السيولة: ${coins.length}`);

    // 8. فلترة مستوى المخاطرة
    coins = coins.filter(coin =>
      coin.riskLevel === "منخفض" || coin.riskLevel === "متوسط"
    );
    console.log(`بعد فلتر مستوى المخاطرة: ${coins.length}`);

    // 9. 🛡️ فلتر الأمان
    coins = coins.filter(coin => {
      const check = quickVerifyCoin(coin.symbol);
      if (!check.safe) {
        console.log(`🛡️ مستبعد (${check.reason}): ${coin.symbol}`);
        return false;
      }
      return true;
    });
    console.log(`🛡️ بعد فلتر الأمان: ${coins.length}`);

    // 10. 🎯 فلتر Pre-Score — ترك العملات التي تستحق التحليل فقط
    const beforePreScore = coins.length;
    coins = coins.filter(coin => (coin.preScore || 0) >= MIN_PRE_SCORE);
    console.log(`🎯 بعد فلتر Pre-Score (>=${MIN_PRE_SCORE}): ${coins.length} (تم حذف ${beforePreScore - coins.length})`);

    // 11. 🏆 ترتيب بـ Pre-Score تنازلياً — الأفضل أولاً
    coins.sort((a, b) => (b.preScore || 0) - (a.preScore || 0));
    console.log(`🏆 ترتيب بـ Pre-Score — أعلى عملة: ${coins[0]?.symbol} (${coins[0]?.preScore}/10)`);

    // 12. نأخذ أفضل TOP_COINS_FOR_AI فقط لإرسالها للـ AI
    coins = coins.slice(0, TOP_COINS_FOR_AI);
    console.log(`📤 تم اختيار أفضل ${coins.length} عملة للتحليل بالـ AI`);

    // إضافة الترتيب
    coins = coins.map((coin, index) => ({
      ...coin,
      rank: index + 1
    }));

    console.log(`✅ النتيجة النهائية: ${coins.length} عملة جاهزة للـ AI`);

    return coins;
  } catch (error: any) {
    console.error('❌ خطأ في جلب العملات:', error.message);
    throw error;
  }
}

// اختيار أفضل العملات بناءً على Pre-Score (بدون عشوائية)
function selectTopCoins(coins: SearchCoin[], count: number): SearchCoin[] {
  // جلب العملات الموجودة في المفضلة والمحفظة لتجنب التكرار
  const saved = localStorage.getItem(FAVORITES_KEY);
  const favorites: SearchCoin[] = saved ? JSON.parse(saved) : [];
  const existingSymbols = new Set(favorites.map(f => f.symbol));

  // إضافة عملات المحفظة الحالية أيضاً
  try {
    const portfolioAssets = localStorage.getItem('binance_portfolio_assets');
    if (portfolioAssets) {
      const assets: string[] = JSON.parse(portfolioAssets);
      assets.forEach(a => existingSymbols.add(a.toUpperCase()));
    }
  } catch {}

  // استبعاد الموجودة
  const availableCoins = coins.filter(coin => !existingSymbols.has(coin.symbol.toUpperCase()));
  console.log(`🎯 اختيار ذكي: ${coins.length} مرشحة، ${existingSymbols.size} مستبعدة، ${availableCoins.length} جديدة`);

  if (availableCoins.length === 0) {
    console.log(`⚠️ كل العملات موجودة بالفعل!`);
    return [];
  }

  // الأولوية للأعلى Pre-Score — بدون عشوائية
  const sorted = [...availableCoins].sort((a, b) => (b.preScore || 0) - (a.preScore || 0));
  const selected = sorted.slice(0, count);

  console.log(`✅ تم اختيار: ${selected.map(c => `${c.symbol}(${c.preScore})`).join(', ')}`);
  return selected;
}

// للتوافق مع الكود القديم
const selectRandomCoins = selectTopCoins;

// إضافة للمفضلات
function addToFavorites(coin: SearchCoin): boolean {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    let favorites: SearchCoin[] = saved ? JSON.parse(saved) : [];
    
    const exists = favorites.some(f => f.symbol === coin.symbol);
    if (exists) return false;
    
    const coinWithTag: SearchCoin = {
      ...coin,
      category: '🤖 بحث تلقائي',
      addedAt: new Date().toISOString(),
      source: 'auto-search'
    };
    
    favorites.push(coinWithTag);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('❌ خطأ في إضافة للمفضلات:', error);
    return false;
  }
}

// إزالة من المفضلات
function removeFromFavorites(symbol: string): boolean {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (!saved) return false;
    
    let favorites: SearchCoin[] = JSON.parse(saved);
    const initialLength = favorites.length;
    favorites = favorites.filter(f => f.symbol !== symbol);
    
    if (favorites.length < initialLength) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      console.log(`🗑️ تمت إزالة ${symbol} من المفضلات`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطأ في إزالة من المفضلات:', error);
    return false;
  }
}

// التحقق من موافقة كلا AI
function bothAIRecommendBuy(analysis: DualAnalysis): boolean {
  return analysis.chatgpt.recommended === true && analysis.gemini.recommended === true;
}

// الإعدادات الافتراضية
function getDefaultSettings(): AutoSearchSettings {
  return {
    enabled: false,
    interval: DEFAULT_INTERVAL,
    coinsPerSearch: COINS_PER_SEARCH,
    minBalance: MIN_USDT_BALANCE,
    totalSearches: 0,
    totalAdded: 0
  };
}

export function AutoSearchProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AutoSearchSettings>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SEARCH_KEY);
      return saved ? JSON.parse(saved) : getDefaultSettings();
    } catch {
      return getDefaultSettings();
    }
  });
  
  const [status, setStatus] = useState<AutoSearchStatus>({
    isRunning: false,
    isSearching: false,
    lastSearch: null,
    nextSearch: null,
    currentCoin: null,
    searchCount: 0,
    addedCount: 0,
    skippedCount: 0,
    error: null,
    logs: []
  });
  
  // مراجع تبقى ثابتة
  const intervalRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const settingsRef = useRef(settings);

  // تحديث المرجع عند تغيير الإعدادات
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // إضافة log
  const addLog = useCallback((type: AutoSearchLog['type'], message: string, coin?: string) => {
    const log: AutoSearchLog = {
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      type,
      message,
      coin
    };
    
    setStatus(prev => ({
      ...prev,
      logs: [log, ...prev.logs.slice(0, 99)] // آخر 100 رسالة
    }));
    
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    console.log(`${icons[type]} [AutoSearch] ${message}`, coin ? `(${coin})` : '');
  }, []);

  // دورة بحث واحدة
  const runSearchCycle = useCallback(async () => {
    // التحقق من أن البحث لا يزال يعمل
    if (!isRunningRef.current) {
      console.log('⚠️ البحث متوقف، تخطي الدورة');
      return;
    }
    
    console.log('🚀 ======= بدء دورة بحث جديدة =======');
    
    setStatus(prev => ({ ...prev, isSearching: true, error: null }));
    addLog('info', '🚀 بدء دورة بحث جديدة');
    
    // 📋 طباعة جميع الإعدادات للتشخيص
    const credentials = hasCredentials();
    const groqKey = localStorage.getItem('groq_api_key');
    console.log('🔧 إعدادات النظام:', {
      hasCredentials: credentials,
      hasGroqKey: !!groqKey,
      groqKeyLength: groqKey?.length || 0
    });
    
    try {
      // جلب الرصيد مباشرة من Binance API
      addLog('info', '💰 جاري جلب رصيد USDT من Binance...');
      const usdtBalance = await getUSDTBalanceLive();
      addLog('info', `💰 رصيد USDT: $${usdtBalance.toFixed(2)}`);
      
      // 🎯 التحقق من شروط التداول الذكي
      const smartSettings = getSmartTradingSettings();
      const smartState = getSmartTradingState();
      
      // طباعة الإعدادات للتتبع
      console.log('📊 إعدادات التداول الذكي:', {
        enabled: smartSettings.enabled,
        buyAmount: smartSettings.buyAmount,
        maxPortfolioCoins: smartSettings.maxPortfolioCoins,
        currentCycle: smartState.currentCycle,
        currentProfitPercent: smartState.currentProfitPercent
      });
      
      if (smartSettings.enabled) {
        addLog('info', `🎯 نظام التداول الذكي مفعّل - الدورة ${smartState.currentCycle} - النسبة ${smartState.currentProfitPercent}%`);
        
        // ✅ التحقق من Binance API Keys
        if (!hasCredentials()) {
          addLog('error', `⛔ لا توجد مفاتيح Binance API - إيقاف البحث التلقائي`);
          addLog('warning', `💡 يرجى إضافة API Keys من الإعدادات أولاً`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          // إيقاف البحث تلقائياً
          stopAutoSearch();
          return;
        }
        
        // التحقق من الرصيد الكافي لعملة واحدة على الأقل
        if (usdtBalance < smartSettings.buyAmount) {
          addLog('error', `⛔ الرصيد غير كافي! متوفر: $${usdtBalance.toFixed(2)} - مطلوب: $${smartSettings.buyAmount}`);
          addLog('warning', `💡 البحث متوقف حتى يصبح الرصيد كافياً - إيقاف البحث التلقائي`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          // إيقاف البحث تلقائياً
          stopAutoSearch();
          return;
        }
        
        // التحقق من المحفظة (الحد الأقصى 50 عملة)
        const portfolioCoins = getPortfolioCoinsCount();
        if (portfolioCoins >= smartSettings.maxPortfolioCoins) {
          addLog('error', `⛔ المحفظة ممتلئة! ${portfolioCoins}/${smartSettings.maxPortfolioCoins} عملة`);
          addLog('warning', `💡 انتظر حتى يتم بيع بعض العملات - إيقاف البحث التلقائي`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          // إيقاف البحث تلقائياً
          stopAutoSearch();
          return;
        }
        
        addLog('success', `✅ الشروط متوفرة - المحفظة: ${portfolioCoins}/${smartSettings.maxPortfolioCoins} - الرصيد: $${usdtBalance.toFixed(2)}`);
      }
      
      if (usdtBalance < MIN_USDT_BALANCE) {
        addLog('warning', `⛔ الرصيد أقل من $${MIN_USDT_BALANCE}`);
        setStatus(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      // 🎯 جلب نسبة الربح الحالية لتحديد نطاق السعر
      const currentProfitPercent = getCurrentProfitPercentForSearch();
      const priceRange = calculatePriceRange(usdtBalance);
      addLog('info', `🎯 نسبة الربح: ${currentProfitPercent}% → نطاق السعر: $${priceRange.min} - $${priceRange.max}`);
      
      addLog('info', '🔍 جاري البحث...');
      const allCoins = await fetchAndFilterCoins(priceRange);
      
      if (allCoins.length === 0) {
        addLog('warning', 'لم يتم العثور على عملات');
        setStatus(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      const selectedCoins = selectRandomCoins(allCoins, COINS_PER_SEARCH);
      addLog('info', `📋 تم اختيار ${selectedCoins.length} عملة للتحليل`);
      
      // التحقق من وجود API Key
      const hasApiKey = !!localStorage.getItem('groq_api_key');
      if (!hasApiKey) {
        addLog('warning', '⚠️ لا يوجد Groq API Key - يعمل التحليل الأساسي');
      }
      
      let addedInCycle = 0;
      let skippedInCycle = 0;
      
      // 🎯 البحث المستمر - نضيف عملة واحدة كل دورة (حتى الوصول لـ 50)
      const maxToAdd = 1; // عملة واحدة كل دورة بحث
      
      for (const coin of selectedCoins) {
        if (!isRunningRef.current) break;
        
        // 🎯 التوقف إذا أضفنا عملة في هذه الدورة
        if (addedInCycle >= maxToAdd) {
          addLog('success', `🎯 تم إضافة عملة - الانتقال للدورة التالية`);
          break;
        }
        
        setStatus(prev => ({ ...prev, currentCoin: coin.symbol }));
        addLog('info', `🔎 تحليل ${coin.symbol} — Pre-Score: ${coin.preScore ?? '?'}/10 | تغير: ${coin.priceChange24h !== undefined ? coin.priceChange24h.toFixed(2) + '%' : 'N/A'}`, coin.symbol);
        
        try {
          const analysis = await getDualAIAnalysis({
            symbol: coin.symbol,
            price: coin.price?.toString() || '0',
            growth: coin.priceChange24h !== undefined ? `${coin.priceChange24h > 0 ? '+' : ''}${coin.priceChange24h.toFixed(2)}%` : (coin.growth || '0%'),
            riskLevel: coin.riskLevel || 'متوسط',
            liquidity: coin.liquidity || 'متوسطة',
            performanceScore: coin.performanceScore || 5,
            marketCap: coin.volume24h ? `$${(coin.volume24h / 1_000_000).toFixed(2)}M` : (coin.marketCap || '0'),
            recommendation: coin.recommendation || '',
            volume24h: coin.volume24h,
            highPrice24h: (coin as any).highPrice24h,
            lowPrice24h: (coin as any).lowPrice24h,
            numTrades: (coin as any).numTrades,
            preScore: coin.preScore,
          });
          
          // عرض تفاصيل التوصية
          const chatgptResult = analysis.chatgpt.recommended ? '✅ نعم' : '❌ لا';
          const geminiResult = analysis.gemini.recommended ? '✅ نعم' : '❌ لا';
          addLog('info', `  ChatGPT: ${chatgptResult} | Gemini: ${geminiResult}`, coin.symbol);
          
          // شرط الإضافة: كلاهما يجب أن يوافق (تشديد الفلتر)
          const bothRecommend = analysis.chatgpt.recommended && analysis.gemini.recommended;
          const atLeastOne = analysis.chatgpt.recommended || analysis.gemini.recommended;
          
          // ✅ يجب موافقة كلا الـ AI للشراء
          const shouldAdd = bothRecommend;
          
          addLog('info', `📊 نتيجة التحليل: bothRecommend=${bothRecommend}, atLeastOne=${atLeastOne}, shouldAdd=${shouldAdd}`, coin.symbol);
          
          if (shouldAdd) {
            const reason = 'كلا الـ AI يوافقان! ✅✅';
            addLog('success', `✨ ${reason}`, coin.symbol);
            
            addLog('info', `📝 محاولة إضافة ${coin.symbol} للمفضلات...`, coin.symbol);
            if (addToFavorites(coin)) {
              addedInCycle++;
              addLog('success', `⭐ تمت الإضافة للمفضلات`, coin.symbol);
              
              // 🎯 التحقق من إمكانية الشراء التلقائي
              addLog('info', `🔍 فحص شروط الشراء التلقائي...`, coin.symbol);
              addLog('info', `  - التداول الذكي مفعّل: ${smartSettings.enabled ? '✅' : '❌'}`, coin.symbol);
              addLog('info', `  - يوجد API Keys: ${hasCredentials() ? '✅' : '❌'}`, coin.symbol);
              
              // 🎯 تنفيذ الشراء الفعلي
              if (smartSettings.enabled && hasCredentials()) {
                // 🛡️ فحص أمان أخير قبل الشراء
                const securityCheck = quickVerifyCoin(coin.symbol);
                if (!securityCheck.safe) {
                  addLog('error', `🛡️ تم إيقاف الشراء - ${securityCheck.reason}`, coin.symbol);
                  addedInCycle--;
                  continue;
                }
                
                // 🌐 تحقق إضافي من CoinGecko للعملات غير الموثوقة
                if (!WHITELIST_COINS.includes(coin.symbol.toUpperCase())) {
                  addLog('info', `🔍 التحقق من ${coin.symbol} على CoinGecko...`, coin.symbol);
                  try {
                    const cgVerification = await verifyCoinOnCoinGecko(coin.symbol);
                    if (!cgVerification.verified) {
                      addLog('error', `🛡️ تم إيقاف الشراء - ${cgVerification.reason}`, coin.symbol);
                      addedInCycle--;
                      continue;
                    }
                    addLog('success', `✅ ${cgVerification.reason}`, coin.symbol);
                  } catch (verifyError) {
                    addLog('warning', `⚠️ تعذر التحقق من CoinGecko - متابعة بحذر`, coin.symbol);
                  }
                } else {
                  addLog('info', `✅ عملة موثوقة (قائمة بيضاء)`, coin.symbol);
                }
                
                let buySuccess = false;
                let buyAmount = 5; // سيُحسب من الرصيد الفعلي

                // ⚡ جلب الرصيد الحقيقي قبل الشراء مباشرة
                try {
                  addLog('info', `📡 جلب رصيد USDT من Binance API...`, coin.symbol);
                  const currentBalance = await getUSDTBalance();
                  addLog('info', `💰 رصيد USDT من API: $${currentBalance.toFixed(2)}`, coin.symbol);

                  // 5% من الرصيد المتاح — حد أدنى $5، حد أقصى $200
                  buyAmount = Math.min(200, Math.max(5, currentBalance * 0.05));
                  addLog('info', `💰 مبلغ الشراء: $${buyAmount.toFixed(2)} (5% من $${currentBalance.toFixed(2)})`, coin.symbol);

                  if (currentBalance < buyAmount) {
                    addLog('error', `⛔ الرصيد غير كافي! متوفر: $${currentBalance.toFixed(2)} - مطلوب: $${buyAmount.toFixed(2)}`, coin.symbol);
                    addLog('info', `💡 سيتم المحاولة مرة أخرى في الدورة القادمة`, coin.symbol);
                    addedInCycle--;
                    continue;
                  }
                  
                  addLog('info', `✅ الرصيد كافي - المتابعة للشراء`, coin.symbol);
                  addLog('info', `💳 جاري شراء $${buyAmount} من ${coin.symbol}...`, coin.symbol);
                } catch (balanceError: any) {
                  addLog('error', `❌ فشل جلب الرصيد: ${balanceError.message}`, coin.symbol);
                  console.error('Balance Error Details:', balanceError);
                  addLog('info', `💡 سيتم المحاولة مرة أخرى في الدورة القادمة`, coin.symbol);
                  addedInCycle--;
                  continue;
                }
                
                try {
                  addLog('info', `📤 إرسال أمر الشراء إلى Binance...`, coin.symbol);
                  const buyResult = await buyWithAmount(coin.symbol, buyAmount);
                  
                  addLog('info', `📥 استجابة Binance: ${buyResult.success ? 'نجح' : 'فشل'}`, coin.symbol);
                  
                  if (buyResult.success) {
                    buySuccess = true;
                    addLog('success', `✅ تم الشراء! الكمية: ${buyResult.executedQty}`, coin.symbol);

                    // 📜 تسجيل عملية الشراء في السجل
                    addBuyRecord(
                      coin.symbol,
                      parseFloat(buyResult.executedQty || '0'),
                      parseFloat(buyResult.avgPrice || '0'),
                      buyAmount,
                      true
                    );

                    // تسجيل في نظام التداول الذكي
                    registerBuy(coin.symbol);
                    const currentProfitPercent = getCurrentProfitPercent();
                    addLog('info', `📈 نسبة البيع لهذه العملة: ${currentProfitPercent}%`, coin.symbol);

                    // حفظ مبلغ الاستثمار للعملة
                    localStorage.setItem(`investment_${coin.symbol}`, String(buyAmount));

                    // 🎯 وضع Limit Sell Order على Binance
                    // الأمر يبقى على Binance ويُنفَّذ تلقائياً حتى لو أُغلق المتصفح
                    try {
                      const avgPrice = parseFloat(buyResult.avgPrice || '0');
                      const executedQty = parseFloat(buyResult.executedQty || '0');
                      if (avgPrice > 0 && executedQty > 0) {
                        const targetPrice = avgPrice * (1 + currentProfitPercent / 100);
                        addLog('info', `🎯 وضع Limit Sell @ $${targetPrice.toFixed(6)} (هدف +${currentProfitPercent}%)`, coin.symbol);
                        const limitResult = await placeLimitSellOrder(coin.symbol, executedQty, targetPrice);
                        if (limitResult.success) {
                          addLog('success', `✅ Limit Sell Order #${limitResult.orderId} — Binance سيبيع تلقائياً عند الهدف`, coin.symbol);
                        } else {
                          addLog('warning', `⚠️ تعذّر وضع Limit Sell: ${limitResult.error}`, coin.symbol);
                        }
                      }
                    } catch (limitError: any) {
                      addLog('warning', `⚠️ خطأ في Limit Sell: ${limitError.message}`, coin.symbol);
                    }
                  } else {
                    addLog('error', `❌ فشل الشراء: ${buyResult.error}`, coin.symbol);
                    addLog('info', `💡 العملة ستبقى في المفضلات - سيتم المحاولة مرة أخرى`, coin.symbol);
                    console.error('Buy Error Details:', buyResult);
                  }
                } catch (buyError: any) {
                  addLog('error', `❌ خطأ في الشراء: ${buyError.message}`, coin.symbol);
                  addLog('info', `💡 العملة ستبقى في المفضلات - سيتم المحاولة مرة أخرى`, coin.symbol);
                  console.error('Buy Exception:', buyError);
                }
                
                // ✅ العملة تبقى في المفضلات حتى لو فشل الشراء
                if (!buySuccess) {
                  addedInCycle--;
                  addLog('info', `📌 ${coin.symbol} ستبقى في المفضلات للمحاولة لاحقاً`, coin.symbol);
                }
              } else {
                // شرح سبب عدم الشراء
                if (!smartSettings.enabled) {
                  addLog('warning', `⚠️ التداول الذكي معطّل - لم يتم الشراء`, coin.symbol);
                } else if (!hasCredentials()) {
                  addLog('warning', `⚠️ لا يوجد API Keys - لم يتم الشراء`, coin.symbol);
                }
              }
            } else {
              skippedInCycle++;
              addLog('warning', `موجودة مسبقاً`, coin.symbol);
            }
          } else {
            skippedInCycle++;
            addLog('warning', `❌ لم ينصح أي AI - ChatGPT: ${chatgptResult}, Gemini: ${geminiResult}`, coin.symbol);
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          addLog('error', `خطأ: ${error.message}`, coin.symbol);
        }
      }
      
      // 🎯 إيقاف البحث مؤقتاً إذا تمت إضافة 3 عملات
      if (smartSettings.enabled && addedInCycle >= maxToAdd) {
        addLog('success', `⏸️ تم إضافة ${addedInCycle} عملات - البحث سيتوقف حتى يتم بيعها`);
      }
      
      setStatus(prev => ({
        ...prev,
        searchCount: prev.searchCount + 1,
        addedCount: prev.addedCount + addedInCycle,
        skippedCount: prev.skippedCount + skippedInCycle,
        currentCoin: null,
        lastSearch: new Date().toISOString()
      }));
      
      // تحديث وقت البحث التالي
      if (isRunningRef.current) {
        const nextTime = new Date(Date.now() + settingsRef.current.interval);
        setStatus(prev => ({ ...prev, nextSearch: nextTime.toISOString() }));
      }
      
      setSettings(prev => {
        const updated = {
          ...prev,
          lastRun: new Date().toISOString(),
          totalSearches: (prev.totalSearches || 0) + 1,
          totalAdded: (prev.totalAdded || 0) + addedInCycle
        };
        localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
        return updated;
      });
      
      addLog('success', `✅ انتهت الدورة - أضيف: ${addedInCycle}، تخطي: ${skippedInCycle}`);
      console.log('✅ ======= انتهت الدورة بنجاح =======');
      console.log(`📊 الدورات الكلية: ${(settings.totalSearches || 0) + 1}`);
      console.log(`⏰ الدورة القادمة بعد: ${settingsRef.current.interval / 60000} دقيقة`);
      
    } catch (error: any) {
      console.error('❌ ======= خطأ في الدورة =======', error);
      addLog('error', `❌ خطأ: ${error.message}`);
      setStatus(prev => ({ ...prev, error: error.message }));
    } finally {
      setStatus(prev => ({ ...prev, isSearching: false, currentCoin: null }));
      console.log(`🔍 حالة isRunningRef بعد الانتهاء: ${isRunningRef.current}`);
    }
  }, [addLog]); // إزالة settings.totalSearches لمنع إعادة إنشاء الدالة

  // بدء البحث
  const startAutoSearch = useCallback(() => {
    if (isRunningRef.current) return;
    
    console.log('🟢 بدء البحث التلقائي');
    isRunningRef.current = true;
    
    setStatus(prev => ({ ...prev, isRunning: true, error: null }));
    setSettings(prev => {
      const updated = { ...prev, enabled: true };
      localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
      return updated;
    });
    
    addLog('success', '🟢 تم تشغيل البحث التلقائي');
    
    // تشغيل فوري
    runSearchCycle();
    
    // جدولة التكرار باستخدام window.setInterval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    const scheduleNext = () => {
      intervalRef.current = window.setInterval(() => {
        console.log('⏰ وقت دورة جديدة...');
        console.log(`🔍 isRunningRef: ${isRunningRef.current}`);
        console.log(`🔍 intervalRef: ${intervalRef.current}`);
        
        if (isRunningRef.current) {
          runSearchCycle().catch(err => {
            console.error('❌ خطأ في دورة البحث:', err);
            // إعادة الجدولة حتى لو حدث خطأ
            if (isRunningRef.current) {
              console.log('🔄 إعادة جدولة بعد الخطأ...');
            }
          });
        } else {
          console.log('⚠️ البحث متوقف - تنظيف الـ interval');
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, settingsRef.current.interval);
      
      console.log(`✅ تم جدولة البحث كل ${settingsRef.current.interval / 60000} دقيقة`);
    };
    
    scheduleNext();
    
    // وقت البحث التالي
    const nextTime = new Date(Date.now() + settingsRef.current.interval);
    setStatus(prev => ({ ...prev, nextSearch: nextTime.toISOString() }));
    
  }, [runSearchCycle, addLog]);

  // إيقاف البحث
  const stopAutoSearch = useCallback(() => {
    console.log('🔴 إيقاف البحث التلقائي');
    isRunningRef.current = false;
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setStatus(prev => ({ 
      ...prev, 
      isRunning: false, 
      isSearching: false,
      nextSearch: null,
      currentCoin: null
    }));
    
    setSettings(prev => {
      const updated = { ...prev, enabled: false };
      localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
      return updated;
    });
    
    addLog('warning', '🔴 تم إيقاف البحث التلقائي');
  }, [addLog]);

  // تغيير الفترة
  const setSearchInterval = useCallback((minutes: number) => {
    const intervalMs = minutes * 60 * 1000;
    
    setSettings(prev => {
      const updated = { ...prev, interval: intervalMs };
      localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
      return updated;
    });
    
    addLog('info', `⏱️ تم تغيير فترة البحث إلى ${minutes} دقيقة`);
    
    // إعادة جدولة إذا كان يعمل
    if (isRunningRef.current && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      
      intervalRef.current = window.setInterval(() => {
        if (isRunningRef.current) {
          runSearchCycle();
        }
      }, intervalMs);
      
      const nextTime = new Date(Date.now() + intervalMs);
      setStatus(prev => ({ ...prev, nextSearch: nextTime.toISOString() }));
    }
  }, [addLog, runSearchCycle]);

  // بحث يدوي
  const runManualSearch = useCallback(async () => {
    if (status.isSearching) return;
    addLog('info', '🔄 بحث يدوي...');
    
    const wasRunning = isRunningRef.current;
    isRunningRef.current = true;
    await runSearchCycle();
    isRunningRef.current = wasRunning;
  }, [status.isSearching, runSearchCycle, addLog]);

  // مسح السجلات
  const clearLogs = useCallback(() => {
    setStatus(prev => ({ ...prev, logs: [] }));
  }, []);

  // إعادة تعيين الإحصائيات
  const resetStats = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      searchCount: 0,
      addedCount: 0,
      skippedCount: 0
    }));
    setSettings(prev => {
      const updated = { ...prev, totalSearches: 0, totalAdded: 0 };
      localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
      return updated;
    });
    addLog('info', '🔄 تم إعادة تعيين الإحصائيات');
  }, [addLog]);

  // التحقق من استمرارية البحث كل 30 ثانية
  useEffect(() => {
    const healthCheck = window.setInterval(() => {
      if (isRunningRef.current && !intervalRef.current) {
        console.log('🔄 إعادة جدولة البحث - الـ interval توقف');
        // إعادة الجدولة
        intervalRef.current = window.setInterval(() => {
          if (isRunningRef.current) {
            runSearchCycle().catch(console.error);
          }
        }, settingsRef.current.interval);
      }
    }, 30000); // كل 30 ثانية
    
    return () => {
      window.clearInterval(healthCheck);
    };
  }, [runSearchCycle]);

  // 🎯 الاستماع لحدث اكتمال دورة التداول الذكي
  useEffect(() => {
    const handleCycleComplete = (event: CustomEvent) => {
      console.log('🎉 استلام حدث اكتمال الدورة:', event.detail);
      addLog('success', `🎉 اكتملت دورة التداول! النسبة الجديدة: ${event.detail.newProfitPercent}%`);
      
      // إذا كان البحث يعمل، نبدأ دورة جديدة فوراً
      if (isRunningRef.current) {
        addLog('info', '🔄 بدء البحث عن عملات جديدة...');
        setTimeout(() => {
          runSearchCycle().catch(err => {
            console.error('خطأ في بدء دورة جديدة:', err);
          });
        }, 3000); // انتظار 3 ثواني قبل البدء
      } else {
        // إذا كان البحث متوقفاً، نشغله تلقائياً
        addLog('info', '🚀 تشغيل البحث التلقائي لدورة جديدة...');
        startAutoSearch();
      }
    };
    
    window.addEventListener('smart-trading-cycle-complete', handleCycleComplete as EventListener);
    
    return () => {
      window.removeEventListener('smart-trading-cycle-complete', handleCycleComplete as EventListener);
    };
  }, [runSearchCycle, startAutoSearch, addLog]);

  // تنظيف عند إغلاق التطبيق فقط
  useEffect(() => {
    return () => {
      // لا نوقف البحث - فقط ننظف الـ interval عند إغلاق التطبيق كلياً
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 🚀 بدء البحث التلقائي تلقائياً إذا كان التداول الذكي مفعّل
  useEffect(() => {
    const smartSettings = getSmartTradingSettings();
    const hasApiKeys = !!localStorage.getItem('binance_credentials');
    
    // إذا كان التداول الذكي مفعّل ومفاتيح API موجودة والبحث لم يبدأ بعد
    if (smartSettings.enabled && hasApiKeys && !isRunningRef.current) {
      console.log('🚀 بدء البحث التلقائي تلقائياً - التداول الذكي مفعّل');
      addLog('info', '🚀 بدء البحث التلقائي تلقائياً - التداول الذكي مفعّل');
      
      // تأخير بسيط لضمان تحميل كل شيء
      setTimeout(() => {
        if (!isRunningRef.current) {
          startAutoSearch();
        }
      }, 3000); // انتظار 3 ثواني
    }
  }, [startAutoSearch, addLog]);

  const value: AutoSearchContextType = {
    status,
    settings,
    startAutoSearch,
    stopAutoSearch,
    runManualSearch,
    setSearchInterval,
    clearLogs,
    resetStats,
    isRunning: status.isRunning,
    isSearching: status.isSearching,
    calculatePriceRange,
    getUSDTBalance
  };

  return (
    <AutoSearchContext.Provider value={value}>
      {children}
    </AutoSearchContext.Provider>
  );
}

export function useAutoSearch() {
  const context = useContext(AutoSearchContext);
  if (!context) {
    throw new Error('useAutoSearch must be used within AutoSearchProvider');
  }
  return context;
}

export default AutoSearchProvider;
