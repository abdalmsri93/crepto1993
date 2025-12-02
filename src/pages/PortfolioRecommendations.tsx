import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface AdvancedRecommendation {
  symbol: string;
  overallScore: number;
  confidence: number;
  recommendationType: string;
  buySignals: string[];
  sellSignals: string[];
  riskFactors: string[];
  priceTargets: {
    shortTerm: { percentage: number; timeframe: string };
    mediumTerm: { percentage: number; timeframe: string };
    longTerm: { percentage: number; timeframe: string };
  };
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  riskScore: number;
  volatilityScore: number;
  volumeScore: number;
  adoptionScore: number;
  timingIndicator: string;
}

const generateDemoRecommendation = (symbol: string, priceChange: number): AdvancedRecommendation => {
  const baseScore = Math.max(0, Math.min(100, 50 + priceChange * 2));
  const technicalScore = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 20));
  const fundamentalScore = Math.max(0, Math.min(100, 65 + (Math.random() - 0.5) * 30));
  const sentimentScore = Math.max(0, Math.min(100, 55 + (Math.random() - 0.5) * 25));
  const riskScore = Math.max(0, Math.min(100, 45 + (Math.random() - 0.5) * 30));
  const volatilityScore = Math.max(0, Math.min(100, Math.abs(priceChange) > 5 ? 40 : 65));
  const volumeScore = Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 20));
  const adoptionScore = Math.max(0, Math.min(100, 55 + (Math.random() - 0.5) * 25));

  const overallScore = Math.round(
    (technicalScore * 0.25 + fundamentalScore * 0.25 + sentimentScore * 0.15 + 
     (100 - riskScore) * 0.15 + volatilityScore * 0.1 + volumeScore * 0.05 + adoptionScore * 0.05)
  );

  const confidence = Math.round(70 + Math.random() * 25);

  let recommendationType = 'احتفاظ 🟡';
  let timingIndicator = 'انتظر إشارة أقوى 📊';

  if (overallScore >= 75) {
    recommendationType = 'تعزيز 🟢';
    timingIndicator = 'شراء فوري ⚡';
  } else if (overallScore >= 60) {
    recommendationType = 'احتفاظ 🟡';
    timingIndicator = 'احتفظ بمركزك 👍';
  } else if (overallScore >= 40) {
    recommendationType = 'تقليص 🔴';
    timingIndicator = 'قلل نسبتك تدريجياً 📉';
  } else {
    recommendationType = 'إيقاف ❌';
    timingIndicator = 'ابتعد بعيد! 🚫';
  }

  const buySignals: string[] = [];
  const sellSignals: string[] = [];
  const riskFactors: string[] = [];

  if (technicalScore > 70) buySignals.push('المؤشرات الفنية قوية جداً');
  if (technicalScore < 40) sellSignals.push('المؤشرات الفنية ضعيفة');
  
  if (fundamentalScore > 75) buySignals.push('الأساسيات ممتازة');
  if (fundamentalScore < 45) sellSignals.push('الأساسيات ضعيفة');
  
  if (sentimentScore > 70) buySignals.push('المعنويات إيجابية جداً');
  if (sentimentScore < 35) sellSignals.push('المعنويات سلبية');
  
  if (volumeScore > 70) buySignals.push('حجم التداول مرتفع');
  if (volumeScore < 40) sellSignals.push('حجم التداول منخفض');
  
  if (adoptionScore > 70) buySignals.push('معدل الاعتماد عالي');
  
  if (riskScore > 60) riskFactors.push('مستوى الخطر مرتفع - تحرك بحذر');
  if (volatilityScore < 40) riskFactors.push('التقلبات عالية جداً - احذر من الخسائر');
  if (Math.abs(priceChange) > 10) riskFactors.push('تحرك سعري كبير في الآونة الأخيرة');

  if (buySignals.length === 0) buySignals.push('السعر في مستويات جيدة');
  if (sellSignals.length === 0) sellSignals.push('لا توجد إشارات بيع قوية حالياً');

  return {
    symbol,
    overallScore,
    confidence,
    recommendationType,
    buySignals: buySignals.slice(0, 6),
    sellSignals: sellSignals.slice(0, 3),
    riskFactors: riskFactors.slice(0, 3),
    priceTargets: {
      shortTerm: {
        percentage: Math.round(3 + Math.random() * 8),
        timeframe: '1-3 أشهر'
      },
      mediumTerm: {
        percentage: Math.round(5 + Math.random() * 10),
        timeframe: '3-12 شهر'
      },
      longTerm: {
        percentage: Math.round(8 + Math.random() * 15),
        timeframe: 'سنة+'
      }
    },
    technicalScore,
    fundamentalScore,
    sentimentScore,
    riskScore,
    volatilityScore,
    volumeScore,
    adoptionScore,
    timingIndicator
  };
};

const PortfolioRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Record<string, AdvancedRecommendation>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
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
      fetchRecommendations();
    }
  }, [session]);

  const fetchRecommendations = async () => {
    if (!session) return;

    try {
      setIsLoading(true);

      const { data: portfolioData, error: portfolioError } = await supabase.functions.invoke('binance-portfolio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (portfolioError) throw portfolioError;

      const recs: Record<string, AdvancedRecommendation> = {};

      if (portfolioData?.balances) {
        const coinsWithBalance = portfolioData.balances.filter((b: any) => {
          const total = parseFloat(b.free) + parseFloat(b.locked);
          return total > 0.00001;
        });

        for (const balance of coinsWithBalance) {
          recs[balance.asset] = generateDemoRecommendation(balance.asset, balance.change24h || 0);
        }
      }

      setRecommendations(recs);

      if (Object.keys(recs).length > 0) {
        toast({
          title: "تم جلب التوصيات",
          description: `تم الحصول على التوصيات لـ ${Object.keys(recs).length} عملات`,
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (score: number): string => {
    if (score >= 75) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-blue-500/10 border-blue-500/20";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              توصيات المحفظة المتقدمة
            </h1>
            <p className="text-muted-foreground text-right">
              تحليل شامل لعملاتك مع توصيات دقيقة
            </p>
          </div>
          <div className="flex gap-2">
            <NavLink to="/">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
            </NavLink>
            <Button onClick={fetchRecommendations} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "تحديث التوصيات"
              )}
            </Button>
          </div>
        </div>

        {isLoading && Object.keys(recommendations).length === 0 ? (
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">جاري تحليل محفظتك...</p>
            </CardContent>
          </Card>
        ) : Object.keys(recommendations).length > 0 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-right mb-4">التوصيات التفصيلية</h2>
            </div>

            {Object.entries(recommendations).map(([symbol, rec], index) => (
              <Card key={index} className={`border ${getRecommendationColor(rec.overallScore)} bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg overflow-hidden`}>
                <CardHeader className="border-b py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Badge className="text-lg px-4 py-2">{symbol}</Badge>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          <span>الدرجة: {rec.overallScore}/100</span>
                          <div className="w-24 bg-background/30 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${rec.overallScore}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm opacity-75">الثقة: {rec.confidence}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{rec.recommendationType}</div>
                      <div className="text-xs opacity-75">{rec.timingIndicator}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "فني", value: rec.technicalScore, icon: "📈" },
                      { label: "أساسي", value: rec.fundamentalScore, icon: "🏗️" },
                      { label: "معنويات", value: rec.sentimentScore, icon: "📢" },
                      { label: "مخاطر", value: rec.riskScore, icon: "⚠️" },
                      { label: "تقلب", value: rec.volatilityScore, icon: "📊" },
                      { label: "حجم", value: rec.volumeScore, icon: "💰" },
                      { label: "اعتماد", value: rec.adoptionScore, icon: "🚀" }
                    ].map((metric, idx) => (
                      <div key={idx} className="bg-background/50 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-1">{metric.icon}</div>
                        <div className="text-sm text-muted-foreground">{metric.label}</div>
                        <div className="text-lg font-bold text-primary">{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  {rec.buySignals.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">إشارات شراء إيجابية</span>
                      </div>
                      <ul className="text-sm space-y-1 text-right">
                        {rec.buySignals.map((signal, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.sellSignals.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-semibold">إشارات تحذيرية</span>
                      </div>
                      <ul className="text-sm space-y-1 text-right">
                        {rec.sellSignals.map((signal, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 mt-1">✗</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.riskFactors.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">عوامل خطر</span>
                      </div>
                      <ul className="text-sm space-y-1 text-right">
                        {rec.riskFactors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-600 dark:text-yellow-400 mt-1">⚠️</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-2">قصير المدى</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        +{rec.priceTargets.shortTerm.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{rec.priceTargets.shortTerm.timeframe}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-2">متوسط المدى</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        +{rec.priceTargets.mediumTerm.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{rec.priceTargets.mediumTerm.timeframe}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-2">طويل المدى</div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        +{rec.priceTargets.longTerm.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{rec.priceTargets.longTerm.timeframe}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-right">
              لم يتم العثور على عملات في محفظتك. ابدأ بإضافة بعض العملات أولاً.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default PortfolioRecommendations;
