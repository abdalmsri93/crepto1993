/**
 * 🔄 خدمة البحث التلقائي الذكي
 * - يقرأ رصيد USDT من الأصول
 * - يحدد نطاق السعر تلقائياً
 * - يبحث كل 5 دقائق
 * - يحلل بـ AI (Groq + Gemini)
 * - يضيف للمفضلات إذا كلاهما ينصح بالشراء
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchCoin, applySmartFilters, rankCoins } from '@/utils/advancedSearch';
import { getDualAIAnalysis, DualAnalysis } from '@/lib/ai-analysis';

// ثوابت النظام
const AUTO_SEARCH_INTERVAL = 5 * 60 * 1000; // 5 دقائق
const COINS_PER_SEARCH = 5;
const MIN_USDT_BALANCE = 1; // الحد الأدنى للبحث

// مفتاح localStorage
const AUTO_SEARCH_KEY = 'auto_search_settings';
const FAVORITES_KEY = 'binance_watch_favorites';

export interface AutoSearchSettings {
  enabled: boolean;
  interval: number; // بالملي ثانية
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

/**
 * حساب نطاق السعر بناءً على رصيد USDT
 * رصيد 0-100 = سعر $1 وأقل
 * رصيد 100-200 = سعر $2 وأقل
 * وهكذا...
 */
export function calculatePriceRange(usdtBalance: number): { min: number; max: number } {
  if (usdtBalance < MIN_USDT_BALANCE) {
    return { min: 0, max: 0 }; // لا بحث
  }
  
  const maxPrice = Math.max(1, Math.ceil(usdtBalance / 100));
  return { min: 0.000001, max: maxPrice };
}

/**
 * قراءة رصيد USDT من الأصول المحفوظة
 */
function getUSDTBalance(): number {
  try {
    // محاولة 1: من بيانات المحفظة الكاملة
    const portfolioData = localStorage.getItem('binance_portfolio_data');
    if (portfolioData) {
      const data = JSON.parse(portfolioData);
      if (data.balances) {
        const usdtAsset = data.balances.find((b: any) => 
          b.asset?.toUpperCase() === 'USDT'
        );
        if (usdtAsset) {
          const balance = parseFloat(usdtAsset.free || usdtAsset.total || '0');
          console.log('💰 رصيد USDT من المحفظة:', balance);
          return balance;
        }
      }
    }

    // محاولة 2: من القيمة الإجمالية للأصول
    const totalValue = localStorage.getItem('binance_total_value');
    if (totalValue) {
      const value = parseFloat(totalValue);
      console.log('💰 القيمة الإجمالية:', value);
      return value;
    }

    // محاولة 3: من الأصول المحفوظة (تقدير)
    const savedAssets = localStorage.getItem('binance_portfolio_assets');
    if (savedAssets) {
      const assets = JSON.parse(savedAssets);
      // إذا وجدنا USDT في الأصول
      if (assets.includes('USDT')) {
        console.log('💰 USDT موجود في الأصول');
        return 10; // قيمة افتراضية
      }
    }

    console.log('⚠️ لم يتم العثور على رصيد USDT');
    return 0;
  } catch (error) {
    console.error('❌ خطأ في قراءة رصيد USDT:', error);
    return 0;
  }
}

/**
 * جلب العملات من Binance API مع تطبيق الفلاتر
 */
async function fetchAndFilterCoins(priceRange: { min: number; max: number }): Promise<SearchCoin[]> {
  try {
    console.log(`🔍 جلب العملات بنطاق سعر: $${priceRange.min} - $${priceRange.max}`);
    
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
    
    // تطبيق الفلاتر الذكية (30+ معيار)
    const filtered = applySmartFilters(tickers, {
      priceMin: priceRange.min,
      priceMax: priceRange.max
    });
    
    console.log(`📊 بعد الفلاتر: ${filtered.length} عملة`);
    
    // ترتيب حسب الأفضلية
    const ranked = rankCoins(filtered);
    
    return ranked;
  } catch (error: any) {
    console.error('❌ خطأ في جلب العملات:', error.message);
    throw error;
  }
}

/**
 * اختيار عملات عشوائية من القائمة المفلترة
 */
function selectRandomCoins(coins: SearchCoin[], count: number): SearchCoin[] {
  if (coins.length <= count) return coins;
  
  const selected: SearchCoin[] = [];
  const available = [...coins];
  
  // اختيار من أفضل 50% أولاً (عملات ذات ترتيب أعلى)
  const topHalf = Math.ceil(available.length / 2);
  const topCoins = available.slice(0, topHalf);
  
  for (let i = 0; i < count && topCoins.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * topCoins.length);
    selected.push(topCoins[randomIndex]);
    topCoins.splice(randomIndex, 1);
  }
  
  return selected;
}

