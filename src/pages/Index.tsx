import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioHeader } from "@/components/PortfolioHeader";
import { AssetCard } from "@/components/AssetCard";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Settings as SettingsIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth and set up listener
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        navigate("/auth");
        return;
      }
      
      setSession(currentSession);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPortfolio = async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching portfolio data...');
      
      const { data, error } = await supabase.functions.invoke('binance-portfolio', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching portfolio:', error);
        setConnectionStatus('disconnected');
        throw error;
      }

      console.log('Portfolio data received:', data);
      
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
      
      if (error.message?.includes('not configured')) {
        toast({
          title: "مفاتيح API غير موجودة",
          description: "يرجى إضافة مفاتيح Binance API في صفحة الإعدادات",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في التحديث",
          description: error.message || "فشل في تحميل بيانات المحفظة",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!session) return;
    
    try {
      setConnectionStatus('testing');
      console.log('Testing Binance connection...');
      
      const { data, error } = await supabase.functions.invoke('binance-portfolio', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        setConnectionStatus('disconnected');
        
        if (error.message?.includes('not configured')) {
          toast({
            title: "فشل الاتصال",
            description: "مفاتيح Binance API غير موجودة. يرجى إضافتها في الإعدادات.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "فشل الاتصال",
            description: "تحقق من صحة مفاتيح API في الإعدادات",
            variant: "destructive",
          });
        }
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

  useEffect(() => {
    if (session) {
      fetchPortfolio();
      
      // تحديث تلقائي كل 30 ثانية
      const interval = setInterval(() => {
        fetchPortfolio();
      }, 30000); // 30000 ms = 30 ثانية
      
      return () => clearInterval(interval);
    }
  }, [session]);

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
          <NavLink to="/suggest-coins">
            <Button className="gap-2 transition-all duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4" />
              استكشاف عملات جديدة
            </Button>
          </NavLink>
        </div>
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
