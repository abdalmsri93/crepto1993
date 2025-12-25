import { useState, useEffect, useMemo } from 'react';
import { SearchCoin } from '@/utils/advancedSearch';

const FAVORITES_KEY = 'binance_watch_favorites';

// دالة حساب نقاط الترتيب للعملة
export function calculateFavoriteScore(coin: SearchCoin): number {
  let score = 0;
  
  // 1. النمو (Growth) - وزن 25%
  const growthStr = coin.growth?.replace('%', '').replace('+', '') || '0';
  const growth = parseFloat(growthStr) || 0;
  if (growth > 0) {
    score += Math.min(growth * 2.5, 25); // max 25 points
  } else {
    score += Math.max(growth * 0.5, -10); // penalty for negative
  }
  
  // 2. السيولة (Liquidity) - وزن 20%
  const liquidityStr = coin.liquidity || '';
  if (liquidityStr.includes('عالية') || liquidityStr.toLowerCase().includes('high')) {
    score += 20;
  } else if (liquidityStr.includes('متوسطة') || liquidityStr.toLowerCase().includes('medium')) {
    score += 12;
  } else if (liquidityStr.includes('منخفضة') || liquidityStr.toLowerCase().includes('low')) {
    score += 5;
  }
  
  // 3. مستوى المخاطرة (Risk Level) - وزن 20%
  const riskStr = coin.riskLevel || '';
  if (riskStr.includes('منخفض') || riskStr.toLowerCase().includes('low')) {
    score += 20;
  } else if (riskStr.includes('متوسط') || riskStr.toLowerCase().includes('medium')) {
    score += 12;
  } else if (riskStr.includes('عالي') || riskStr.toLowerCase().includes('high')) {
    score += 4;
  }
  
  // 4. درجة القيمة (Value Score) - وزن 15%
  const valueStr = coin.valueScore || '';
  const valueMatch = valueStr.match(/(\d+)/); 
  if (valueMatch) {
    const valueNum = parseInt(valueMatch[1]);
    score += (valueNum / 100) * 15;
  }
  
  // 5. عمر العملة (Age) - وزن 10%
  if (coin.ageInDays !== undefined) {
    if (coin.ageInDays <= 7) {
      score += 10; // جديدة جداً
    } else if (coin.ageInDays <= 30) {
      score += 8; // جديدة
    } else if (coin.ageInDays <= 90) {
      score += 5; // معقولة
    } else {
      score += 2; // قديمة
    }
  }
  
  // 6. التوافق الحلال (Halal) - وزن 10%
  if (coin.isHalal) {
    score += 10;
  }
  
  return Math.round(score * 10) / 10; // round to 1 decimal
}

