/**
 * 🔄 Context البحث التلقائي - يعمل في الخلفية دائماً
 * لا يتوقف عند تغيير الصفحات
 * ✅ يستخدم نفس معايير البحث اليدوي
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
    console.log(`🔍 البحث عن: USDT pairs, السعر: $${priceRange.min}-$${priceRange.max}, الحجم: >= $50K`);
    
    // 1. تصفية أزواج USDT فقط
    const usdtCoins = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
    console.log(`📊 USDT Pairs: ${usdtCoins.length}`);
    
    // 2. فلترة السعر
    const priceFilteredCoins = usdtCoins.filter((t: any) => {
      const price = parseFloat(t.lastPrice || 0);
      return price >= priceRange.min && price <= priceRange.max;
    });
    console.log(`📈 بعد فلتر السعر: ${priceFilteredCoins.length}`);
    
    // 3. فلترة حجم التداول (>= $50,000) - نفس البحث اليدوي
    const volumeFilteredCoins = priceFilteredCoins.filter((t: any) => {
      const volume = parseFloat(t.quoteVolume || 0);
      return volume >= 50000;
    });
    console.log(`💰 بعد فلتر الحجم (50K): ${volumeFilteredCoins.length}`);
    
    // 4. تحويل لصيغة SearchCoin مع حساب المعايير
    let coins: SearchCoin[] = volumeFilteredCoins.map((ticker: any) => {
      const price = parseFloat(ticker.lastPrice);
      const quoteVolume = parseFloat(ticker.quoteVolume || 0);
      const symbol = ticker.symbol.replace('USDT', '');
      const priceChangePercent = parseFloat(ticker.priceChangePercent);
      const metrics = calculateBinanceMetrics(ticker);
      
      return {
        symbol: symbol,
        name: symbol,
        price: price,
        priceChange24h: priceChangePercent,
        volume24h: quoteVolume,
        volumePrice: quoteVolume,
        marketCap: quoteVolume, // نستخدم الحجم كتقدير
        rank: 0,
        category: 'Binance Direct',
        score: metrics.performanceScore,
        liquidity: metrics.liquidity,
        riskLevel: metrics.riskLevel,
        recommendation: metrics.recommendation,
        performanceScore: metrics.performanceScore,
      };
    });
    
    console.log(`✅ تم جلب ${coins.length} عملة من Binance بعد الفلاتر الأساسية`);
    
    // 5. فلترة بناءً على Market Cap (>= $100K)
    coins = coins.filter(coin => coin.volume24h >= 100000);
    console.log(`بعد فلتر Market Cap: ${coins.length}`);
    
    // 6. فلترة السيولة (عالية أو متوسطة فقط)
    coins = coins.filter(coin => 
      coin.liquidity === "عالية" || coin.liquidity === "متوسطة"
    );
    console.log(`بعد فلتر السيولة: ${coins.length}`);
    
    // 7. فلترة مستوى المخاطرة (منخفض أو متوسط فقط)
    coins = coins.filter(coin => 
      coin.riskLevel === "منخفض" || coin.riskLevel === "متوسط"
    );
    console.log(`بعد فلتر مستوى المخاطرة: ${coins.length}`);
    
    // 8. ترتيب حسب درجة الأداء
    coins.sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
    
    // إضافة الترتيب
    coins = coins.map((coin, index) => ({
      ...coin,
      rank: index + 1
    }));
    
    console.log(`✅ النتيجة النهائية: ${coins.length} عملة`);
    
    return coins;
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
    
    console.log('🚀 ======= بدء دورة بحث جديدة =======');
    
    setStatus(prev => ({ ...prev, isSearching: true, error: null }));
    addLog('info', '🚀 بدء دورة بحث جديدة');
    
    try {
      const usdtBalance = getUSDTBalance();
      addLog('info', `💰 رصيد USDT: $${usdtBalance.toFixed(2)}`);
      
      // 🎯 التحقق من شروط التداول الذكي
      const smartSettings = getSmartTradingSettings();
      const smartState = getSmartTradingState();
      
      if (smartSettings.enabled) {
        addLog('info', `🎯 نظام التداول الذكي مفعّل - الدورة ${smartState.currentCycle} - النسبة ${smartState.currentProfitPercent}%`);
        
        // التحقق من الرصيد الكافي لـ 3 عملات
        const requiredBalance = smartSettings.coinsPerCycle * smartSettings.buyAmount;
        if (usdtBalance < requiredBalance) {
          addLog('warning', `⛔ الرصيد غير كافي! متوفر: $${usdtBalance.toFixed(2)} - مطلوب: $${requiredBalance}`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          return;
        }
        
        // التحقق من عدد العملات المعلقة
        if (smartState.pendingCoins.length >= smartSettings.coinsPerCycle) {
          addLog('warning', `⏳ يوجد ${smartState.pendingCoins.length} عملات قيد الانتظار - انتظر البيع`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          return;
        }
        
        // التحقق من المحفظة
        const portfolioCoins = getPortfolioCoinsCount();
        if (portfolioCoins >= smartSettings.maxPortfolioCoins) {
          addLog('warning', `⛔ المحفظة ممتلئة! ${portfolioCoins}/${smartSettings.maxPortfolioCoins}`);
          setStatus(prev => ({ ...prev, isSearching: false }));
          return;
        }
        
        addLog('success', `✅ جميع الشروط متوفرة - بدء البحث عن ${smartSettings.coinsPerCycle} عملات`);
      }
      
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
      
      // 🎯 تحديد الحد الأقصى للإضافة (3 عملات في التداول الذكي)
      // إعادة استخدام المتغيرات المحلية
      const maxToAdd = smartSettings.enabled 
        ? smartSettings.coinsPerCycle - smartState.pendingCoins.length 
        : COINS_PER_SEARCH;
      
      for (const coin of selectedCoins) {
        if (!isRunningRef.current) break;
        
        // 🎯 التوقف إذا وصلنا للحد المطلوب
        if (smartSettings.enabled && addedInCycle >= maxToAdd) {
          addLog('success', `🎯 تم إضافة ${addedInCycle} عملات - الحد المطلوب`);
          break;
        }
        
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
              
              // 🎯 تسجيل في نظام التداول الذكي
              if (smartSettings.enabled) {
                registerBuy(coin.symbol);
                const currentProfitPercent = getCurrentProfitPercent();
                addLog('info', `📈 نسبة البيع لهذه العملة: ${currentProfitPercent}%`, coin.symbol);
              }
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
