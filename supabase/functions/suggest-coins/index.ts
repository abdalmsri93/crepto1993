import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BinanceSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteAsset: string;
}

// دالة لجلب العملات من Binance API
async function fetchCoinsFromBinance(
  minPrice: number,
  maxPrice: number
): Promise<any[]> {
  try {
    // جلب جميع الرموز من Binance
    const symbolsResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!symbolsResponse.ok) {
      throw new Error(`Binance API error: ${symbolsResponse.status}`);
    }
    
    const symbolsData: any = await symbolsResponse.json();
    const symbols = symbolsData.symbols
      .filter((s: BinanceSymbol) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s: BinanceSymbol) => s.symbol)
      .slice(0, 500); // أول 500 عملة
    
    // جلب أسعار جميع العملات
    const tickersResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickersResponse.ok) {
      throw new Error(`Binance tickers error: ${tickersResponse.status}`);
    }
    
    const tickers: BinanceTicker[] = await tickersResponse.json();
    
    // تصفية العملات حسب الرمز والسعر
    const coins = tickers
      .filter((t: BinanceTicker) => 
        symbols.includes(t.symbol) &&
        t.quoteAsset === 'USDT' &&
        parseFloat(t.lastPrice) >= minPrice &&
        parseFloat(t.lastPrice) <= maxPrice
      )
      .map((t: BinanceTicker) => ({
        symbol: t.symbol.replace('USDT', ''),
        name: t.symbol.replace('USDT', ''),
        price: parseFloat(t.lastPrice),
        lastPrice: t.lastPrice,
        priceChange: t.priceChange,
        priceChangePercent: t.priceChangePercent,
        highPrice: t.highPrice,
        lowPrice: t.lowPrice,
        volume: t.volume
      }));
    
    return coins;
  } catch (error) {
    console.error("Error fetching from Binance:", error);
    throw error;
  }
}

// دالة للاختيار العشوائي
function randomSample<T>(array: T[], count: number): T[] {
  if (array.length <= count) return array;
  
  const result: T[] = [];
  const used = new Set<number>();
  
  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * array.length);
    if (!used.has(randomIndex)) {
      used.add(randomIndex);
      result.push(array[randomIndex]);
    }
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      currentAssets = [], 
      investmentAmount = null,
      minPrice = 0.10,
      maxPrice = 10,
      marketCapFilter = "all",
      coinCount = 5
    } = await req.json();

    console.log("Fetching live coins from Binance API...");
    
    // جلب العملات من Binance
    const coinsToUse = await fetchCoinsFromBinance(minPrice, maxPrice);
    
    // إزالة العملات الموجودة بالفعل
    const currentSymbols = new Set(currentAssets.map(a => a.toUpperCase()));
    const availableCoins = coinsToUse.filter(coin => 
      !currentSymbols.has(coin.symbol.toUpperCase())
    );
    
    console.log(`Found ${availableCoins.length} available coins from Binance`);
    
    // اختيار عشوائي
    const selectedCoins = randomSample(availableCoins, Math.min(coinCount, availableCoins.length));
    
    // تحويل البيانات
    const coins = selectedCoins.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: `$${coin.price.toFixed(2)}`,
      marketCap: "من Binance",
      project: `${coin.name} - السعر الحالي: $${coin.price.toFixed(2)}`,
      shariaCompliance: "بيانات حية من Binance",
      growth: `${parseFloat(coin.priceChangePercent).toFixed(2)}% (24h)`,
      riskLevel: "متوسط",
      liquidity: "عالية",
      performanceScore: 7,
      investmentPercentage: 100 / selectedCoins.length,
      suggestedAmount: investmentAmount ? ((investmentAmount * 100 / selectedCoins.length) / 100).toFixed(2) : null,
      recommendation: "احتفاظ",
      category: "من Binance Live",
      valueScore: coin.price.toFixed(2),
      avgPrice: coin.price.toFixed(2),
      team: `24h Volume: ${coin.volume}`,
      partners: `High: $${parseFloat(coin.highPrice).toFixed(2)}`,
      technology: `Low: $${parseFloat(coin.lowPrice).toFixed(2)}`,
      useCase: `Change: ${coin.priceChange}`,
      links: {
        website: `https://www.binance.com/en/trade/${coin.symbol}`,
      }
    }));

    return new Response(
      JSON.stringify({ 
        coins,
        notes: [
          `✅ تم اختيار ${coins.length} عملة من Binance API`,
          `📊 النطاق السعري: $${minPrice} - $${maxPrice}`,
          "🔄 كل بحث جديد = عملات مختلفة عشوائياً",
          "💡 البيانات حقيقية ومحدثة من Binance",
          "⚠️ بحث واستثمر بحكمة!"
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ في جلب البيانات" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});