/**
 * إضافة عملة للمفضلات
 */
function addToFavorites(coin: SearchCoin): boolean {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    let favorites: SearchCoin[] = [];
    
    if (saved) {
      favorites = JSON.parse(saved);
    }
    
    // التحقق من عدم وجود العملة مسبقاً
    const exists = favorites.some(f => f.symbol === coin.symbol);
    if (exists) {
      console.log(`⏭️ ${coin.symbol} موجودة مسبقاً في المفضلات`);
      return false;
    }
    
    // إضافة تصنيف "بحث تلقائي"
    const coinWithTag: SearchCoin = {
      ...coin,
      category: '🤖 بحث تلقائي',
      addedAt: new Date().toISOString(),
      source: 'auto-search'
    };
    
    favorites.push(coinWithTag);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    console.log(`✅ تمت إضافة ${coin.symbol} للمفضلات`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في إضافة للمفضلات:', error);
    return false;
  }
}

/**
 * التحقق من موافقة كلا الـ AI على الشراء
 */
function bothAIRecommendBuy(analysis: DualAnalysis): boolean {
  const chatgptBuy = analysis.chatgpt.recommended === true;
  const geminiBuy = analysis.gemini.recommended === true;
  
  console.log(`  🤖 ChatGPT: ${chatgptBuy ? '✅ شراء' : '❌ لا'}`);
  console.log(`  ✨ Gemini: ${geminiBuy ? '✅ شراء' : '❌ لا'}`);
  
  return chatgptBuy && geminiBuy;
}

/**
 * Hook رئيسي للبحث التلقائي
 */
