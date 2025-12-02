import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoinFromAPI {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  atl: number;
}

// دالة لجلب العملات من CoinGecko API
async function fetchCoinsFromCoinGecko(
  minPrice: number,
  maxPrice: number,
  page: number = 1
): Promise<CoinFromAPI[]> {
  try {
    const perPage = 250;
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const coins: CoinFromAPI[] = await response.json();
    
    // تصفية العملات حسب السعر
    return coins.filter(coin => 
      coin.current_price !== null &&
      coin.current_price >= minPrice && 
      coin.current_price <= maxPrice
    );
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
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
      minPrice = 0.10,
      maxPrice = 10,
      coinCount = 5
    } = await req.json();

    console.log("Fetching live coins from CoinGecko API...");
    
    // جلب العملات من CoinGecko
    const allCoins = await fetchCoinsFromCoinGecko(minPrice, maxPrice, 1);
    
    // إذا لم نجد عملات كافية، جلب من صفحات أخرى
    let coinsToUse = allCoins;
    if (coinsToUse.length < coinCount * 3) {
      const moreCoins = await fetchCoinsFromCoinGecko(minPrice, maxPrice, 2);
      coinsToUse = [...coinsToUse, ...moreCoins];
    }
    
    // إزالة العملات الموجودة بالفعل
    const currentSymbols = new Set(currentAssets.map(a => a.toUpperCase()));
    const availableCoins = coinsToUse.filter(coin => 
      !currentSymbols.has(coin.symbol.toUpperCase())
    );
    
    console.log(`Found ${availableCoins.length} available coins`);
    
    // اختيار عشوائي
    const selectedCoins = randomSample(availableCoins, Math.min(coinCount, availableCoins.length));
    
    // تحويل البيانات إلى صيغة نهائية
    const coins = selectedCoins.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: `$${coin.current_price.toFixed(2)}`,
      marketCap: coin.market_cap ? `$${(coin.market_cap / 1e9).toFixed(2)}B` : "N/A",
      project: `${coin.name} - Market Cap Rank: #${coin.market_cap_rank}`,
      shariaCompliance: "بيانات من CoinGecko API",
      growth: `${coin.price_change_percentage_24h?.toFixed(2)}% (24h)`,
      riskLevel: coin.market_cap_rank && coin.market_cap_rank > 100 ? "عالي" : "متوسط",
      liquidity: coin.total_volume ? "عالية" : "متوسطة",
      performanceScore: Math.min(10, Math.max(1, (100 - (coin.market_cap_rank || 100)) / 10)),
      investmentPercentage: 100 / selectedCoins.length,
      recommendation: "احتفاظ",
      category: "من CoinGecko",
      valueScore: coin.current_price ? `${(coin.market_cap ? (coin.market_cap / 1e9) / coin.current_price : 0).toFixed(2)}` : "0",
      avgPrice: coin.current_price?.toFixed(2) || "0",
      team: `24h Volume: $${(coin.total_volume / 1e6).toFixed(2)}M`,
      partners: `All Time High: $${coin.ath?.toFixed(2)}`,
      technology: `All Time Low: $${coin.atl?.toFixed(2)}`,
      useCase: `Supply: ${(coin.circulating_supply / 1e6).toFixed(2)}M`,
      links: {
        website: `https://www.coingecko.com/en/coins/${coin.id}`,
      }
    }));

    return new Response(
      JSON.stringify({ 
        coins,
        notes: [
          `تم اختيار ${coins.length} عملة من CoinGecko API بناءً على السعر والقيمة السوقية`,
          `النطاق السعري: $${minPrice} - $${maxPrice}`,
          "جميع البيانات حقيقية ومحدثة من السوق",
          "الاختيار عشوائي - كل بحث جديد = عملات مختلفة",
          "لا تنسى البحث والتحليل قبل الاستثمار",
          "⚠️ هذه التوصيات لأغراض تعليمية فقط"
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
