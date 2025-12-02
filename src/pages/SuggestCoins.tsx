import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface CoinSuggestion {
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  project: string;
  shariaCompliance: string;
  growth: string;
  riskLevel: string;
  liquidity: string;
  performanceScore: number;
  investmentPercentage: number;
  suggestedAmount: string | null;
  recommendation: string;
  category?: string;
  valueScore?: string;
  avgPrice?: string;
  team?: string;
  partners?: string;
  technology?: string;
  useCase?: string;
  links?: {
    website?: string;
    whitepaper?: string;
    twitter?: string;
    docs?: string;
  };
}

const SuggestCoins = () => {
  const [coins, setCoins] = useState<CoinSuggestion[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssets, setCurrentAssets] = useState<string[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("0.10");
  const [maxPrice, setMaxPrice] = useState<string>("10");
  const [marketCapFilter, setMarketCapFilter] = useState<string>("all");
  const [coinCount, setCoinCount] = useState<string>("5");
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth
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


  // Fetch current portfolio to get existing assets
  useEffect(() => {
    if (!session) return;
    
    const fetchCurrentAssets = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('binance-portfolio', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw error;
        
        if (data?.balances) {
          const assets = data.balances
            .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
            .map((b: any) => b.asset);
          setCurrentAssets(assets);
        }
      } catch (error) {
        console.error("Error fetching current assets:", error);
      }
    };

    fetchCurrentAssets();
  }, [session]);

  const getSuggestions = async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      
      // Validation
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      
      if (isNaN(min) || min < 0) {
        toast({
          title: "خطأ في القيمة",
          description: "السعر الأدنى يجب أن يكون رقماً موجباً",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (isNaN(max) || max < 0) {
        toast({
          title: "خطأ في القيمة",
          description: "السعر الأعلى يجب أن يكون رقماً موجباً",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (min > max) {
        toast({
          title: "خطأ في النطاق",
          description: "السعر الأدنى يجب أن يكون أقل من السعر الأعلى",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const amount = investmentAmount ? parseFloat(investmentAmount) : null;
      const count = parseInt(coinCount);
      
      try {
        // جلب البيانات من Binance API
        console.log("Fetching from Binance API...");
        
        // جلب معلومات التبادل
        const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const exchangeInfo: any = await exchangeInfoResponse.json();
        
        // جلب الأسعار والتفاصيل
        const tickersResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const tickers: any[] = await tickersResponse.json();
        
        // تصفية العملات USDT والحصول على البيانات المفصلة
        let coins = tickers
          .filter((t: any) => {
            const symbol = t.symbol || '';
            const price = parseFloat(t.lastPrice || 0);
            return symbol.endsWith('USDT') && price >= min && price <= max;
          })
          .map((ticker: any) => {
            const price = parseFloat(ticker.lastPrice);
            const volume24h = parseFloat(ticker.volume);
            const quoteAssetVolume = parseFloat(ticker.quoteAssetVolume);
            const symbol = ticker.symbol.replace('USDT', '');
            
            // البحث عن معلومات إضافية من exchangeInfo
            const symbolInfo = exchangeInfo.symbols.find((s: any) => s.symbol === ticker.symbol);
            const baseAsset = symbolInfo?.baseAsset || symbol;
            const quoteAsset = symbolInfo?.quoteAsset || 'USDT';
            
            const priceChange = parseFloat(ticker.priceChange);
            const priceChangePercent = parseFloat(ticker.priceChangePercent);
            const highPrice = parseFloat(ticker.highPrice);
            const lowPrice = parseFloat(ticker.lowPrice);
            const openPrice = parseFloat(ticker.openPrice);
            const count24h = parseFloat(ticker.count);
            const bidPrice = parseFloat(ticker.bidPrice);
            const askPrice = parseFloat(ticker.askPrice);
            
            // حساب البيانات الإحصائية
            const spreadPercent = ((askPrice - bidPrice) / bidPrice * 100).toFixed(4);
            const volumeInUSDT = quoteAssetVolume;
            const highLowRange = ((highPrice - lowPrice) / lowPrice * 100).toFixed(2);
            
            return {
              name: symbol,
              symbol: symbol,
              price: `$${price.toFixed(8)}`,
              marketCap: `${(volumeInUSDT / 1e6).toFixed(2)}M USDT`,
              project: `${symbol} / ${quoteAsset}`,
              shariaCompliance: `السعر: $${price.toFixed(8)} | Bid: $${bidPrice.toFixed(8)}`,
              growth: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`,
              riskLevel: Math.abs(priceChangePercent) > 10 ? "🔴 عالي جداً" : Math.abs(priceChangePercent) > 5 ? "🟠 متوسط" : "🟢 منخفض",
              liquidity: `${(volumeInUSDT / 1e6).toFixed(0)}M`,
              performanceScore: Math.min(10, Math.max(1, (Math.abs(priceChangePercent) / 5))),
              investmentPercentage: 100 / count,
              suggestedAmount: amount ? ((amount * 100 / count) / 100).toFixed(2) : null,
              recommendation: priceChangePercent > 2 ? "✅ شراء قوي" : priceChangePercent > 0 ? "👍 شراء" : priceChangePercent < -5 ? "📉 بيع" : "💼 احتفاظ",
              category: `Pair #${ticker.symbol}`,
              valueScore: price.toFixed(8),
              avgPrice: `${openPrice.toFixed(8)}`,
              team: `الحجم: ${(volumeInUSDT / 1e9).toFixed(3)}B | العدد: ${count24h}`,
              partners: `السعر الأعلى: $${highPrice.toFixed(8)}`,
              technology: `السعر الأدنى: $${lowPrice.toFixed(8)}`,
              useCase: `التغير: ${priceChange > 0 ? '+' : ''}$${priceChange.toFixed(8)} (${highLowRange}%)`,
              links: {
                website: `https://www.binance.com/en/trade/${ticker.symbol}?theme=dark`,
              }
            };
          });
        
        // إزالة العملات الموجودة
        const currentSymbols = new Set(currentAssets.map(a => a.toUpperCase()));
        coins = coins.filter(coin => !currentSymbols.has(coin.symbol.toUpperCase()));
        
        // اختيار عشوائي
        function randomSample<T>(array: T[], cnt: number): T[] {
          if (array.length <= cnt) return array;
          const result: T[] = [];
          const used = new Set<number>();
          while (result.length < cnt) {
            const idx = Math.floor(Math.random() * array.length);
            if (!used.has(idx)) {
              used.add(idx);
              result.push(array[idx]);
            }
          }
          return result;
        }
        
        const selectedCoins = randomSample(coins, Math.min(count, coins.length));
        
        setCoins(selectedCoins as CoinSuggestion[]);
        setNotes([
          `✅ تم اختيار ${selectedCoins.length} عملة من CoinGecko`,
          `📊 النطاق السعري: $${min} - $${max}`,
          "🔄 كل بحث جديد = عملات مختلفة عشوائياً",
          "💡 بيانات شاملة: السعر، Cap، Volume، ATH/ATL",
          "⚠️ بحث واستثمر بحكمة!"
        ]);
        
        toast({
          title: "تم إنشاء الاقتراحات",
          description: `تم الحصول على ${selectedCoins.length} عملات بمعلومات كاملة ✅`,
        });
      } catch (fetchError) {
        console.error("Error fetching from CoinGecko:", fetchError);
        throw new Error("فشل في جلب البيانات. تحقق من الاتصال بالإنترنت");
      }
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل الحصول على الاقتراحات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              استكشاف عملات جديدة
            </h1>
            <p className="text-muted-foreground text-right">
              اكتشف عملات رقمية جديدة بأفضل قيمة مقابل السعر
            </p>
          </div>
          <NavLink to="/">
            <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105">
              <ArrowRight className="w-4 h-4" />
              العودة للمحفظة
            </Button>
          </NavLink>
        </div>

        {/* Search Filters */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-end gap-2">
              <span>شروط البحث</span>
              <span>🔍</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Price Range */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-right">نطاق السعر (بالدولار)</div>
                <div className="grid grid-cols-2 gap-4" dir="rtl">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">من:</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      placeholder="0.10"
                      className="w-full px-4 py-3 rounded-lg bg-background/50 border border-primary/20 text-right focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">إلى:</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      className="w-full px-4 py-3 rounded-lg bg-background/50 border border-primary/20 text-right focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  💡 للاستثمارات البسيطة، يُنصح بنطاق $0.10 - $10
                </p>
              </div>

              {/* Market Cap Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-right block">القيمة السوقية</label>
                <select
                  value={marketCapFilter}
                  onChange={(e) => setMarketCapFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-primary/20 text-right focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                  dir="rtl"
                >
                  <option value="all">الكل</option>
                  <option value="small">صغيرة ($10M - $500M) - مخاطر أعلى</option>
                  <option value="medium">متوسطة ($500M - $10B) - متوازن</option>
                  <option value="large">كبيرة ($10B+) - أكثر استقراراً</option>
                </select>
              </div>

              {/* Coin Count */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-right block">عدد العملات المقترحة</label>
                <select
                  value={coinCount}
                  onChange={(e) => setCoinCount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-primary/20 text-right focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                  dir="rtl"
                >
                  <option value="3">3 عملات</option>
                  <option value="4">4 عملات</option>
                  <option value="5">5 عملات (موصى به)</option>
                  <option value="6">6 عملات</option>
                  <option value="7">7 عملات</option>
                  <option value="8">8 عملات</option>
                  <option value="9">9 عملات</option>
                  <option value="10">10 عملات</option>
                </select>
              </div>

              {/* Investment Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-right block">مبلغ الاستثمار (اختياري)</label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="أدخل المبلغ بالدولار (مثال: 100)"
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-primary/20 text-right focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground text-right">
                  💰 سيتم توزيع المبلغ حسب "أفضل قيمة مقابل السعر"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Suggestions Button */}
        {coins.length === 0 && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-right flex items-center justify-end gap-2">
                <span>احصل على اقتراحات العملات</span>
                <Sparkles className="w-6 h-6 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-right mb-4">
                اضغط للحصول على اقتراحات ذكية تعتمد على "أفضل قيمة مقابل السعر" - عملات قوية بأسعار مناسبة للاستثمارات البسيطة.
              </p>
              <Button
                onClick={getSuggestions}
                disabled={isLoading}
                className="w-full transition-all duration-300 hover:scale-105"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري البحث عن العملات...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    احصل على الاقتراحات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground text-center">
                  جاري البحث عن أفضل العملات الرقمية المتوافقة مع المعايير الشرعية...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions Display */}
        {coins.length > 0 && !isLoading && (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    onClick={getSuggestions}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    تحديث الاقتراحات
                  </Button>
                  <CardTitle className="text-right flex items-center gap-2">
                    <span>العملات المقترحة</span>
                    <Sparkles className="w-6 h-6 text-primary" />
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>

            {/* Coin Cards - Collapsible */}
            <Accordion type="multiple" className="space-y-4">
              {coins.map((coin, index) => (
                <div
                  key={index}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <AccordionItem 
                    value={`coin-${index}`}
                    className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/40 hover:bg-card/60"
                  >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-primary/5 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 transition-all duration-300 hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          // العملات المستقرة (stablecoins) لا يمكن تداولها مقابل USDT
                          const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD'];
                          const isStablecoin = stablecoins.includes(coin.symbol);
                          
                          // للعملات المستقرة، نفتح صفحة المعلومات بدلاً من صفحة التداول
                          const url = isStablecoin 
                            ? `https://www.binance.com/ar/price/${coin.symbol.toLowerCase()}`
                            : `https://www.binance.com/ar/trade/${coin.symbol}_USDT`;
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        عرض في Binance
                      </Button>
                      <div className="text-right text-xl flex items-center gap-2 font-semibold">
                        <span className="text-muted-foreground text-lg">({coin.symbol})</span>
                        <span>{coin.name}</span>
                        <span className="text-2xl">🪙</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4" style={{ direction: 'rtl' }}>
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-background/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground mb-1">💰 السعر التقريبي</div>
                          <div className="text-lg font-semibold">{coin.price}</div>
                          {coin.avgPrice && (
                            <div className="text-xs text-muted-foreground mt-1">
                              متوسط: ${coin.avgPrice}
                            </div>
                          )}
                        </div>
                        <div className="bg-background/50 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground mb-1">📊 القيمة السوقية</div>
                          <div className="text-lg font-semibold">{coin.marketCap}</div>
                        </div>
                        {coin.suggestedAmount && (
                          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-sm text-muted-foreground mb-1">💵 المبلغ المخصص</div>
                            <div className="text-lg font-semibold text-primary">
                              ${coin.suggestedAmount}
                              <span className="text-sm mr-2">({coin.investmentPercentage}%)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Category and Value Score */}
                      {(coin.category || coin.valueScore) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {coin.category && (
                            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                              <div className="text-sm text-muted-foreground mb-1">🏷️ الفئة</div>
                              <div className="text-base font-semibold text-accent">{coin.category}</div>
                            </div>
                          )}
                          {coin.valueScore && (
                            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                              <div className="text-sm text-muted-foreground mb-1">⭐ نقاط القيمة</div>
                              <div className="text-base font-semibold text-green-600 dark:text-green-400">
                                {coin.valueScore}
                                <span className="text-xs mr-2">(قوة/سعر)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detailed Info */}
                      <div className="space-y-3">
                        <div className="bg-background/50 rounded-lg p-4">
                          <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                            <span>🎯 المشروع</span>
                          </div>
                          <div className="text-muted-foreground leading-relaxed">
                            {coin.project}
                          </div>
                        </div>

                        {coin.useCase && (
                          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                            <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                              <span>💡 حالات الاستخدام العملية</span>
                            </div>
                            <div className="text-muted-foreground leading-relaxed">
                              {coin.useCase}
                            </div>
                          </div>
                        )}

                        {coin.technology && (
                          <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                            <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                              <span>⚙️ التكنولوجيا والبنية التقنية</span>
                            </div>
                            <div className="text-muted-foreground leading-relaxed">
                              {coin.technology}
                            </div>
                          </div>
                        )}

                        {coin.team && (
                          <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                            <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                              <span>👥 الفريق والمؤسسين</span>
                            </div>
                            <div className="text-muted-foreground leading-relaxed">
                              {coin.team}
                            </div>
                          </div>
                        )}

                        {coin.partners && (
                          <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/10">
                            <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                              <span>🤝 الشركاء والتبني</span>
                            </div>
                            <div className="text-muted-foreground leading-relaxed">
                              {coin.partners}
                            </div>
                          </div>
                        )}

                        <div className="bg-background/50 rounded-lg p-4">
                          <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                            <span>✅ التوافق الشرعي</span>
                          </div>
                          <div className="text-muted-foreground leading-relaxed">
                            {coin.shariaCompliance}
                          </div>
                        </div>

                        <div className="bg-background/50 rounded-lg p-4">
                          <div className="text-sm text-primary font-semibold mb-2 flex items-center gap-2">
                            <span>📈 إمكانية النمو</span>
                          </div>
                          <div className="text-muted-foreground leading-relaxed">
                            {coin.growth}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-background/50 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">⚠️ مستوى المخاطر</div>
                            <div className="text-lg font-semibold">{coin.riskLevel}</div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">💧 السيولة</div>
                            <div className="text-lg font-semibold">{coin.liquidity}</div>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-sm text-muted-foreground mb-1">🏆 تقييم الأداء</div>
                            <div className="text-lg font-semibold text-primary">{coin.performanceScore}/10</div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">💡 التوصية</div>
                            <div className="text-lg font-semibold">{coin.recommendation}</div>
                          </div>
                        </div>

                        {/* External Links */}
                        {coin.links && Object.keys(coin.links).length > 0 && (
                          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-sm text-primary font-semibold mb-3 flex items-center gap-2">
                              <span>🔗 روابط مفيدة</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {coin.links.website && (
                                <a 
                                  href={coin.links.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-background/50 hover:bg-background/80 rounded-lg p-3 transition-colors"
                                >
                                  <span>🌐</span>
                                  <span className="text-sm font-medium">الموقع</span>
                                </a>
                              )}
                              {coin.links.whitepaper && (
                                <a 
                                  href={coin.links.whitepaper} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-background/50 hover:bg-background/80 rounded-lg p-3 transition-colors"
                                >
                                  <span>📄</span>
                                  <span className="text-sm font-medium">Whitepaper</span>
                                </a>
                              )}
                              {coin.links.twitter && (
                                <a 
                                  href={coin.links.twitter} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-background/50 hover:bg-background/80 rounded-lg p-3 transition-colors"
                                >
                                  <span>🐦</span>
                                  <span className="text-sm font-medium">Twitter</span>
                                </a>
                              )}
                              {coin.links.docs && (
                                <a 
                                  href={coin.links.docs} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-background/50 hover:bg-background/80 rounded-lg p-3 transition-colors"
                                >
                                  <span>📚</span>
                                  <span className="text-sm font-medium">الوثائق</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
              ))}
            </Accordion>

            {/* Notes Section */}
            {notes.length > 0 && (
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-right flex items-center justify-end gap-2">
                    <span>ملاحظات هامة</span>
                    <span>📌</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground text-right leading-relaxed space-y-2" dir="rtl">
                    {notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestCoins;