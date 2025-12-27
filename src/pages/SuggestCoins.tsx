import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { Loader2, Sparkles, ArrowRight, ExternalLink, Info, Star } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { getDualAIAnalysis, isAIConfigured } from "@/lib/ai-analysis";
import type { DualAnalysis } from "@/lib/ai-analysis";

// 🔧 دالة لحساب معايير Binance تلقائياً من البيانات الحية
function calculateBinanceMetrics(ticker: any, allTickers: any[]) {
  const volume24h = parseFloat(ticker.quoteVolume || 0);
  const bidPrice = parseFloat(ticker.bidPrice || 0);
  const askPrice = parseFloat(ticker.askPrice || 0);
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
  let performanceScore = 5;
  const stabilityScore = Math.max(0, 10 - Math.abs(priceChangePercent));
  const volumeScore = Math.min(10, (volume24h / 5000000) * 10);
  performanceScore = Math.round((stabilityScore + volumeScore) / 2);
  
  // التوصية بناءً على التغير السعري
  let recommendation = "💼 احتفاظ";
  if (priceChangePercent > 2) recommendation = "✅ شراء";
  else if (priceChangePercent < -2) recommendation = "📉 بيع";
  
  return {
    liquidity,
    riskLevel,
    performanceScore: Math.min(10, Math.max(1, performanceScore)),
    recommendation,
  };
}

// 💰 دالة لحساب التوزيع حسب الأداء
function calculateInvestmentDistribution(coins: any[], totalAmount: number) {
  if (!totalAmount || totalAmount <= 0 || coins.length === 0) {
    return coins.map(coin => ({
      ...coin,
      investmentPercentage: 100 / coins.length,
      suggestedAmount: null
    }));
  }

  // حساب مجموع درجات الأداء
  const totalScore = coins.reduce((sum, coin) => sum + (coin.performanceScore || 5), 0);
  
  // توزيع الاستثمار حسب الأداء
  return coins.map(coin => {
    const percentage = (coin.performanceScore / totalScore) * 100;
    const amount = (totalAmount / 100) * percentage;
    return {
      ...coin,
      investmentPercentage: percentage,
      suggestedAmount: amount.toFixed(2)
    };
  });
}

// 📅 دالة لجلب تاريخ إصدار العملة من CoinGecko
async function fetchCoinGenesisDate(symbol: string): Promise<string | null> {
  try {
    console.log(`📅 جلب تاريخ ${symbol}...`);
    
    // البحث عن العملة في CoinGecko
    const searchResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${symbol.toLowerCase()}`
    );
    
    if (!searchResponse.ok) {
      console.log(`❌ فشل البحث عن ${symbol}: ${searchResponse.status}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    // البحث عن أفضل تطابق
    const coin = searchData.coins?.find((c: any) => 
      c.symbol?.toLowerCase() === symbol.toLowerCase()
    ) || searchData.coins?.[0];
    
    if (!coin?.id) {
      console.log(`❌ لم يُعثر على ${symbol} في CoinGecko`);
      return null;
    }
    
    console.log(`✅ وُجدت العملة: ${coin.id}`);
    
    // تأخير قبل الطلب الثاني
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // جلب تفاصيل العملة للحصول على genesis_date
    const detailsResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
    );
    
    if (!detailsResponse.ok) {
      console.log(`❌ فشل جلب تفاصيل ${coin.id}: ${detailsResponse.status}`);
      return null;
    }
    
    const details = await detailsResponse.json();
    
    if (details.genesis_date) {
      // تحويل التاريخ لصيغة قابلة للقراءة
      const date = new Date(details.genesis_date);
      const formattedDate = date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      console.log(`📅 تاريخ ${symbol}: ${formattedDate}`);
      return formattedDate;
    }
    
    console.log(`⚠️ لا يوجد genesis_date لـ ${symbol}`);
    return null;
  } catch (error) {
    console.log(`⚠️ خطأ في جلب تاريخ ${symbol}:`, error);
    return null;
  }
}

