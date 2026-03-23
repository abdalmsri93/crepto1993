import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioHeader } from "@/components/PortfolioHeader";
import { AssetCard } from "@/components/AssetCard";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { AutoSearchPanel } from "@/components/AutoSearchPanel";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Settings as SettingsIcon, CheckCircle, Zap, X, AlertTriangle, Wallet, Server, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAutoSearch } from "@/contexts/AutoSearchContext";
import { assignProfitPercentsToExistingCoins, sortCoinsByProfitPercent } from "@/services/smartTradingService";
import { addBuyRecord, getTradeHistory } from "@/services/tradeHistory";
import { DUST_THRESHOLD } from "@/services/investmentBackupService";
import { updateCachedBalance } from "@/services/binanceTrading";
import { getBotConfig, setBotEnabled, runBotNow } from "@/services/botConfigService";
import type { Session } from "@supabase/supabase-js";

interface Balance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  usdValue: string;
  priceChangePercent?: string;
  currentPrice?: string;
  dayPnL?: string;
}

interface PortfolioData {
  balances: Balance[];
  totalValue: string;
  totalDayPnL?: string;
  dayPnLPercent?: string;
  lastUpdate: string;
}

const Index = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | 'unknown'>('unknown');
  const [showAutoSearch, setShowAutoSearch] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔄 استخدام البحث التلقائي
  const { stopAutoSearch, isRunning: autoSearchRunning } = useAutoSearch();

  // 🛑 زر الإيقاف الطارئ (لوكل فقط)
  const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [localStopped, setLocalStopped] = useState(false);

  const handleEmergencyStop = () => {
    // 1️⃣ إيقاف البحث التلقائي
    stopAutoSearch();
    // 2️⃣ إيقاف الشراء التلقائي
    localStorage.setItem('binance_auto_buy_enabled', 'false');
    // 3️⃣ تعطيل البحث التلقائي
    localStorage.setItem('auto_search_enabled', 'false');
    setLocalStopped(true);
    toast({
      title: "🛑 تم إيقاف اللوكل",
      description: "⚠️ البوت 24/7 على السيرفر لا يزال يعمل",
      variant: "destructive",
    });
  };

  // 🤖 حالة البوت 24/7
  const [botEnabled, setBotEnabledState] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [botLastRun, setBotLastRun] = useState<string | null>(null);

  useEffect(() => {
    getBotConfig().then(cfg => {
      if (cfg) {
        setBotEnabledState(cfg.enabled);
        setBotLastRun(cfg.last_run || null);
      }
    });
  }, []);

  // � التحقق من صلاحية مفتاح Groq API
  useEffect(() => {
    const checkGroqApiKey = async () => {
      const apiKey = localStorage.getItem('groq_api_key');
      
      if (!apiKey || apiKey.trim() === '') {
        setApiKeyError('مفتاح Groq AI غير موجود - التحليل الذكي لن يعمل');
        return;
      }
      
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5,
          }),
        });
        
        if (response.status === 401) {
          setApiKeyError('مفتاح Groq AI غير صالح أو منتهي الصلاحية');
          console.error('❌ Groq API Key invalid (401)');
        } else if (response.status === 429) {
          // Rate limit - المفتاح صالح لكن تجاوز الحد
          setApiKeyError(null);
          console.log('⚠️ Groq API rate limited but key is valid');
        } else if (response.ok) {
          setApiKeyError(null);
          console.log('✅ Groq API Key is valid');
        } else {
          const errorText = await response.text();
          console.error('❌ Groq API Error:', response.status, errorText);
          setApiKeyError(`خطأ في Groq API: ${response.status}`);
        }
      } catch (error) {
        console.error('Error checking Groq API:', error);
        // لا نعرض خطأ إذا كان مشكلة اتصال فقط
      }
    };
    
    checkGroqApiKey();
  }, []);


  useEffect(() => {
    // تحميل المحفظة مباشرة بدون Auth
    fetchPortfolio();
    console.log('🚀 بدء التحديث التلقائي - كل 30 ثانية');
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      console.log('🔄 تحديث تلقائي...', new Date().toLocaleTimeString());
      fetchPortfolio();
    }, 30000); // 30000 ms = 30 ثانية
    
    return () => clearInterval(interval);
  }, []);
  
  // 🔄 إعادة المحاولة تلقائياً إذا فشل التحميل
  useEffect(() => {
    if (connectionStatus === 'disconnected' && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`🔄 إعادة المحاولة ${retryCount + 1}/3...`);
        setRetryCount(prev => prev + 1);
        fetchPortfolio();
      }, 2000); // انتظر 2 ثانية ثم أعد المحاولة
      
      return () => clearTimeout(retryTimer);
    }
  }, [connectionStatus, retryCount]);

  const fetchPortfolio = async () => {
    
    try {
      setIsLoading(true);
      console.log('Fetching portfolio data...');
      
      // قراءة المفاتيح من localStorage
      let stored = localStorage.getItem('binance_credentials');

      // إذا ما لقينا مفاتيح في localStorage، نحاول نجيبهم من Supabase
      if (!stored) {
        console.log('🔍 محاولة استعادة المفاتيح من Supabase...');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: keyData } = await supabase
              .from("encrypted_binance_keys" as any)
              .select("encrypted_api_key, encrypted_secret_key")
              .eq("user_id", user.id)
              .eq("is_active", true)
              .single();

            if (keyData && (keyData as any).encrypted_api_key && (keyData as any).encrypted_secret_key) {
              const restoredCreds = {
                apiKey: atob((keyData as any).encrypted_api_key),
                secretKey: atob((keyData as any).encrypted_secret_key)
              };
              localStorage.setItem('binance_credentials', JSON.stringify(restoredCreds));
              stored = JSON.stringify(restoredCreds);
              console.log('✅ تم استعادة المفاتيح من Supabase');
            }
          }
        } catch (e) {
          console.error('فشل استعادة المفاتيح من Supabase:', e);
        }
      }

      if (!stored) {
        console.log('⚠️ لا توجد مفاتيح API');
        setConnectionStatus('disconnected');
        setPortfolio({ balances: [], totalValue: '0', lastUpdate: new Date().toISOString() });
        setIsLoading(false);
        return;
      }

      const credentials = JSON.parse(stored);
      
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHVhY25ybmN3eW9wZWh3eHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTE1ODksImV4cCI6MjA4MjkyNzU4OX0.1AIdMc4COv30K-XUL3zU6wHAZ_1JlCaNKpmOY90AXRk';
      const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching portfolio:', errorData);
        setConnectionStatus('disconnected');
        setPortfolio({ balances: [], totalValue: '0', lastUpdate: new Date().toISOString() });
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Portfolio data received:', data);
      
      // 💾 حفظ بيانات المحفظة الكاملة في localStorage
      if (data) {
        localStorage.setItem('binance_portfolio_data', JSON.stringify(data));
        console.log('💾 تم حفظ بيانات المحفظة');
        
        // 💰 حفظ رصيد USDT المتاح باستخدام الدالة المركزية
        const usdtAsset = data.balances?.find((b: any) => b.asset?.toUpperCase() === 'USDT');
        if (usdtAsset) {
          const usdtFree = parseFloat(usdtAsset.free || usdtAsset.total || '0');
          updateCachedBalance(usdtFree);
          console.log('💰 تحديث رصيد USDT المركزي:', usdtFree);
        }
      }
      
      // حفظ عملات المحفظة في localStorage للفلترة التلقائية للمفضلات
      if (data && data.balances && data.balances.length > 0) {
        const portfolioAssets = data.balances.map((b: any) => b.asset.toUpperCase());
        localStorage.setItem('binance_portfolio_assets', JSON.stringify(portfolioAssets));
        console.log('📦 حفظ عملات المحفظة:', portfolioAssets);
        
        // 🎯 تعيين نسب البيع للعملات الموجودة - مرة واحدة فقط عند أول تشغيل
        const hasInitialized = localStorage.getItem('smart_trading_initialized');
        if (!hasInitialized) {
          const coinsWithValue = data.balances
            .filter((b: any) => b.asset !== 'USDT' && parseFloat(b.usdValue || '0') > 1)
            .map((b: any) => b.asset);
          if (coinsWithValue.length > 0) {
            console.log('🔧 تهيئة أولية - تعيين النسب للعملات الموجودة');
            assignProfitPercentsToExistingCoins(coinsWithValue);
            localStorage.setItem('smart_trading_initialized', 'true');
          }
        }
        
        // 📜 تسجيل العمليات السابقة في السجل (مرة واحدة)
        const existingHistory = getTradeHistory();
        const registeredAssets = new Set(existingHistory.map((t: any) => t.asset));
        
        for (const balance of data.balances) {
          if (balance.asset === 'USDT') continue;
          const usdValue = parseFloat(balance.usdValue || '0');
          if (usdValue < 1) continue; // تخطي العملات بقيمة أقل من $1
          
          // التحقق إذا كانت مسجلة مسبقاً
          if (registeredAssets.has(balance.asset)) continue;
          
          // جلب الاستثمار أو استخدام $5 كقيمة افتراضية
          const investment = localStorage.getItem(`investment_${balance.asset}`);
          const investmentAmount = investment ? parseFloat(investment) : 5;
          
          // إذا لم يكن الاستثمار محفوظاً، نحفظه
          if (!investment) {
            localStorage.setItem(`investment_${balance.asset}`, '5');
          }
          
          const quantity = parseFloat(balance.total);
          const price = quantity > 0 ? investmentAmount / quantity : 0;
          
          addBuyRecord(
            balance.asset,
            quantity,
            price,
            investmentAmount,
            true
          );
          console.log(`📜 تم تسجيل ${balance.asset} في السجل - استثمار: $${investmentAmount}`);
        }
        
        // حذف العملات من المفضلات إذا أصبحت في المحفظة
        const favoritesKey = 'binance_watch_favorites';
        const savedFavorites = localStorage.getItem(favoritesKey);
        if (savedFavorites) {
          try {
            const favorites = JSON.parse(savedFavorites);
            const portfolioSet = new Set(portfolioAssets);
            const filteredFavorites = favorites.filter((fav: any) => {
              const symbolWithoutUSDT = fav.symbol.replace(/USDT$/i, '').toUpperCase();
              const isInPortfolio = portfolioSet.has(symbolWithoutUSDT) || portfolioSet.has(fav.symbol.toUpperCase());
              if (isInPortfolio) {
                console.log(`🗑️ حذف ${fav.symbol} من المفضلات (موجودة في المحفظة)`);
              }
              return !isInPortfolio;
            });
            
            if (filteredFavorites.length !== favorites.length) {
              localStorage.setItem(favoritesKey, JSON.stringify(filteredFavorites));
              console.log(`📋 تم تحديث المفضلات: ${favorites.length} → ${filteredFavorites.length}`);
            }
          } catch (e) {
            console.error('Error filtering favorites:', e);
          }
        }
      }
      
      if (data && data.balances && data.balances.length === 0 && data.message) {
        console.warn('Empty portfolio:', data.message);
        toast({
          title: "محفظة فارغة",
          description: data.message,
          variant: "destructive",
        });
      }
      
      setPortfolio(data);
      setConnectionStatus('connected');
      setRetryCount(0); // إعادة تعيين العداد عند النجاح
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات محفظتك",
      });
    } catch (error: any) {
      console.error('Failed to fetch portfolio:', error);
      setConnectionStatus('disconnected');
      setIsLoading(false);
      
      // عرض محفظة فارغة بدلاً من البقاء في حالة خطأ
      setPortfolio({ balances: [], totalValue: '0', lastUpdate: new Date().toISOString() });
      
      if (error.message?.includes('not configured')) {
        toast({
          title: "مفاتيح API غير موجودة",
          description: "يرجى إضافة مفاتيح Binance API في صفحة الإعدادات",
        });
      } else {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات المحفظة. يمكنك البدء بإضافة مفاتيح API أو استكشاف العملات",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      console.log('Testing Binance connection...');
      
      const stored = localStorage.getItem('binance_credentials');
      if (!stored) {
        setConnectionStatus('disconnected');
        toast({
          title: "فشل الاتصال",
          description: "مفاتيح Binance API غير موجودة. يرجى إضافتها في الإعدادات.",
          variant: "destructive",
        });
        return;
      }
      
      const credentials = JSON.parse(stored);
      
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHVhY25ybmN3eW9wZWh3eHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTE1ODksImV4cCI6MjA4MjkyNzU4OX0.1AIdMc4COv30K-XUL3zU6wHAZ_1JlCaNKpmOY90AXRk';
      const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey
        })
      });

      if (!response.ok) {
        setConnectionStatus('disconnected');
        toast({
          title: "فشل الاتصال",
          description: "تحقق من صحة مفاتيح API في الإعدادات",
          variant: "destructive",
        });
        return;
      }

      setConnectionStatus('connected');
      toast({
        title: "نجح الاتصال",
        description: "تم الاتصال بـ Binance بنجاح",
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "فشل الاتصال",
        description: error.message || "حدث خطأ أثناء اختبار الاتصال",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-t-2 border-emerald-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="font-mono text-sm text-white/40 uppercase tracking-[0.3em]">LOADING PORTFOLIO</p>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">

        {/* API Key Warning */}
        {apiKeyError && (
          <div className="mb-4 p-3.5 bg-yellow-500/8 border border-yellow-500/25 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-mono text-yellow-400">{apiKeyError}</p>
                <p className="text-xs font-mono text-white/30 mt-0.5">يمكنك إنشاء مفتاح جديد من Groq Console</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-xs font-mono">
                  مفتاح جديد
                </Button>
              </a>
              <NavLink to="/settings">
                <Button variant="outline" size="sm" className="border-white/10 text-white/40 hover:text-white/60 text-xs font-mono">
                  <SettingsIcon className="w-3.5 h-3.5 mr-1" />
                  إعدادات
                </Button>
              </NavLink>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        <nav className="mb-6 flex justify-between items-center gap-3 flex-wrap animate-fade-in delay-100">
          <div className="flex gap-2">
            <NavLink to="/settings">
              <Button variant="outline" size="sm" className="gap-2 bg-white/3 border-white/10 hover:bg-white/6 hover:border-white/20 text-white/50 hover:text-white/80 font-mono text-xs transition-all">
                <SettingsIcon className="w-3.5 h-3.5" />
                الإعدادات
              </Button>
            </NavLink>
            <NavLink to="/portfolio-rebalance">
              <Button variant="outline" size="sm" className="gap-2 bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/35 text-purple-400/70 hover:text-purple-400 font-mono text-xs transition-all">
                موازنة المحفظة
              </Button>
            </NavLink>
          </div>

          <div className="flex gap-2">
            {/* 🛑 زر الإيقاف الطارئ - لوكل فقط */}
            {isLocalEnv && (
              <Button
                onClick={handleEmergencyStop}
                size="sm"
                className={`gap-2 font-mono text-xs transition-all ${
                  localStopped
                    ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                }`}
              >
                <ShieldOff className="w-3 h-3" />
                {localStopped ? 'موقوف ✓' : 'إيقاف لوكل'}
              </Button>
            )}

            {/* زر البوت 24/7 */}
            <Button
              onClick={async () => {
                setBotLoading(true);
                const result = await setBotEnabled(!botEnabled);
                if (result.success) {
                  setBotEnabledState(!botEnabled);
                  toast({
                    title: !botEnabled ? "🤖 البوت مفعّل!" : "البوت متوقف",
                    description: !botEnabled
                      ? "يعمل 24/7 على السيرفر — المتصفح غير مطلوب"
                      : "توقف البوت على السيرفر",
                  });
                } else {
                  toast({ title: "❌ خطأ", description: result.error, variant: "destructive" });
                }
                setBotLoading(false);
              }}
              disabled={botLoading}
              size="sm"
              className={`gap-2 font-mono text-xs transition-all ${
                botEnabled
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                  : 'bg-slate-500/10 border border-slate-500/20 text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              {botLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Server className="w-3 h-3" />}
              {botEnabled ? 'بوت: مفعّل' : 'بوت 24/7'}
            </Button>

            <Button
              onClick={() => setShowAutoSearch(!showAutoSearch)}
              variant="outline"
              size="sm"
              className="gap-2 bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/35 text-cyan-400/70 hover:text-cyan-400 font-mono text-xs transition-all"
            >
              <Zap className="w-3 h-3" />
              التفاصيل
            </Button>
            <NavLink to="/suggest-coins">
              <Button size="sm" className="gap-2 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/22 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-all">
                <Sparkles className="w-3 h-3" />
                اكتشاف عملات
              </Button>
            </NavLink>
          </div>
        </nav>
        {/* لوحة البحث التلقائي */}
        {showAutoSearch && (
          <div className="mb-6 animate-fade-in">
            <AutoSearchPanel 
              usdtBalance={
                portfolio?.balances.find(b => b.asset.toUpperCase() === 'USDT')
                  ? parseFloat(portfolio.balances.find(b => b.asset.toUpperCase() === 'USDT')?.total || '0')
                  : parseFloat(portfolio?.totalValue || '0')
              }
              onClose={() => setShowAutoSearch(false)}
            />
          </div>
        )}

        {portfolio && (
          <>
            <PortfolioHeader
              totalValue={portfolio.totalValue}
              lastUpdate={portfolio.lastUpdate}
              onRefresh={fetchPortfolio}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
              onTestConnection={testConnection}
              totalDayPnL={portfolio.totalDayPnL}
              dayPnLPercent={portfolio.dayPnLPercent}
            />

            <div className="mb-8">
              <PortfolioAnalysis balances={portfolio.balances} session={session} />
            </div>

            {/* 🔍 فلترة العملات - إخفاء الغبار (أقل من $1) */}
            {(() => {
              const filteredBalances = portfolio.balances.filter(
                balance => parseFloat(balance.usdValue) >= DUST_THRESHOLD
              );
              // 📊 ترتيب العملات تصاعدياً حسب نسبة البيع
              const sortedBalances = sortCoinsByProfitPercent(filteredBalances);
              const dustCount = portfolio.balances.length - filteredBalances.length;
              
              return (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-mono text-xs text-white/30 uppercase tracking-[0.2em] mb-1">ASSETS</h2>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-white/80">{filteredBalances.length}</span>
                        <span className="font-mono text-xs text-white/30">عملة نشطة</span>
                        {dustCount > 0 && (
                          <span className="font-mono text-[10px] text-yellow-400/50 border border-yellow-400/15 px-1.5 py-0.5 rounded">
                            {dustCount} غبار مخفي
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="separator-glow w-40" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {sortedBalances.map((balance, index) => (
                      <div
                        key={balance.asset}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                        <AssetCard
                          asset={balance.asset}
                          total={balance.total}
                          usdValue={balance.usdValue}
                          priceChangePercent={balance.priceChangePercent}
                          currentPrice={balance.currentPrice}
                        />
                      </div>
                    ))}
                  </div>

                  {filteredBalances.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-full border border-white/8 bg-white/3 flex items-center justify-center mx-auto mb-3">
                        <Wallet className="w-5 h-5 text-white/20" />
                      </div>
                      <p className="font-mono text-sm text-white/25">لا توجد أصول في المحفظة</p>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
