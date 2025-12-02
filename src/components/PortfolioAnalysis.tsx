import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, TrendingUp, Coins, ListChecks, Target } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { CoinEnrichment } from "./CoinEnrichment";

interface Balance {
  asset: string;
  total: string;
  usdValue: string;
  priceChangePercent?: string;
}

interface PortfolioAnalysisProps {
  balances: Balance[];
  session: Session | null;
}

export const PortfolioAnalysis = ({ balances, session }: PortfolioAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isOutOfCredit, setIsOutOfCredit] = useState(false);
  const { toast } = useToast();

  // Split analysis into sections
  const splitAnalysis = (text: string) => {
    const sections = {
      current: "",
      recommendations: "",
      strategy: ""
    };

    if (!text) return sections;

    console.log('Full analysis text:', text);

    // Split by the main section headers
    const currentMatch = text.match(/🔍\s*\*\*تحليل العملات الحالية\*\*([\s\S]*?)(?=📋|$)/);
    // نبحث عن خطين فاصلين متتاليين قبل عنوان استراتيجية التنويع
    const recommendationsMatch = text.match(/📋\s*\*\*التوصيات والقرارات\*\*([\s\S]*?)(?=────────────────────────────────\s*────────────────────────────────\s*💡\s*\*\*استراتيجية التنويع المقترحة|════════════════════════════════════|$)/);
    const strategyMatch = text.match(/💡\s*\*\*استراتيجية التنويع المقترحة\*\*([\s\S]*?)(?=$)/);

    sections.current = currentMatch ? currentMatch[1].trim() : "";
    sections.recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : "";
    sections.strategy = strategyMatch ? strategyMatch[1].trim() : "";

    console.log('Extracted current section:', sections.current);
    console.log('Extracted recommendations section:', sections.recommendations);
    console.log('Extracted strategy section:', sections.strategy);

    return sections;
  };

  // Parse individual coins from the current analysis
  const parseCoins = (text: string) => {
    if (!text) return [];
    
    console.log('Parsing coins from text:', text);

    // نبحث عن عناوين العملات على شكل:
    // 🪙 **SUI (SUI)** أو **SUI (SUI)** أو 1. **SUI (SUI)** أو • **SUI (SUI)**
    const headingRegexGlobal = /(?:^|\n)\s*(?:[-•]|\d+\.)?\s*(?:🪙)?\s*\*\*([^*]+)\*\*/g;
    const headingRegexSingle = /(?:^|\n)?\s*(?:[-•]|\d+\.)?\s*(?:🪙)?\s*\*\*([^*]+)\*\*/;

    const matches: { name: string; start: number; end: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = headingRegexGlobal.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (!name) continue;
      matches.push({ name, start: match.index, end: text.length });
    }

    // تحديد نهاية كل بلوك عملة بناءً على بداية البلوك التالي
    for (let i = 0; i < matches.length; i++) {
      if (i < matches.length - 1) {
        matches[i].end = matches[i + 1].start;
      }
    }

    const coins = matches.map(({ name, start, end }) => {
      const block = text.slice(start, end);
      const content = block.replace(headingRegexSingle, '').trim();
      return { name, content };
    }).filter(coin => coin.name.length > 0);

    console.log('Parsed coins from headings:', coins);
    return coins;
  };

  // Parse individual recommendations from the recommendations section
  const parseRecommendations = (text: string) => {
    if (!text) return [];
    
    // نبحث فقط عن التوصيات الرئيسية التي تبدأ بـ ⚖️ متبوعة بـ **توصية [عملة]:**
    // هذا يمنع التقسيم على العناوين الفرعية مثل 📊 أو 💡 أو 🎯 أو ⚠️
    const recommendationRegex = /⚖️\s*\*\*توصية\s+([^:]+):\s*([^*]+)\*\*/g;
    const recommendations: { name: string; content: string }[] = [];
    const matches: { name: string; start: number; end: number }[] = [];
    
    let match: RegExpExecArray | null;
    while ((match = recommendationRegex.exec(text)) !== null) {
      const coinName = match[1]?.trim();
      const action = match[2]?.trim();
      if (!coinName || !action) continue;
      const name = `توصية ${coinName}: ${action}`;
      matches.push({ name, start: match.index, end: text.length });
    }
    
    // تحديد نهاية كل توصية بناءً على بداية التوصية التالية
    for (let i = 0; i < matches.length; i++) {
      if (i < matches.length - 1) {
        matches[i].end = matches[i + 1].start;
      }
    }
    
    // استخراج المحتوى الكامل لكل توصية
    return matches.map(({ name, start, end }) => {
      const block = text.slice(start, end);
      // نحذف السطر الأول (عنوان التوصية) ونبقي باقي المحتوى
      const content = block.replace(/⚖️\s*\*\*توصية[^*]+\*\*/, '').trim();
      return { name, content };
    }).filter(rec => rec.name.length > 0);
  };

  const sections = analysis ? splitAnalysis(analysis) : { current: "", recommendations: "", strategy: "" };
  const coins = sections.current ? parseCoins(sections.current) : [];
  const recommendations = sections.recommendations ? parseRecommendations(sections.recommendations) : [];

  const binanceStats = React.useMemo(() => {
    if (!balances || balances.length === 0) return [] as {
      asset: string;
      usdValue: number;
      allocation: number;
      priceChangePercent: number | null;
    }[];

    const total = balances.reduce((sum, b) => {
      const raw = (b as any).usdValue ?? (b as any).usd_value ?? 0;
      const num = typeof raw === "string" ? parseFloat(raw) : Number(raw) || 0;
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    return balances.map((b) => {
      const rawValue = (b as any).usdValue ?? (b as any).usd_value ?? 0;
      const usd = typeof rawValue === "string" ? parseFloat(rawValue) : Number(rawValue) || 0;
      const rawChange = (b as any).priceChangePercent ?? (b as any).price_change_percent ?? null;
      const change =
        rawChange === null || rawChange === undefined
          ? null
          : parseFloat(String(rawChange));

      const safeUsd = isNaN(usd) ? 0 : usd;
      const allocation = total > 0 && safeUsd > 0 ? (safeUsd / total) * 100 : 0;

      return {
        asset: b.asset,
        usdValue: safeUsd,
        allocation,
        priceChangePercent: change === null || isNaN(change) ? null : change,
      };
    });
  }, [balances]);

  console.log('Analysis sections lengths:', {
    current: sections.current.length,
    recommendations: sections.recommendations.length,
    strategy: sections.strategy.length,
    coins: coins.length,
    recs: recommendations.length,
  });

  const analyzePortfolio = React.useCallback(async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      console.log('Requesting portfolio analysis...');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ balances })
      });

      const data = await response.json();

      // Check for 402 error (payment required)
      if (response.status === 402) {
        console.error('Payment required error:', data);
        setIsOutOfCredit(true);
        toast({
          title: "نفد رصيد التحليل الذكي",
          description: "يرجى إضافة رصيد في إعدادات Workspace للمتابعة في استخدام ميزة التحليل الذكي",
          variant: "destructive",
          duration: 8000,
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        console.error('Error analyzing portfolio:', data);
        throw new Error(data.error || 'فشل في تحليل المحفظة');
      }

      console.log('Analysis received:', data);
      setAnalysis(data.analysis);
      setAnalysisCount(prev => prev + 1);

      toast({
        title: "تم التحليل بنجاح",
        description: "تم إنشاء تحليل ذكي لمحفظتك",
      });
    } catch (error: any) {
      console.error('Failed to analyze portfolio:', error);
      toast({
        title: "خطأ في التحليل",
        description: error.message || "فشل في تحليل المحفظة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [balances, session, toast]);

  // Auto-analyze on mount when balances are available
  React.useEffect(() => {
    if (balances.length > 0 && !analysis) {
      analyzePortfolio();
    }
  }, [balances, analysis, analyzePortfolio]);

  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 transition-all duration-300 hover:scale-110 hover:bg-primary/20">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-orbitron font-semibold text-foreground">
              التحليل الذكي
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "جاري التحليل..." : "تحليل شامل بالمعايير الشرعية والفنية"}
            </p>
          </div>
        </div>
        <Button
          onClick={analyzePortfolio}
          disabled={isLoading || balances.length === 0 || isOutOfCredit}
          className="bg-gradient-crypto hover:opacity-90 transition-all duration-300 hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 ml-2" />
              إعادة التحليل
            </>
          )}
        </Button>
      </div>


      {isLoading && !analysis && (
        <Card className="glass-card border-primary/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-crypto-gold" />
              <p className="text-muted-foreground text-center">
                جاري تحليل محفظتك باستخدام الذكاء الاصطناعي...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-crypto-gold" />
              نتائج التحليل الذكي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  تحليل العملات
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  التوصيات
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  استراتيجية التنويع
                </TabsTrigger>
                <TabsTrigger value="binance" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  بيانات Binance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                {coins.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {coins.map((coin, index) => {
                      // استخراج رمز العملة من الاسم (مثل "SUI (SUI)" -> "SUI")
                      const symbolMatch = coin.name.match(/\(([A-Z]+)\)/);
                      const symbol = symbolMatch ? symbolMatch[1] : coin.name.split(' ')[0];
                      
                      return (
                        <AccordionItem 
                          key={index} 
                          value={`coin-${index}`}
                          className="border border-primary/20 rounded-lg bg-background/30 px-4 transition-all duration-300 hover:border-primary/40 hover:bg-background/40"
                        >
                          <AccordionTrigger className="text-right hover:text-primary hover:no-underline py-4 transition-all duration-300">
                            <span className="text-lg font-semibold transition-all duration-300">{coin.name}</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground pt-2" style={{ direction: 'rtl' }}>
                                {coin.content}
                              </div>
                              
                              {/* إذا كان التحليل تلقائي، أظهر زر التحليل المحسّن */}
                              {coin.content.includes('🤖') && (
                                <div className="mt-4 pt-4 border-t border-primary/10">
                                  <CoinEnrichment symbol={symbol} />
                                </div>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 transition-all duration-300 hover:scale-105"
                                onClick={() => {
                                  // العملات المستقرة (stablecoins) لا يمكن تداولها مقابل USDT
                                  const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD'];
                                  const isStablecoin = stablecoins.includes(symbol);
                                  
                                  // للعملات المستقرة، نفتح صفحة المعلومات بدلاً من صفحة التداول
                                  const url = isStablecoin 
                                    ? `https://www.binance.com/ar/price/${symbol.toLowerCase()}`
                                    : `https://www.binance.com/ar/trade/${symbol}_USDT`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <span>عرض {symbol} في Binance</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-cairo" style={{ direction: 'rtl' }}>
                    {sections.current || "لا توجد بيانات متاحة"}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {recommendations.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {recommendations.map((rec, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`rec-${index}`}
                        className="border border-primary/20 rounded-lg bg-background/30 px-4 transition-all duration-300 hover:border-primary/40 hover:bg-background/40"
                      >
                        <AccordionTrigger className="text-right hover:text-primary hover:no-underline py-4 transition-all duration-300">
                          <span className="text-lg font-semibold transition-all duration-300">{rec.name}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground pt-2 pb-4" style={{ direction: 'rtl' }}>
                            {rec.content}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-cairo" style={{ direction: 'rtl' }}>
                    {sections.recommendations || "لا توجد توصيات متاحة"}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="strategy" className="space-y-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-cairo" style={{ direction: 'rtl' }}>
                  {sections.strategy || "لا توجد استراتيجية متاحة"}
                </div>
              </TabsContent>

              <TabsContent value="binance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {binanceStats.map((stat) => {
                    const isPositive = (stat.priceChangePercent ?? 0) >= 0;
                    return (
                      <Card key={stat.asset} className="border-primary/20 bg-background/40">
                        <CardContent className="p-4 space-y-2" dir="rtl">
                          <div className="flex items-center justify-between">
                            <span className="font-orbitron font-semibold text-lg">{stat.asset}</span>
                            {stat.priceChangePercent !== null && (
                              <span className={`text-sm font-orbitron ${isPositive ? 'text-crypto-green' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{stat.priceChangePercent.toFixed(2)}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>قيمة المركز التقريبية</span>
                            <span className="font-orbitron text-foreground font-semibold">
                              ${stat.usdValue.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>نسبة من إجمالي المحفظة</span>
                            <span className="font-orbitron text-foreground font-semibold">
                              {stat.allocation.toFixed(2)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};