export function useAutoSearch() {
  const [settings, setSettings] = useState<AutoSearchSettings>(() => {
    const saved = localStorage.getItem(AUTO_SEARCH_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultSettings();
      }
    }
    return getDefaultSettings();
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // الإعدادات الافتراضية
  function getDefaultSettings(): AutoSearchSettings {
    return {
      enabled: false,
      interval: AUTO_SEARCH_INTERVAL,
      coinsPerSearch: COINS_PER_SEARCH,
      minBalance: MIN_USDT_BALANCE,
      totalSearches: 0,
      totalAdded: 0
    };
  }

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
      logs: [log, ...prev.logs.slice(0, 49)] // آخر 50 رسالة
    }));
    
    // طباعة في console أيضاً
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    console.log(`${icons[type]} [AutoSearch] ${message}`, coin ? `(${coin})` : '');
  }, []);

  // تشغيل دورة بحث واحدة
  const runSearchCycle = useCallback(async () => {
    if (!isRunningRef.current) return;
    
    setStatus(prev => ({ ...prev, isSearching: true, error: null }));
    addLog('info', '🚀 بدء دورة بحث جديدة');
    
    try {
      // 1. قراءة رصيد USDT
      const usdtBalance = getUSDTBalance();
      addLog('info', `💰 رصيد USDT: $${usdtBalance.toFixed(2)}`);
      
      // 2. التحقق من الحد الأدنى
      if (usdtBalance < MIN_USDT_BALANCE) {
        addLog('warning', `⛔ الرصيد أقل من $${MIN_USDT_BALANCE} - تم إيقاف البحث`);
        setStatus(prev => ({ 
          ...prev, 
          isSearching: false,
          error: 'رصيد غير كافي'
        }));
        return;
      }
      
      // 3. حساب نطاق السعر
      const priceRange = calculatePriceRange(usdtBalance);
      addLog('info', `📊 نطاق السعر: $${priceRange.min} - $${priceRange.max}`);
      
      // 4. جلب وفلترة العملات
      addLog('info', '🔍 جاري البحث عن العملات...');
      const allCoins = await fetchAndFilterCoins(priceRange);
      
      if (allCoins.length === 0) {
        addLog('warning', 'لم يتم العثور على عملات تطابق المعايير');
        setStatus(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      // 5. اختيار 5 عملات
      const selectedCoins = selectRandomCoins(allCoins, COINS_PER_SEARCH);
      addLog('info', `📋 تم اختيار ${selectedCoins.length} عملة للتحليل`);
      
      let addedInCycle = 0;
      let skippedInCycle = 0;
      
      // 6. تحليل كل عملة
      for (const coin of selectedCoins) {
        if (!isRunningRef.current) break;
        
        setStatus(prev => ({ ...prev, currentCoin: coin.symbol }));
        addLog('info', `🔎 تحليل ${coin.symbol}...`, coin.symbol);
        
        try {
          // تحليل AI
          const analysis = await getDualAIAnalysis({
            symbol: coin.symbol,
            price: coin.price?.toString() || '0',
            growth: coin.growth || '0%',
            riskLevel: coin.riskLevel || 'متوسط',
            liquidity: coin.liquidity || 'متوسطة',
            performanceScore: coin.performanceScore || 5,
            marketCap: coin.marketCap || '0',
            recommendation: ''
          });
          
          // التحقق من موافقة كلاهما
          if (bothAIRecommendBuy(analysis)) {
            addLog('success', `✨ كلا الـ AI ينصحان بالشراء!`, coin.symbol);
            
            const added = addToFavorites(coin);
            if (added) {
              addedInCycle++;
              addLog('success', `⭐ تمت الإضافة للمفضلات`, coin.symbol);
            } else {
              skippedInCycle++;
              addLog('warning', `موجودة مسبقاً`, coin.symbol);
            }
          } else {
            skippedInCycle++;
            addLog('info', `❌ لم يتفقا على التوصية`, coin.symbol);
          }
          
          // تأخير بين العملات (2 ثانية)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          addLog('error', `خطأ في تحليل: ${error.message}`, coin.symbol);
        }
      }
      
      // 7. تحديث الإحصائيات
      setStatus(prev => ({
        ...prev,
        searchCount: prev.searchCount + 1,
        addedCount: prev.addedCount + addedInCycle,
        skippedCount: prev.skippedCount + skippedInCycle,
        currentCoin: null,
        lastSearch: new Date().toISOString()
      }));
      
      // حفظ الإعدادات
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
      
    } catch (error: any) {
      addLog('error', `❌ خطأ: ${error.message}`);
      setStatus(prev => ({ ...prev, error: error.message }));
    } finally {
      setStatus(prev => ({ ...prev, isSearching: false, currentCoin: null }));
    }
  }, [addLog]);

  // بدء البحث التلقائي
  const startAutoSearch = useCallback(() => {
    if (isRunningRef.current) return;
    
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
    
    // جدولة التكرار
    intervalRef.current = setInterval(() => {
      if (isRunningRef.current) {
        runSearchCycle();
      }
    }, settings.interval);
    
    // حساب وقت البحث التالي
    const nextSearchTime = new Date(Date.now() + settings.interval);
    setStatus(prev => ({ 
      ...prev, 
      nextSearch: nextSearchTime.toISOString() 
    }));
    
  }, [runSearchCycle, addLog, settings.interval]);

  // إيقاف البحث التلقائي
  const stopAutoSearch = useCallback(() => {
    isRunningRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
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

  // تشغيل بحث يدوي (مرة واحدة)
  const runManualSearch = useCallback(async () => {
    if (status.isSearching) return;
    
    addLog('info', '🔄 تشغيل بحث يدوي...');
    
    // تشغيل مؤقت
    const wasRunning = isRunningRef.current;
    isRunningRef.current = true;
    
    await runSearchCycle();
    
    // إعادة الحالة السابقة
    isRunningRef.current = wasRunning;
  }, [status.isSearching, runSearchCycle, addLog]);

  // تغيير فترة البحث
  const setSearchInterval = useCallback((minutes: number) => {
    const intervalMs = minutes * 60 * 1000;
    
    // تحديث الإعدادات
    setSettings(prev => {
      const updated = { ...prev, interval: intervalMs };
      localStorage.setItem(AUTO_SEARCH_KEY, JSON.stringify(updated));
      return updated;
    });
    
    addLog('info', `⏱️ تم تغيير فترة البحث إلى ${minutes} دقيقة`);
    
    // إذا كان البحث يعمل، نعيد تشغيله بالفترة الجديدة
    if (isRunningRef.current && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        if (isRunningRef.current) {
          runSearchCycle();
        }
      }, intervalMs);
      
      // تحديث وقت البحث التالي
      const nextSearchTime = new Date(Date.now() + intervalMs);
      setStatus(prev => ({ 
        ...prev, 
        nextSearch: nextSearchTime.toISOString() 
      }));
    }
  }, [addLog, runSearchCycle]);

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

  // تنظيف عند unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // استعادة الحالة إذا كان مفعّلاً
  useEffect(() => {
    if (settings.enabled && !isRunningRef.current) {
      // لا نبدأ تلقائياً - المستخدم يجب أن يضغط زر التشغيل
      console.log('ℹ️ البحث التلقائي كان مفعّلاً سابقاً');
    }
  }, []);

  return {
    // الحالة
    status,
    settings,
    
    // الأفعال
    startAutoSearch,
    stopAutoSearch,
    runManualSearch,
    setSearchInterval,
    clearLogs,
    resetStats,
    
    // المساعدات
    isRunning: status.isRunning,
    isSearching: status.isSearching,
    calculatePriceRange,
    getUSDTBalance
  };
}

export default useAutoSearch;
