import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioHeader } from "@/components/PortfolioHeader";
import { AssetCard } from "@/components/AssetCard";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { AutoSearchPanel } from "@/components/AutoSearchPanel";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Settings as SettingsIcon, CheckCircle, Zap, X, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAutoSearch } from "@/contexts/AutoSearchContext";
import { assignProfitPercentsToExistingCoins } from "@/services/smartTradingService";
import { addBuyRecord, getTradeHistory } from "@/services/tradeHistory";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔄 استخدام البحث التلقائي
  const { isRunning, startAutoSearch, stopAutoSearch } = useAutoSearch();

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

  const fetchPortfolio = async () => {
    
    try {
      setIsLoading(true);
      console.log('Fetching portfolio data...');
      
      // قراءة المفاتيح من localStorage
      const stored = localStorage.getItem('binance_credentials');
      if (!stored) {
        console.log('⚠️ لا توجد مفاتيح API');
        setConnectionStatus('disconnected');
        setPortfolio({ balances: [], totalValue: '0', lastUpdate: new Date().toISOString() });
        setIsLoading(false);
        return;
      }
      
      const credentials = JSON.parse(stored);
      
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
      }
      
      // حفظ عملات المحفظة في localStorage للفلترة التلقائية للمفضلات
      if (data && data.balances && data.balances.length > 0) {
        const portfolioAssets = data.balances.map((b: any) => b.asset.toUpperCase());
        localStorage.setItem('binance_portfolio_assets', JSON.stringify(portfolioAssets));
        console.log('📦 حفظ عملات المحفظة:', portfolioAssets);
        
        // 🎯 تعيين نسب البيع للعملات الموجودة تلقائياً
        const coinsWithValue = data.balances
          .filter((b: any) => b.asset !== 'USDT' && parseFloat(b.usdValue || '0') > 1)
          .map((b: any) => b.asset);
        if (coinsWithValue.length > 0) {
          assignProfitPercentsToExistingCoins(coinsWithValue);
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
      
      const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-crypto-gold mx-auto mb-4" />
          <p className="text-muted-foreground font-orbitron">جاري تحميل المحفظة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center gap-4 animate-fade-in flex-wrap animate-delay-100">
          <div className="flex gap-2">
            <NavLink to="/settings">
              <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105">
                <SettingsIcon className="w-4 h-4" />
                الإعدادات
              </Button>
            </NavLink>
            <NavLink to="/portfolio-rebalance">
              <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50">
                📊 موازنة المحفظة
              </Button>
            </NavLink>
          </div>
          <div className="flex gap-2">
            {/* زر تشغيل/إيقاف البحث التلقائي */}
            <Button 
              onClick={() => {
                if (isRunning) {
                  stopAutoSearch();
                  toast({
                    title: "🔴 تم الإيقاف",
                    description: "تم إيقاف البحث التلقائي",
                  });
                } else {
                  startAutoSearch();
                  toast({
                    title: "🟢 تم التشغيل",
                    description: "البحث التلقائي يعمل الآن!",
                  });
                }
              }}
              variant={isRunning ? "destructive" : "default"}
              className={`gap-2 transition-all duration-300 hover:scale-105 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  إيقاف البحث
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  تشغيل البحث ⚡
                </>
              )}
            </Button>
            {/* زر إظهار/إخفاء لوحة التحكم */}
            <Button 
              onClick={() => setShowAutoSearch(!showAutoSearch)}
              variant="outline"
              className="gap-2 transition-all duration-300 hover:scale-105 border-primary/30 hover:border-primary/50"
            >
              <Zap className="w-4 h-4" />
              {showAutoSearch ? 'إخفاء' : 'التفاصيل'}
            </Button>
            <NavLink to="/suggest-coins">
              <Button className="gap-2 transition-all duration-300 hover:scale-105">
                <Sparkles className="w-4 h-4" />
                استكشاف عملات جديدة
              </Button>
            </NavLink>
          </div>
        </div>
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

            <div className="mb-6">
              <h2 className="text-xl font-orbitron font-semibold mb-4 text-foreground">
                الأصول ({portfolio.balances.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.balances.map((balance, index) => (
                <div 
                  key={balance.asset}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                  }}
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

            {portfolio.balances.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">لا توجد أصول في المحفظة</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
