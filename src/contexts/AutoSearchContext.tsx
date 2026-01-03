/**
 * 🔄 Context البحث التلقائي - يعمل في الخلفية دائماً
 * لا يتوقف عند تغيير الصفحات
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SearchCoin, applySmartFilters, rankCoins } from '@/utils/advancedSearch';
import { getDualAIAnalysis, DualAnalysis } from '@/lib/ai-analysis';

// ثوابت النظام
const DEFAULT_INTERVAL = 5 * 60 * 1000; // 5 دقائق
const COINS_PER_SEARCH = 5;
const MIN_USDT_BALANCE = 1;

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

// دالة حساب نطاق السعر
function calculatePriceRange(usdtBalance: number): { min: number; max: number } {
  if (usdtBalance < MIN_USDT_BALANCE) {
    return { min: 0, max: 0 };
  }
  const maxPrice = Math.max(1, Math.ceil(usdtBalance / 100));
  return { min: 0.000001, max: maxPrice };
}

// دالة قراءة رصيد USDT
function getUSDTBalance(): number {
  try {
    const portfolioData = localStorage.getItem('binance_portfolio_data');
    if (portfolioData) {
      const data = JSON.parse(portfolioData);
      if (data.balances) {
        const usdtAsset = data.balances.find((b: any) => 
          b.asset?.toUpperCase() === 'USDT'
        );
        if (usdtAsset) {
          return parseFloat(usdtAsset.free || usdtAsset.total || '0');
        }
      }
    }

    const totalValue = localStorage.getItem('binance_total_value');
    if (totalValue) {
      return parseFloat(totalValue);
    }

    const savedAssets = localStorage.getItem('binance_portfolio_assets');
    if (savedAssets) {
      const assets = JSON.parse(savedAssets);
      if (assets.includes('USDT')) {
        return 10;
      }
    }

    return 0;
  } catch (error) {
    console.error('❌ خطأ في قراءة رصيد USDT:', error);
    return 0;
  }
}

// جلب وفلترة العملات
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
    const filtered = applySmartFilters(tickers, {
      priceMin: priceRange.min,
      priceMax: priceRange.max
    });
    
    return rankCoins(filtered);
  } catch (error: any) {
    console.error('❌ خطأ في جلب العملات:', error.message);
    throw error;
  }
}

// اختيار عملات عشوائية
function selectRandomCoins(coins: SearchCoin[], count: number): SearchCoin[] {
  if (coins.length <= count) return coins;
  
  const selected: SearchCoin[] = [];
  const topHalf = Math.ceil(coins.length / 2);
  const topCoins = coins.slice(0, topHalf);
  
  for (let i = 0; i < count && topCoins.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * topCoins.length);
    selected.push(topCoins[randomIndex]);
    topCoins.splice(randomIndex, 1);
  }
  
  return selected;
}

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
    
    setStatus(prev => ({ ...prev, isSearching: true, error: null }));
    addLog('info', '🚀 بدء دورة بحث جديدة');
    
    try {
      const usdtBalance = getUSDTBalance();
      addLog('info', `💰 رصيد USDT: $${usdtBalance.toFixed(2)}`);
      
      if (usdtBalance < MIN_USDT_BALANCE) {
        addLog('warning', `⛔ الرصيد أقل من $${MIN_USDT_BALANCE}`);
        setStatus(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      const priceRange = calculatePriceRange(usdtBalance);
      addLog('info', `📊 نطاق السعر: $${priceRange.min} - $${priceRange.max}`);
      
      addLog('info', '🔍 جاري البحث...');
      const allCoins = await fetchAndFilterCoins(priceRange);
      
      if (allCoins.length === 0) {
        addLog('warning', 'لم يتم العثور على عملات');
        setStatus(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      const selectedCoins = selectRandomCoins(allCoins, COINS_PER_SEARCH);
      addLog('info', `📋 تم اختيار ${selectedCoins.length} عملة`);
      
      // التحقق من وجود API Key
      const hasApiKey = !!localStorage.getItem('groq_api_key');
      if (!hasApiKey) {
        addLog('warning', '⚠️ لا يوجد Groq API Key - يعمل التحليل الأساسي');
      }
      
      let addedInCycle = 0;
      let skippedInCycle = 0;
      
      for (const coin of selectedCoins) {
        if (!isRunningRef.current) break;
        
        setStatus(prev => ({ ...prev, currentCoin: coin.symbol }));
        addLog('info', `🔎 تحليل ${coin.symbol}...`, coin.symbol);
        
        try {
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
          
          // عرض تفاصيل التوصية
          const chatgptResult = analysis.chatgpt.recommended ? '✅ نعم' : '❌ لا';
          const geminiResult = analysis.gemini.recommended ? '✅ نعم' : '❌ لا';
          addLog('info', `  ChatGPT: ${chatgptResult} | Gemini: ${geminiResult}`, coin.symbol);
          
          // شرط الإضافة: كلاهما أو أحدهما (حسب الإعداد)
          const bothRecommend = analysis.chatgpt.recommended && analysis.gemini.recommended;
          const atLeastOne = analysis.chatgpt.recommended || analysis.gemini.recommended;
          
          // استخدام شرط "أحدهما على الأقل" إذا لم يكن هناك API Key
          // أو "كلاهما" إذا كان هناك API Key
          const shouldAdd = hasApiKey ? bothRecommend : atLeastOne;
          
          if (shouldAdd) {
            const reason = bothRecommend ? 'كلاهما ينصح!' : 'أحدهما ينصح';
            addLog('success', `✨ ${reason}`, coin.symbol);
            
            if (addToFavorites(coin)) {
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
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          addLog('error', `خطأ: ${error.message}`, coin.symbol);
        }
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
      
    } catch (error: any) {
      addLog('error', `❌ خطأ: ${error.message}`);
      setStatus(prev => ({ ...prev, error: error.message }));
    } finally {
      setStatus(prev => ({ ...prev, isSearching: false, currentCoin: null }));
    }
  }, [addLog]);

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
    
    intervalRef.current = window.setInterval(() => {
      console.log('⏰ وقت دورة جديدة...');
      if (isRunningRef.current) {
        runSearchCycle();
      }
    }, settingsRef.current.interval);
    
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

  // تنظيف عند إغلاق التطبيق فقط
  useEffect(() => {
    return () => {
      // لا نوقف البحث - فقط ننظف الـ interval عند إغلاق التطبيق كلياً
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

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