// الحصول على ميدالية الترتيب
export function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank === 4) return '4️⃣';
  if (rank === 5) return '5️⃣';
  if (rank === 6) return '6️⃣';
  if (rank === 7) return '7️⃣';
  if (rank === 8) return '8️⃣';
  if (rank === 9) return '9️⃣';
  if (rank === 10) return '🔟';
  return `⭐${rank}`;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SearchCoin[]>([]);
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set());
  const [portfolioSymbols, setPortfolioSymbols] = useState<Set<string>>(new Set());

  // العملات المفضلة الافتراضية (لاستعادة المفضلات المحذوفة)
  const defaultFavorites: SearchCoin[] = [
    {
      symbol: 'SUIUSDT',
      name: 'Sui',
      price: 1.60,
      priceChange24h: -0.23,
      volume24h: 500000000,
      marketCap: 5000000000,
      rank: 25,
      growth: '-0.23%',
      liquidity: 'عالية جداً',
      riskLevel: 'متوسط',
      valueScore: '75/100',
      isHalal: true,
      category: '🏗️ بنية تحتية',
    },
    {
      symbol: 'HBARUSDT',
      name: 'Hedera',
      price: 0.123,
      priceChange24h: -1.15,
      volume24h: 200000000,
      marketCap: 4500000000,
      rank: 30,
      growth: '-1.15%',
      liquidity: 'عالية',
      riskLevel: 'متوسط',
      valueScore: '70/100',
      isHalal: true,
      category: '🏗️ بنية تحتية',
    },
    {
      symbol: 'PYTHUSDT',
      name: 'Pyth Network',
      price: 0.064,
      priceChange24h: -1.39,
      volume24h: 100000000,
      marketCap: 1000000000,
      rank: 80,
      growth: '-1.39%',
      liquidity: 'متوسطة',
      riskLevel: 'متوسط-عالي',
      valueScore: '65/100',
      isHalal: true,
      category: '🏗️ بنية تحتية',
    },
    {
      symbol: 'IOTAUSDT',
      name: 'IOTA',
      price: 0.099,
      priceChange24h: -1.49,
      volume24h: 80000000,
      marketCap: 900000000,
      rank: 90,
      growth: '-1.49%',
      liquidity: 'متوسطة',
      riskLevel: 'متوسط',
      valueScore: '68/100',
      isHalal: true,
      category: '🏗️ بنية تحتية',
    },
    {
      symbol: 'GRTUSDT',
      name: 'The Graph',
      price: 0.041,
      priceChange24h: -0.55,
      volume24h: 60000000,
      marketCap: 800000000,
      rank: 95,
      growth: '-0.55%',
      liquidity: 'متوسطة',
      riskLevel: 'متوسط',
      valueScore: '66/100',
      isHalal: true,
      category: '🌐 ويب 3',
    },
  ];

  // جلب عملات المحفظة من Binance
  const fetchPortfolioSymbols = async (): Promise<Set<string>> => {
    try {
      // محاولة جلب المحفظة من localStorage إذا كانت محفوظة
      const savedPortfolio = localStorage.getItem('binance_portfolio_assets');
      if (savedPortfolio) {
        const assets = JSON.parse(savedPortfolio);
        return new Set(assets.map((a: string) => a.toUpperCase()));
      }
    } catch (e) {
      console.error('Error fetching portfolio:', e);
    }
    return new Set();
  };

  // تحميل المفضلات من localStorage + البحث التلقائي مع إزالة عملات المحفظة
  useEffect(() => {
    const loadFavorites = async () => {
      // جلب عملات المحفظة
      const portfolio = await fetchPortfolioSymbols();
      setPortfolioSymbols(portfolio);

      // 1. جلب المفضلات من localStorage
      const saved = localStorage.getItem(FAVORITES_KEY);
      let localFavorites: SearchCoin[] = [];
      
      if (saved && saved !== '[]') {
        try {
          localFavorites = JSON.parse(saved);
        } catch (e) {
          localFavorites = [];
        }
      }

      // 2. جلب المفضلات من البحث التلقائي (auto-favorites.json)
      let autoFavorites: SearchCoin[] = [];
      try {
        const response = await fetch('/auto-favorites.json');
        if (response.ok) {
          autoFavorites = await response.json();
          console.log(`🤖 تم تحميل ${autoFavorites.length} عملة من البحث التلقائي`);
        }
      } catch (e) {
        // لا يوجد ملف - هذا طبيعي
      }

      // 3. دمج القوائم (مع تجنب التكرار)
      const existingSymbols = new Set(localFavorites.map(c => c.symbol));
      const newAutoFavorites = autoFavorites.filter(c => !existingSymbols.has(c.symbol));
      let allFavorites = [...localFavorites, ...newAutoFavorites];
      
      // إذا كانت القائمة فارغة، استخدم الافتراضية
      if (allFavorites.length === 0) {
        console.log('📋 استعادة المفضلات الافتراضية...');
        allFavorites = defaultFavorites;
      }
      
      // فلترة: إزالة العملات الموجودة في المحفظة
      const cleanedFavorites = allFavorites.filter(coin => {
        const symbolWithoutUSDT = coin.symbol.replace('USDT', '').toUpperCase();
        return !portfolio.has(symbolWithoutUSDT) && !portfolio.has(coin.symbol.toUpperCase());
      });

      setFavorites(cleanedFavorites);
      setFavoriteSymbols(new Set(cleanedFavorites.map(coin => coin.symbol)));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(cleanedFavorites));
      console.log(`📋 المجموع: ${cleanedFavorites.length} عملة في المفضلات`);
    };

    loadFavorites();
    
    // إعادة التحميل كل 30 ثانية للحصول على عملات البحث التلقائي الجديدة
    const interval = setInterval(loadFavorites, 30000);
    return () => clearInterval(interval);
  }, []);

  // إضافة إلى المفضلات
  const addFavorite = (coin: SearchCoin) => {
    if (!favoriteSymbols.has(coin.symbol)) {
      const updated = [...favorites, coin];
      setFavorites(updated);
      setFavoriteSymbols(new Set([...favoriteSymbols, coin.symbol]));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  };

  // حذف من المفضلات
  const removeFavorite = (symbol: string) => {
    const updated = favorites.filter(coin => coin.symbol !== symbol);
    setFavorites(updated);
    const newSymbols = new Set(favoriteSymbols);
    newSymbols.delete(symbol);
    setFavoriteSymbols(newSymbols);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  // التحقق من كون العملة مفضلة
  const isFavorite = (symbol: string) => {
    return favoriteSymbols.has(symbol);
  };

  // تبديل المفضلة
  const toggleFavorite = (coin: SearchCoin) => {
    if (isFavorite(coin.symbol)) {
      removeFavorite(coin.symbol);
    } else {
      addFavorite(coin);
    }
  };

  // المفضلات مرتبة من الأفضل للأسوأ
  const sortedFavorites = useMemo(() => {
    return [...favorites]
      .map(coin => ({
        ...coin,
        _score: calculateFavoriteScore(coin)
      }))
      .sort((a, b) => b._score - a._score);
  }, [favorites]);

  return {
    favorites,
    sortedFavorites,
    favoriteSymbols,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    count: favorites.length,
    calculateFavoriteScore,
    getRankBadge
  };
}
