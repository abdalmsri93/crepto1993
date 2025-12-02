import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2, Clock, XCircle, TrendingUp, TrendingDown, Eye } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { NavLink } from "@/components/NavLink";

interface RecommendationStatus {
  id: string;
  coin_symbol: string;
  recommendation_type: string;
  status: string;
  notes: string | null;
  updated_at: string;
}

interface Balance {
  asset: string;
  usdValue: string;
}

const RecommendationTracking = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationStatus[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
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

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);

      // جلب أرصدة المحفظة الحالية
      const { data: portfolioData } = await supabase.functions.invoke('binance-portfolio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (portfolioData?.balances) {
        setBalances(portfolioData.balances);
      }

      // جلب حالات التوصيات من قاعدة البيانات
      const { data: statusData, error } = await supabase
        .from('recommendation_status')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setRecommendations(statusData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (coinSymbol: string, newStatus: string, notes: string = "") => {
    if (!session) return;

    try {
      // التحقق من وجود السجل
      const { data: existing } = await supabase
        .from('recommendation_status')
        .select('id')
        .eq('coin_symbol', coinSymbol)
        .single();

      if (existing) {
        // تحديث السجل الموجود
        const { error } = await supabase
          .from('recommendation_status')
          .update({ status: newStatus, notes, updated_at: new Date().toISOString() })
          .eq('coin_symbol', coinSymbol)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        // إنشاء سجل جديد
        const { error } = await supabase
          .from('recommendation_status')
          .insert({
            user_id: session.user.id,
            coin_symbol: coinSymbol,
            recommendation_type: 'احتفاظ', // القيمة الافتراضية
            status: newStatus,
            notes
          });

        if (error) throw error;
      }

      await fetchData();

      toast({
        title: "تم التحديث",
        description: `تم تحديث حالة ${coinSymbol} إلى: ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تم التنفيذ':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'قيد التنفيذ':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    if (type.includes('شراء') || type.includes('تعزيز')) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    } else if (type.includes('بيع') || type.includes('تقليص')) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    } else if (type.includes('مراقبة')) {
      return <Eye className="w-5 h-5 text-yellow-500" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-crypto-gold mx-auto mb-4" />
          <p className="text-muted-foreground font-orbitron">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <NavLink to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للمحفظة
            </Button>
          </NavLink>
        </div>

        <Card className="glass-card border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-crypto-gold" />
              تتبع تنفيذ التوصيات
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              تتبع حالة تنفيذ التوصيات الاستثمارية لعملاتك
            </p>
          </CardHeader>
        </Card>

        {balances.length === 0 ? (
          <Card className="glass-card border-primary/20">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد عملات في محفظتك</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {balances.map((balance) => {
              const existingRec = recommendations.find(r => r.coin_symbol === balance.asset);
              
              return (
                <Card key={balance.asset} className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="font-orbitron text-xl">{balance.asset}</span>
                      {existingRec && getStatusIcon(existingRec.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      القيمة: ${parseFloat(balance.usdValue).toFixed(2)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        حالة التنفيذ
                      </label>
                      <Select
                        value={existingRec?.status || 'لم ينفذ'}
                        onValueChange={(value) => updateStatus(balance.asset, value, existingRec?.notes || "")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="لم ينفذ">لم ينفذ</SelectItem>
                          <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                          <SelectItem value="تم التنفيذ">تم التنفيذ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        ملاحظات
                      </label>
                      <Textarea
                        placeholder="أضف ملاحظات..."
                        value={existingRec?.notes || ""}
                        onChange={(e) => {
                          const newNotes = e.target.value;
                          // تأخير التحديث لتجنب كثرة الطلبات
                          const timeoutId = setTimeout(() => {
                            updateStatus(balance.asset, existingRec?.status || 'لم ينفذ', newNotes);
                          }, 1000);
                          return () => clearTimeout(timeoutId);
                        }}
                        className="min-h-[80px]"
                      />
                    </div>

                    {existingRec && (
                      <div className="text-xs text-muted-foreground pt-2 border-t border-primary/10">
                        آخر تحديث: {new Date(existingRec.updated_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationTracking;
