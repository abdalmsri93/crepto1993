import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Loader2, BarChart3, Settings as SettingsIcon, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // تحميل المحفظة مباشرة بدون Auth
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [Dashboard] بدء تحميل المحفظة...');
      
      // قراءة المفاتيح من localStorage
      const stored = localStorage.getItem('binance_credentials');
      console.log('🔍 [Dashboard] المفاتيح في localStorage:', stored ? 'موجودة ✅' : 'غير موجودة ❌');
      
      if (!stored) {
        console.log('⚠️ [Dashboard] لا توجد مفاتيح محفوظة');
        toast({
          title: "⚠️ لا توجد مفاتيح API",
          description: "اذهب إلى الإعدادات لإدخال مفاتيح Binance",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const credentials = JSON.parse(stored);
      console.log('✅ [Dashboard] تم قراءة المفاتيح بنجاح');

      // استدعاء Supabase Function لجلب البيانات الحقيقية
      console.log('📤 [Dashboard] استدعاء Binance API...');
      const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/binance-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey
        })
      });
      
      console.log('📥 [Dashboard] استجابة API:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Dashboard] خطأ في الاستجابة:', errorData);
        throw new Error(errorData.error || `خطأ ${response.status}`);
      }

      const portfolioData = await response.json();
      console.log('📊 [Dashboard] البيانات المستلمة:', portfolioData);
      
      if (portfolioData.error) {
        throw new Error(portfolioData.error);
      }

      // تنسيق البيانات
      let balances: Balance[] = portfolioData.balances.map((coin: any) => ({
        asset: coin.asset,
        free: coin.free,
        locked: coin.locked || '0',
        total: coin.free,
        usdValue: coin.usdValue || '0',
        priceChangePercent: '0',
        currentPrice: '0',
        dayPnL: '0',
      }));

      console.log('💰 [Dashboard] عدد العملات:', balances.length);

      // حساب الإجماليات
      const totalValue = parseFloat(portfolioData.totalValue || '0');
      const totalDayPnL = 0;
      const dayPnLPercent = '0';

      const finalPortfolioData: PortfolioData = {
        balances,
        totalValue: totalValue.toFixed(2),
        totalDayPnL: totalDayPnL.toFixed(2),
        dayPnLPercent,
        lastUpdate: new Date().toISOString(),
      };

      console.log('✅ [Dashboard] تم تعيين البيانات بنجاح');
      setPortfolio(finalPortfolioData);
      
      toast({
        title: "✅ تم التحديث",
        description: `تم جلب ${balances.length} عملة بنجاح`,
      });
    } catch (error: any) {
      console.error('❌ [Dashboard] خطأ في جلب المحفظة:', error);
      
      toast({
        title: "❌ خطأ في جلب البيانات",
        description: error.message || 'تعذر الاتصال بـ Binance',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 [Dashboard] انتهى تحميل المحفظة');
    }
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/70">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة إذا لم تكن هناك مفاتيح
  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">⚠️ لا توجد مفاتيح API</h2>
          <p className="text-muted-foreground mb-6">يرجى إضافة مفاتيح Binance API من الإعدادات</p>
          <NavLink to="/settings">
            <Button className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              اذهب للإعدادات
            </Button>
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* رأس الصفحة */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in animate-delay-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-crypto-gold to-crypto-green rounded-lg">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-transparent bg-gradient-to-r from-crypto-gold to-crypto-green bg-clip-text">
                لوحة التحكم
              </h1>
              <p className="text-sm text-muted-foreground">ملخص شامل لأداء محفظتك</p>
            </div>
          </div>

          <div className="flex gap-2">
            <NavLink to="/settings">
              <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105">
                <SettingsIcon className="w-4 h-4" />
                الإعدادات
              </Button>
            </NavLink>
            <NavLink to="/">
              <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105">
                <Home className="w-4 h-4" />
                الرئيسية
              </Button>
            </NavLink>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <DashboardStats
          totalValue={portfolio.totalValue}
          totalDayPnL={portfolio.totalDayPnL}
          dayPnLPercent={portfolio.dayPnLPercent}
          assetsCount={portfolio.balances.length}
          lastUpdate={portfolio.lastUpdate}
        />

        {/* الرسوم البيانية */}
        <DashboardCharts balances={portfolio.balances} />

        {/* جدول تفصيلي للعملات */}
        <div className="glass-card rounded-2xl p-6 border-2 border-primary/20 animate-fade-in animate-delay-300">
          <h2 className="text-xl font-orbitron font-semibold mb-6 text-foreground">
            تفاصيل الأصول
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">العملة</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">الكمية</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">القيمة (USD)</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">التغيير 24h</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.balances.map((balance, index) => {
                  const isPositive = parseFloat(balance.priceChangePercent || "0") >= 0;
                  const percentage = (parseFloat(balance.usdValue) / parseFloat(portfolio.totalValue) * 100).toFixed(2);
                  return (
                    <tr 
                      key={balance.asset}
                      className={`border-b border-primary/10 hover:bg-primary/5 transition-colors ${
                        index % 2 === 0 ? 'bg-background/50' : 'bg-background/30'
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-foreground">{balance.asset}</td>
                      <td className="py-3 px-4 text-muted-foreground">{parseFloat(balance.total).toFixed(8)}</td>
                      <td className="py-3 px-4 text-crypto-gold font-semibold">
                        ${parseFloat(balance.usdValue).toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${
                        isPositive ? 'text-crypto-green' : 'text-crypto-red'
                      }`}>
                        {isPositive ? '+' : ''}{parseFloat(balance.priceChangePercent || "0").toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