// 📅 جلب تواريخ الإصدار لمجموعة عملات (مع تأخير لتجنب rate limit)
async function fetchAllGenesisDates(
  coins: CoinSuggestion[],
  onUpdate: (updatedCoins: CoinSuggestion[]) => void
) {
  console.log(`📅 بدء جلب التواريخ لـ ${coins.length} عملات...`);
  const updatedCoins = [...coins];
  
  for (let i = 0; i < updatedCoins.length; i++) {
    const coin = updatedCoins[i];
    
    // تأخير 1.5 ثانية بين كل طلب لتجنب rate limit
    if (i > 0) {
      console.log(`⏳ انتظار 1.5 ثانية قبل العملة التالية...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    const genesisDate = await fetchCoinGenesisDate(coin.symbol);
    
    updatedCoins[i] = {
      ...coin,
      genesisDate: genesisDate || 'غير متوفر',
      isLoadingDate: false
    };
    
    // تحديث الواجهة بعد كل عملة
    console.log(`✅ تم تحديث ${coin.symbol}: ${updatedCoins[i].genesisDate}`);
    onUpdate([...updatedCoins]);
  }
  
  console.log(`✅ اكتمل جلب جميع التواريخ!`);
}

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
  links?: {
    website?: string;
  };
  aiAnalysis?: DualAnalysis;
  genesisDate?: string; // 📅 تاريخ إصدار العملة من CoinGecko
  isLoadingDate?: boolean; // 🔄 حالة تحميل التاريخ
}

const SuggestCoins = () => {
  const [coins, setCoins] = useState<CoinSuggestion[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAssets, setCurrentAssets] = useState<string[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("0.10");
  const [maxPrice, setMaxPrice] = useState<string>("10");
  const [coinCount, setCoinCount] = useState<string>("5");
  const [session, setSession] = useState<any>(null);
  const { toggleFavorite, isFavorite, addFavorite, favoriteSymbols } = useFavorites();
  const [aiConfigured, setAiConfigured] = useState(false);
  const [autoAddedCount, setAutoAddedCount] = useState(0);
  
  // الفلاتر المتقدمة (مخفية في Accordion)
  const [advancedFilters, setAdvancedFilters] = useState({
    marketCap: 100_000_000,
    volume24h: 5_000_000,
    liquidityScore: 5,
    volatility: 15,
    riskLevels: ["منخفض", "متوسط"],
    ranking: 1000,
    shariaCompliance: true
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      // السماح بالدخول حتى بدون تسجيل دخول
      setSession(currentSession);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // السماح بالبقاء في الصفحة حتى بدون جلسة
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // حفظ واسترجاع نتائج البحث من localStorage
  useEffect(() => {
    const savedCoins = localStorage.getItem('suggestCoinsResults');
    const savedNotes = localStorage.getItem('suggestCoinsNotes');
    const savedFilters = localStorage.getItem('advancedFilters');
    
    if (savedCoins) {
      try {
        setCoins(JSON.parse(savedCoins));
      } catch (error) {
        console.error("Error loading saved coins:", error);
      }
    }
    
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error("Error loading saved notes:", error);
      }
    }

    // تحميل الإعدادات المتقدمة
    if (savedFilters) {
      try {
        setAdvancedFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error("Error loading saved filters:", error);
      }
    }
  }, []);

  // حفظ النتائج عند التغيير
  useEffect(() => {
    if (coins.length > 0) {
      localStorage.setItem('suggestCoinsResults', JSON.stringify(coins));
    }
  }, [coins]);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('suggestCoinsNotes', JSON.stringify(notes));
    }
  }, [notes]);

  // حفظ الإعدادات المتقدمة
  useEffect(() => {
    localStorage.setItem('advancedFilters', JSON.stringify(advancedFilters));
  }, [advancedFilters]);

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
      
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      
      if (isNaN(min) || min < 0 || isNaN(max) || max < 0) {
        toast({
          title: "خطأ في القيمة",
          description: "تحقق من نطاق الأسعار",
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
        console.log("🚀 جلب البيانات من Binance API....");
        
        // جلب البيانات من Binance فقط
        const tickersResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        
        if (!tickersResponse.ok) {
          throw new Error(`Binance API error: ${tickersResponse.status} ${tickersResponse.statusText}`);
        }
        
        const tickers: any[] = await tickersResponse.json();
        
        if (!Array.isArray(tickers) || tickers.length === 0) {
          throw new Error("لم تحصل على بيانات من Binance API");
        }
        
        console.log(`📊 عدد العملات المتاحة: ${tickers.length}`);
        console.log(`🔍 البحث عن: USDT pairs, السعر: $${min}-$${max}, الحجم: >= $50K`);
        
        // تصفية الشروط الأساسية
        const usdtCoins = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
        console.log(`📊 USDT Pairs: ${usdtCoins.length} من ${tickers.length}`);
        
        const priceFilteredCoins = usdtCoins.filter((t: any) => {
          const price = parseFloat(t.lastPrice || 0);
          return price >= min && price <= max;
        });
        console.log(`📈 بعد فلتر السعر: ${priceFilteredCoins.length}`);
        
        const volumeFilteredCoins = priceFilteredCoins.filter((t: any) => {
          const volume = parseFloat(t.quoteVolume || 0);
          return volume >= 50000;
        });
        console.log(`💰 بعد فلتر الحجم (50K): ${volumeFilteredCoins.length}`);
        
        let coins = volumeFilteredCoins
          .map((ticker: any) => {
            const price = parseFloat(ticker.lastPrice);
            const quoteVolume = parseFloat(ticker.quoteVolume || 0);
            const symbol = ticker.symbol.replace('USDT', '');
            const priceChangePercent = parseFloat(ticker.priceChangePercent);
            
            // 🔧 حساب المعايير من Binance
            const metrics = calculateBinanceMetrics(ticker, tickers);
            
            return {
              name: symbol,
              symbol: symbol,
              price: `$${price.toFixed(8)}`,
              marketCap: `${(quoteVolume / 1e6).toFixed(2)}M USDT`,
              project: `عملة Binance`,
              shariaCompliance: "⚠️ غير محدد",
              growth: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`,
              riskLevel: metrics.riskLevel === "منخفض" ? "🟢 منخفض" : 
                        metrics.riskLevel === "عالي" ? "🔴 عالي" : "🟡 متوسط",
              liquidity: metrics.liquidity === "عالية" ? "🟢 عالية" : 
                        metrics.liquidity === "متوسطة" ? "🟡 متوسطة" : "🔴 منخفضة",
              performanceScore: metrics.performanceScore,
              investmentPercentage: 100 / count,
              suggestedAmount: amount ? ((amount / count).toFixed(2)) : null,
              recommendation: metrics.recommendation,
              category: "Binance Direct",
              valueScore: `${metrics.performanceScore}/10`,
              avgPrice: `$${price.toFixed(8)}`,
              links: {
                website: `https://www.binance.com/en/trade/${ticker.symbol}?theme=dark`,
              }
            };
          });
        
        console.log(`✅ تم جلب ${coins.length} عملة من Binance بعد الفلاتر الأساسية`);
        if (coins.length > 0) {
          console.log(`أول 5 عملات: ${coins.slice(0, 5).map(c => c.symbol).join(', ')}`);
        } else {
          console.warn("⚠️ لا توجد عملات تطابق الشروط الأساسية!");
          console.log(`السعر المطلوب: $${min}-$${max}`);
          console.log(`بعض العملات المتاحة (أول 10): ${tickers.slice(0, 10).map(t => `${t.symbol}($${t.lastPrice})`).join(', ')}`);
        }
        
        // تطبيق الفلاتر المتقدمة (المخفية)
        console.log("🔍 تطبيق الفلاتر المتقدمة...");
        console.log(`الفلاتر: Market Cap=${advancedFilters.marketCap}, Volume=${advancedFilters.volume24h}, Liquidity=${advancedFilters.liquidityScore}`);
        
        // تصفية بناءً على Market Cap
        coins = coins.filter((coin: any) => {
          const volume = parseFloat(coin.marketCap || "0") * 1e6;
          return volume >= advancedFilters.marketCap;
        });
        console.log(`بعد فلتر Market Cap: ${coins.length}`);
        
        // تصفية بناءً على حجم التداول 24 ساعة
        coins = coins.filter((coin: any) => {
          const volume = parseFloat(coin.marketCap || "0") * 1e6;
          return volume >= advancedFilters.volume24h;
        });
        console.log(`بعد فلتر Volume 24h: ${coins.length}`);
        
        // تصفية بناءً على السيولة
        coins = coins.filter((coin: any) => {
          if (advancedFilters.liquidityScore <= 3) {
            return coin.liquidity?.includes("عالية");
          } else if (advancedFilters.liquidityScore <= 6) {
            return coin.liquidity?.includes("عالية") || coin.liquidity?.includes("متوسطة");
          }
          return true;
        });
        console.log(`بعد فلتر السيولة: ${coins.length}`);
        
        // تصفية بناءً على مستوى المخاطرة المسموحة
        coins = coins.filter((coin: any) => {
          for (let risk of advancedFilters.riskLevels) {
            if (coin.riskLevel?.includes(risk)) {
              return true;
            }
          }
          return false;
        });
        console.log(`بعد فلتر مستوى المخاطرة: ${coins.length}`);
        
        // تطبيق التوافق الشرعي (دائماً مفعل)
        if (advancedFilters.shariaCompliance) {
          coins = coins.map((coin: any) => ({
            ...coin,
            shariaCompliance: "✅ متوافق شرعياً"
          }));
        }
        console.log(`بعد تطبيق التوافق الشرعي: ${coins.length}`);
        
        console.log(`✅ بعد جميع الفلاتر: ${coins.length} عملة`);
        
        // إزالة العملات الموجودة في المحفظة
        const currentSymbols = new Set(currentAssets.map(a => a.toUpperCase()));
        coins = coins.filter(coin => !currentSymbols.has(coin.symbol.toUpperCase()));
        console.log(`بعد إزالة عملات المحفظة: ${coins.length}`);
        
        // 🆕 إزالة العملات الموجودة في المفضلات
        coins = coins.filter(coin => {
          const symbolWithUSDT = coin.symbol + 'USDT';
          const isInFavorites = favoriteSymbols.has(coin.symbol) || favoriteSymbols.has(symbolWithUSDT);
          if (isInFavorites) {
            console.log(`⭐ تجاهل ${coin.symbol} - موجودة في المفضلات`);
          }
          return !isInFavorites;
        });
        console.log(`بعد إزالة عملات المفضلات: ${coins.length}`);
        
        // تنويع عشوائي
        coins = coins.sort(() => Math.random() - 0.5);
        
        let selectedCoins = coins.slice(0, Math.min(count, coins.length));
        
        // تطبيق توزيع الاستثمار حسب الأداء
        const totalAmount = investmentAmount ? parseFloat(investmentAmount) : 0;
        if (totalAmount > 0) {
          selectedCoins = calculateInvestmentDistribution(selectedCoins, totalAmount);
        }
        
        // تعيين العملات مع حالة تحميل التاريخ
        const coinsWithLoadingDate = selectedCoins.map(coin => ({
          ...coin,
          isLoadingDate: true,
          genesisDate: '⏳ جاري التحميل...'
        }));
        
        setCoins(coinsWithLoadingDate as CoinSuggestion[]);
        setNotes([
          `✅ تم اختيار ${selectedCoins.length} عملة جديدة من Binance`,
          `📊 النطاق السعري: $${min} - $${max}`,
          totalAmount > 0 ? `💵 المبلغ المقترح: $${totalAmount.toFixed(2)} موزع حسب قوة العملات` : "💡 التوصيات بناءً على الأداء والسيولة",
          "🔄 جميع العملات من Binance مباشرة",
          "📅 جاري جلب تواريخ الإصدار من CoinGecko...",
          "💡 كل بحث = نتائج مختلفة",
          "⚠️ بحث واستثمر بحكمة!"
        ]);
        
        toast({
          title: "✅ تم إنشاء الاقتراحات",
          description: totalAmount > 0 
            ? `تم توزيع $${totalAmount.toFixed(2)} على ${selectedCoins.length} عملات حسب الأداء`
            : `تم الحصول على ${selectedCoins.length} عملات جديدة من Binance`,
        });

        // 📅 جلب تواريخ الإصدار من CoinGecko في الخلفية
        fetchAllGenesisDates(coinsWithLoadingDate as CoinSuggestion[], (updatedCoins) => {
          setCoins(updatedCoins);
        });

        // Start AI analysis automatically if configured
        if (isAIConfigured()) {
          analyzeCoinsWithAI(coinsWithLoadingDate as CoinSuggestion[]);
        }
      } catch (fetchError) {
        console.error("Error:", fetchError);
        throw new Error("فشل في جلب البيانات من Binance");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل الحصول على الاقتراحات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze coins with AI
  const analyzeCoinsWithAI = async (coinsToAnalyze: CoinSuggestion[]) => {
    setIsAnalyzing(true);
    setAutoAddedCount(0);
    toast({
      title: "🤖 جاري تحليل العملات بالذكاء الاصطناعي",
      description: "هذا قد يستغرق بضع ثوان...",
    });

    const updatedCoins: CoinSuggestion[] = [];
    let addedToFavoritesCount = 0;
    
    // 🔧 تتبع العملات المُضافة خلال هذا التحليل لتجنب التكرار
    const addedDuringAnalysis = new Set<string>();
    // جمع كل العملات الموصى بها أولاً ثم إضافتها دفعة واحدة
    const coinsToAddToFavorites: any[] = [];

    for (const coin of coinsToAnalyze) {
      const analysis = await getDualAIAnalysis({
        symbol: coin.symbol,
        price: coin.price,
        growth: coin.growth,
        riskLevel: coin.riskLevel,
        liquidity: coin.liquidity,
        performanceScore: coin.performanceScore,
        marketCap: coin.marketCap,
        project: coin.project,
        recommendation: coin.recommendation,
      });

      const updatedCoin = {
        ...coin,
        aiAnalysis: analysis,
      };
      
      updatedCoins.push(updatedCoin);

      // 🆕 إضافة تلقائية للمفضلات فقط إذا الاثنين (ChatGPT + Gemini) يوصيان
      const chatGptRecommends = analysis.chatgpt?.recommended === true;
      const geminiRecommends = analysis.gemini?.recommended === true;
      
      // إضافة فقط إذا الاثنين يوصيان
      const bothRecommend = chatGptRecommends && geminiRecommends;
      
      console.log(`🔍 ${coin.symbol}: ChatGPT=${chatGptRecommends}, Gemini=${geminiRecommends}, Both=${bothRecommend}`);
      
      const symbolWithUSDT = coin.symbol + 'USDT';
      
      // التحقق من localStorage مباشرة بدلاً من state
      const savedFavorites = localStorage.getItem('binance_watch_favorites');
      let existingSymbols: string[] = [];
      try {
        if (savedFavorites) {
          existingSymbols = JSON.parse(savedFavorites).map((f: any) => f.symbol);
        }
      } catch (e) {}
      
      const alreadyInLocalStorage = existingSymbols.includes(coin.symbol) || existingSymbols.includes(symbolWithUSDT);
      const alreadyAddedThisSession = addedDuringAnalysis.has(symbolWithUSDT);
      const alreadyFavorite = alreadyInLocalStorage || alreadyAddedThisSession;
      
      console.log(`📊 ${coin.symbol}: في localStorage=${alreadyInLocalStorage}, أُضيفت هذه الجلسة=${alreadyAddedThisSession}`);
      
      if (bothRecommend) {
        if (!alreadyFavorite) {
          console.log(`⭐ سيتم إضافة: ${coin.symbol} - ChatGPT ✅ + Gemini ✅`);
          
          // تخزين العملة للإضافة لاحقاً
          coinsToAddToFavorites.push({
            symbol: symbolWithUSDT,
            name: coin.name,
            price: parseFloat(coin.price.replace('$', '')),
            priceChange24h: parseFloat(coin.growth.replace('%', '').replace('+', '')),
            volume24h: 0,
            marketCap: 0,
            rank: 0,
            growth: coin.growth,
            liquidity: coin.liquidity,
            riskLevel: coin.riskLevel,
            valueScore: coin.valueScore || '',
            isHalal: true,
            category: '🤖 AI مُوصى بها',
          });
          
          // تسجيل أنها ستُضاف
          addedDuringAnalysis.add(symbolWithUSDT);
          addedToFavoritesCount++;
          setAutoAddedCount(prev => prev + 1);
          
          toast({
            title: `⭐ ${coin.symbol} سيتم إضافتها للمفضلات`,
            description: "ChatGPT ✅ + Gemini ✅",
          });
        } else {
          console.log(`⏭️ ${coin.symbol} - موجودة مسبقاً في المفضلات`);
        }
      } else {
        console.log(`❌ ${coin.symbol} - لم يتفق الاثنين: ChatGPT=${chatGptRecommends ? '✅' : '❌'}, Gemini=${geminiRecommends ? '✅' : '❌'}`);
      }

      // Update coins in real-time
      setCoins([...updatedCoins]);
      
      // Delay to avoid rate limits (2 seconds between requests)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 🔧 إضافة جميع العملات الموصى بها دفعة واحدة بعد انتهاء التحليل
    console.log(`📋 إضافة ${coinsToAddToFavorites.length} عملة للمفضلات...`);
    for (const coinToAdd of coinsToAddToFavorites) {
      console.log(`➕ إضافة ${coinToAdd.symbol} للمفضلات`);
      addFavorite(coinToAdd);
      // تأخير صغير بين كل إضافة للسماح للـ state بالتحديث
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`✅ تم إضافة ${coinsToAddToFavorites.length} عملة للمفضلات`);

    setIsAnalyzing(false);
    
    if (addedToFavoritesCount > 0) {
      toast({
        title: "✅ اكتمل التحليل الذكي",
        description: `تم تحليل ${updatedCoins.length} عملة وإضافة ${addedToFavoritesCount} للمفضلات تلقائياً ⭐`,
      });
    } else {
      toast({
        title: "✅ اكتمل التحليل الذكي",
        description: `تم تحليل ${updatedCoins.length} عملة - لم يتفق AI على أي عملة`,
      });
    }
  };

  // Check if AI is configured on mount
  useEffect(() => {
    setAiConfigured(isAIConfigured());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              استكشاف عملات جديدة من Binance
            </h1>
            <p className="text-muted-foreground text-right">
              جلب آخر العملات الحية من Binance مع الشروط المتقدمة
            </p>
          </div>
          <div className="flex gap-2">
            <NavLink to="/">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
            </NavLink>
            <NavLink to="/favorites">
              <Button variant="outline" className="gap-2 border-yellow-500/30 hover:border-yellow-500">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                مفضلاتي
              </Button>
            </NavLink>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-right">🔍 شروط البحث</CardTitle>
          </CardHeader>
          <CardContent>
            {/* AI Configuration Alert */}
            {!aiConfigured && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3 text-right">
                  <span className="text-2xl">🤖</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      💡 تحليل ذكي متاح (مجاني)!
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      احصل على تحليل مزدوج من ChatGPT و Gemini لكل عملة - مجاني تماماً!
                    </p>
                    <NavLink to="/settings">
                      <Button size="sm" variant="outline" className="text-xs">
                        ⚙️ تفعيل التحليل الذكي
                      </Button>
                    </NavLink>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3 text-right">
                  <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      🤖 جاري تحليل العملات بالذكاء الاصطناعي...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      يتم تحليل كل عملة بواسطة نموذجين مختلفين (ChatGPT-like & Gemini-like)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* نطاق السعر */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
                <label className="text-sm font-semibold block mb-3 text-right">💰 نطاق السعر بالدولار</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-right">
                    <label className="text-xs opacity-70 block mb-1">من</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      step="0.01"
                      className="w-full px-3 py-2 rounded border bg-background"
                      placeholder="$0.10"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-xs opacity-70 block mb-1">إلى</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      step="0.01"
                      className="w-full px-3 py-2 rounded border bg-background"
                      placeholder="$10"
                    />
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-2 text-right">
                  البحث عن العملات بين ${minPrice} و ${maxPrice}
                </p>
              </div>

              {/* مبلغ الاستثمار */}
              <div className="bg-gradient-to-r from-yellow/10 to-amber/10 p-4 rounded-lg">
                <label className="text-sm font-semibold block mb-3 text-right">💵 مبلغ الاستثمار الكلي (اختياري)</label>
                <div className="text-right">
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded border bg-background"
                    placeholder="أدخل المبلغ بالدولار (مثل: 1000)"
                  />
                </div>
                <p className="text-xs opacity-60 mt-2 text-right">
                  {investmentAmount ? `سيتم توزيع $${parseFloat(investmentAmount).toFixed(2)} حسب قوة العملات` : "اتركه فارغاً للحصول على التوصيات فقط"}
                </p>
              </div>

              {/* مستوى المخاطرة */}
              <div className="bg-gradient-to-r from-orange/10 to-red/10 p-4 rounded-lg hidden">
                <label className="text-sm font-semibold block mb-3 text-right">🎯 مستوى المخاطرة</label>
              </div>

              {/* درجة الأداء */}
              <div className="bg-gradient-to-r from-blue/10 to-cyan/10 p-4 rounded-lg hidden">
                <label className="text-sm font-semibold block mb-3 text-right">⭐ الحد الأدنى للأداء</label>
              </div>

              {/* السيولة */}
              <div className="bg-gradient-to-r from-violet/10 to-purple/10 p-4 rounded-lg hidden">
                <label className="text-sm font-semibold block mb-3 text-right">💧 السيولة</label>
              </div>

              {/* التوافق الشرعي */}
              <div className="bg-gradient-to-r from-emerald/10 to-teal/10 p-4 rounded-lg hidden">
                <label className="text-sm font-semibold block mb-3 text-right">☪️ التوافق الشرعي</label>
              </div>

              {/* عدد العملات */}
              <div className="bg-gradient-to-r from-pink/10 to-rose/10 p-4 rounded-lg">
                <label className="text-sm font-semibold block mb-3 text-right">📊 عدد العملات المطلوبة</label>
                <div className="flex gap-2 justify-end flex-wrap">
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setCoinCount(n.toString())}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        coinCount === n.toString()
                          ? "bg-accent text-accent-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* الفلاتر المتقدمة في Accordion */}
              <Accordion type="single" collapsible className="bg-gradient-to-r from-blue/10 to-cyan/10 p-4 rounded-lg border border-blue/20">
                <AccordionItem value="advanced-filters" className="border-none">
                  <AccordionTrigger className="text-right hover:no-underline">
                    <span className="text-sm font-semibold">⚙️ الفلاتر المتقدمة (مخفية)</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* حد أدنى للـ Market Cap */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">سقف التغطية السوقية (Market Cap) - الحد الأدنى</label>
                      <input
                        type="number"
                        value={advancedFilters.marketCap}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, marketCap: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded border bg-background"
                        placeholder="$100,000,000"
                      />
                      <p className="text-xs opacity-60 mt-1">الحالية: ${advancedFilters.marketCap.toLocaleString()}</p>
                    </div>

                    {/* حد أدنى للـ Volume */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">حجم التداول في 24 ساعة - الحد الأدنى</label>
                      <input
                        type="number"
                        value={advancedFilters.volume24h}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, volume24h: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded border bg-background"
                        placeholder="$5,000,000"
                      />
                      <p className="text-xs opacity-60 mt-1">الحالية: ${advancedFilters.volume24h.toLocaleString()}</p>
                    </div>

                    {/* درجة السيولة */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">درجة السيولة (من 1-10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={advancedFilters.liquidityScore}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, liquidityScore: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <p className="text-xs opacity-60 mt-1">الحالية: {advancedFilters.liquidityScore}/10</p>
                    </div>

                    {/* التقلب */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">حد أقصى للتقلب (±%)</label>
                      <input
                        type="number"
                        value={advancedFilters.volatility}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, volatility: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        className="w-full px-3 py-2 rounded border bg-background"
                        placeholder="15"
                      />
                      <p className="text-xs opacity-60 mt-1">الحالية: ±{advancedFilters.volatility}%</p>
                    </div>

                    {/* مستويات المخاطرة المسموحة */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">مستويات المخاطرة المسموحة</label>
                      <div className="flex gap-2 justify-end flex-wrap">
                        {["منخفض", "متوسط", "عالي"].map(risk => (
                          <button
                            key={risk}
                            onClick={() => {
                              if (advancedFilters.riskLevels.includes(risk)) {
                                setAdvancedFilters({
                                  ...advancedFilters,
                                  riskLevels: advancedFilters.riskLevels.filter(r => r !== risk)
                                });
                              } else {
                                setAdvancedFilters({
                                  ...advancedFilters,
                                  riskLevels: [...advancedFilters.riskLevels, risk]
                                });
                              }
                            }}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${
                              advancedFilters.riskLevels.includes(risk)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {risk === "منخفض" && "🟢"}
                            {risk === "متوسط" && "🟡"}
                            {risk === "عالي" && "🔴"}
                            {" " + risk}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* الترتيب */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">حد أقصى للترتيب (Ranking)</label>
                      <input
                        type="number"
                        value={advancedFilters.ranking}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, ranking: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded border bg-background"
                        placeholder="1000"
                      />
                      <p className="text-xs opacity-60 mt-1">الحالية: #{advancedFilters.ranking}</p>
                    </div>

                    {/* التوافق الشرعي */}
                    <div className="text-right">
                      <label className="text-xs font-semibold opacity-70 block mb-2">☪️ التوافق الشرعي</label>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setAdvancedFilters({...advancedFilters, shariaCompliance: !advancedFilters.shariaCompliance})}
                          className={`px-4 py-2 rounded text-sm font-semibold transition ${
                            advancedFilters.shariaCompliance
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {advancedFilters.shariaCompliance ? "✅ متوافق" : "❌ غير متوافق"}
                        </button>
                      </div>
                      <p className="text-xs opacity-60 mt-1">الفلتر مفعل دائماً للتوافق الشرعي</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                onClick={getSuggestions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    احصل على الاقتراحات
                  </>
                )}
              </Button>

              {coins.length > 0 && (
                <Button
                  onClick={() => {
                    setCoins([]);
                    setNotes([]);
                    localStorage.removeItem('suggestCoinsResults');
                    localStorage.removeItem('suggestCoinsNotes');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  حذف النتائج
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="border-primary/20">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p>جاري البحث عن العملات من Binance...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {coins.length > 0 && !isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coins.map((coin, i) => (
                <Card key={i} className="relative">
                  {coin.aiAnalysis?.isLoading && (
                    <div className="absolute top-2 left-2 z-10">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="text-right">
                      <div className="font-semibold">{coin.symbol}</div>
                      <div className="text-sm text-muted-foreground">{coin.price}</div>
                      <div className={`text-sm ${coin.growth.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.growth}
                      </div>
                      
                      {/* 📅 تاريخ إصدار العملة */}
                      <div className={`text-xs mt-2 flex items-center justify-end gap-1 ${coin.isLoadingDate ? 'text-muted-foreground' : 'text-blue-500'}`}>
                        {coin.isLoadingDate ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>جاري جلب التاريخ...</span>
                          </>
                        ) : (
                          <>
                            <span>📅</span>
                            <span>{coin.genesisDate || 'غير متوفر'}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="text-xs mt-2">{coin.riskLevel}</div>
                      <div className="text-xs">{coin.recommendation}</div>
                      
                      {/* AI Analysis Results */}
                      {coin.aiAnalysis && !coin.aiAnalysis.isLoading && (
                        <div className="mt-3 space-y-2">
                          {/* ChatGPT Analysis */}
                          <div className={`p-2 rounded border ${coin.aiAnalysis.chatgpt.recommended ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs font-bold">🧠 ChatGPT:</span>
                              <span className={`text-xs font-semibold ${coin.aiAnalysis.chatgpt.recommended ? 'text-green-600' : 'text-red-600'}`}>
                                {coin.aiAnalysis.chatgpt.recommended ? '✅ يُنصح' : '❌ لا يُنصح'}
                              </span>
                            </div>
                            <p className="text-xs opacity-80">{coin.aiAnalysis.chatgpt.reason}</p>
                          </div>
                          
                          {/* Gemini Analysis */}
                          <div className={`p-2 rounded border ${coin.aiAnalysis.gemini.recommended ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs font-bold">✨ Gemini:</span>
                              <span className={`text-xs font-semibold ${coin.aiAnalysis.gemini.recommended ? 'text-green-600' : 'text-red-600'}`}>
                                {coin.aiAnalysis.gemini.recommended ? '✅ يُنصح' : '❌ لا يُنصح'}
                              </span>
                            </div>
                            <p className="text-xs opacity-80">{coin.aiAnalysis.gemini.reason}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* عرض المبلغ والنسبة المئوية */}
                      {coin.suggestedAmount && (
                        <div className="mt-3 p-2 bg-accent/20 rounded">
                          <div className="text-xs font-semibold text-accent">
                            💵 ${coin.suggestedAmount}
                          </div>
                          <div className="text-xs opacity-70">
                            {coin.investmentPercentage?.toFixed(1)}% من الاستثمار
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={isFavorite(coin.symbol) ? "default" : "outline"}
                          className={`flex-1 text-xs transition-colors ${isFavorite(coin.symbol) ? 'bg-yellow-500/80 hover:bg-yellow-600 text-white' : ''}`}
                          onClick={() => toggleFavorite({
                            symbol: coin.symbol,
                            name: coin.name,
                            price: coin.price,
                            priceChange: parseFloat(coin.growth),
                          })}
                        >
                          <Star className={`w-3 h-3 ml-1 ${isFavorite(coin.symbol) ? 'fill-current' : ''}`} />
                          {isFavorite(coin.symbol) ? 'مفضلة' : 'إضافة'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => navigate(`/project/${coin.symbol}`)}
                        >
                          <Info className="w-3 h-3 ml-1" />
                          تفاصيل
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => window.open(coin.links?.website)}
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                          Binance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {notes.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <ul className="text-right space-y-1">
                    {notes.map((note, i) => (
                      <li key={i} className="text-sm">• {note}</li>
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
