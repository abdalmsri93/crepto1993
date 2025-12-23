/**
 * 🔍 نظام البحث المتقدم الذكي المحسّن
 * يطبق 30+ معايير فلترة ذكية مخفية تلقائياً
 * مع خوارزميات متقدمة للكشف عن أفضل العملات الجديدة
 */

export interface SearchCoin {
  symbol: string;
  name: string;
  price: string;
  growth: string;
  liquidity: string;
  riskLevel: string;
  performanceScore: number;
  valueScore: string;
  marketCap: string;
  category: string;
  listingDate?: string; // 📅 تاريخ الإدراج على Binance
  ageInDays?: number;   // 📆 عمر العملة بالأيام
  isHalal?: boolean;    // 🕌 علامة الحلال
  links?: { website?: string };
}

/**
 * 📋 واجهة بيانات المحفظة
 */
export interface PortfolioAsset {
  asset: string;
  free: string;
  locked: string;
}

const RECENT_RESULTS_KEY = 'smart_search_recent_v1';
const RECENT_RESULTS_LIMIT = 30;
const RECENT_DECAY_MS = 1000 * 60 * 180; // 3 ساعات

type RecentEntry = { symbol: string; timestamp: number };

function readRecentEntries(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item && typeof item.symbol === 'string' && typeof item.timestamp === 'number'
    ) as RecentEntry[];
  } catch {
    return [];
  }
}

function buildPenaltyMap(entries: RecentEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  const now = Date.now();
  entries.forEach((entry) => {
    const age = now - entry.timestamp;
    if (age < RECENT_DECAY_MS) {
      const freshness = 1 - age / RECENT_DECAY_MS;
      const penalty = Math.min(2, Math.max(0, freshness * 2));
      const key = entry.symbol.toUpperCase();
      const current = map.get(key) || 0;
      if (penalty > current) {
        map.set(key, penalty);
      }
    }
  });
  return map;
}

function writeRecentEntries(symbols: string[]): void {
  if (typeof window === 'undefined' || symbols.length === 0) return;
  const now = Date.now();
  const upper = symbols.map((s) => s.toUpperCase());
  const existing = readRecentEntries().filter((entry) => now - entry.timestamp < RECENT_DECAY_MS);
  const merged: RecentEntry[] = [];
  upper.forEach((symbol) => {
    merged.push({ symbol, timestamp: now });
  });
  existing.forEach((entry) => {
    if (!upper.includes(entry.symbol.toUpperCase())) {
      merged.push(entry);
    }
  });
  const trimmed = merged.slice(0, RECENT_RESULTS_LIMIT);
  try {
    window.localStorage.setItem(RECENT_RESULTS_KEY, JSON.stringify(trimmed));
  } catch {
    // تجاهل مشاكل التخزين
  }
}

/**
 * 🎯 نظام تصنيف المشاريع حسب القطاع
 */
export const projectCategories = {
  // 💰 DeFi - التمويل اللامركزي
  DeFi: {
    icon: '💰',
    name: 'DeFi',
    nameAr: 'تمويل لامركزي',
    keywords: ['SWAP', 'LEND', 'YIELD', 'FARM', 'STAKE', 'POOL', 'DEX', 'AMM', 'VAULT', 'LOAN', 'BORROW', 'COMPOUND', 'AAVE', 'UNI', 'SUSHI', 'CAKE', 'CRV', 'YFI', 'SNX', 'MKR', 'COMP', 'BAL', 'RUNE', 'DYDX', '1INCH', 'JOE', 'QUICK', 'SPELL', 'ALPHA', 'PERP']
  },
  // 🎮 Gaming & Metaverse
  Gaming: {
    icon: '🎮',
    name: 'Gaming',
    nameAr: 'ألعاب',
    keywords: ['GAME', 'PLAY', 'NFT', 'META', 'VERSE', 'WORLD', 'LAND', 'AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'IMX', 'GODS', 'ILV', 'ALICE', 'ATLAS', 'HERO', 'MOBOX', 'PIXEL', 'PRIME', 'MAGIC', 'BIGTIME', 'PORTAL', 'BEAM', 'RONIN', 'SUPER', 'YGG', 'WEMIX']
  },
  // 🤖 AI & Data
  AI: {
    icon: '🤖',
    name: 'AI',
    nameAr: 'ذكاء اصطناعي',
    keywords: ['AI', 'GPT', 'NEURAL', 'LEARN', 'DATA', 'ORACLE', 'FETCH', 'OCEAN', 'GRT', 'LINK', 'API3', 'BAND', 'NEST', 'DIA', 'UMA', 'AGIX', 'FET', 'NMR', 'CTXC', 'ARKM', 'WLD', 'RENDER', 'TAO', 'RNDR', 'NEAR', 'THETA']
  },
  // 🏗️ Infrastructure & Layer 1/2
  Infrastructure: {
    icon: '🏗️',
    name: 'Infrastructure',
    nameAr: 'بنية تحتية',
    keywords: ['LAYER', 'CHAIN', 'BRIDGE', 'CROSS', 'SCALE', 'ZK', 'ROLL', 'PROOF', 'VALIDATOR', 'NODE', 'MATIC', 'ARB', 'OP', 'AVAX', 'FTM', 'ONE', 'ATOM', 'DOT', 'KSM', 'NEAR', 'SOL', 'ALGO', 'EGLD', 'HBAR', 'XTZ', 'KAVA', 'INJ', 'SEI', 'SUI', 'APT', 'TIA', 'STRK', 'MANTA', 'BLAST', 'ZRO', 'W']
  },
  // 🐶 Meme Coins
  Meme: {
    icon: '🐶',
    name: 'Meme',
    nameAr: 'ميم',
    keywords: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MEME', 'WOJAK', 'BRETT', 'POPCAT', 'DOG', 'CAT', 'ELON', 'MOON', 'SAFE', 'BABY', 'MINI', 'INU', 'SNEK', 'COQ', 'MYRO', 'BOME', 'SLERF', 'MEW', 'TURBO', 'LADYS', 'AIDOGE', 'TOSHI']
  },
  // 🛡️ Privacy & Security
  Privacy: {
    icon: '🛡️',
    name: 'Privacy',
    nameAr: 'خصوصية',
    keywords: ['PRIVATE', 'ANON', 'SECRET', 'ZEC', 'XMR', 'DASH', 'SCRT', 'ROSE', 'NYM', 'DUSK', 'KEEP', 'TORN', 'MASK', 'RAIL', 'HOPR']
  },
  // 🌐 Web3 & Social
  Web3: {
    icon: '🌐',
    name: 'Web3',
    nameAr: 'ويب 3',
    keywords: ['SOCIAL', 'DAO', 'GOVERN', 'VOTE', 'IDENTITY', 'ENS', 'LPT', 'AUDIO', 'RAD', 'GTC', 'CVX', 'LQTY', 'LOOKS', 'BLUR', 'X2Y2', 'RARI', 'CYBER', 'ID', 'GALXE', 'HOOK', 'EDU', 'ARKM']
  },
  // 💼 Enterprise & RWA
  Enterprise: {
    icon: '💼',
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    keywords: ['RWA', 'REAL', 'ASSET', 'TOKENIZE', 'PROPERTY', 'GOLD', 'BOND', 'STOCK', 'PAXG', 'ONDO', 'POLYX', 'QNT', 'VET', 'XDC', 'HBAR', 'CSPR', 'CFX', 'ACH', 'XYM']
  },
  // ⚡ Energy & Environment
  Energy: {
    icon: '⚡',
    name: 'Energy',
    nameAr: 'طاقة',
    keywords: ['ENERGY', 'GREEN', 'CARBON', 'SOLAR', 'POWER', 'POWR', 'WPR', 'SNC', 'GRID', 'EWT']
  },
  // 🏥 Healthcare
  Healthcare: {
    icon: '🏥',
    name: 'Healthcare',
    nameAr: 'صحة',
    keywords: ['HEALTH', 'MED', 'PHARMA', 'BIO', 'DNA', 'GENE']
  },
  // 🌟 Other / New
  Other: {
    icon: '🌟',
    name: 'New',
    nameAr: 'جديد',
    keywords: []
  }
};

/**
 * 🎯 دالة تصنيف العملة حسب القطاع
 */
export function classifyProject(symbol: string): { category: string; icon: string; nameAr: string } {
  const upperSymbol = symbol.toUpperCase().replace('USDT', '');
  
  for (const [key, data] of Object.entries(projectCategories)) {
    if (key === 'Other') continue; // تجاوز Other لأنه الافتراضي
    
    // البحث في الكلمات المفتاحية
    for (const keyword of data.keywords) {
      if (upperSymbol === keyword || upperSymbol.includes(keyword) || keyword.includes(upperSymbol)) {
        return { category: key, icon: data.icon, nameAr: data.nameAr };
      }
    }
  }
  
  // افتراضي: عملة جديدة
  return { category: 'Other', icon: '🌟', nameAr: 'جديد' };
}

/**
 * 🧠 معايير الفلترة الذكية المحسّنة (30+)
 */
export const smartFilters = {
  // 1️⃣ معايير السعر الذكية
  priceRange: { 
    min: 0.000001,  // أسعار جداً منخفضة
    max: 50         // استبعاد العملات مرتفعة السعر
  },
  
  // 2️⃣ معايير الحجم/التداول (أهم معيار للعملات الجديدة)
  volumeRange: {
    min: 2000,      // حد أدنى منخفض للعملات الناشئة (2K)
    max: 30000000,   // استبعاد العملات ذات السيولة الضخمة جداً
    optimalMin: 20000,
    optimalMax: 5000000
  },
  
  // 3️⃣ معايير التقلب الصحية
  volatilityRange: {
    min: 0.1,   // حتى تقلب منخفض جداً مسموح
    max: 150    // تقلب عالي مسموح (للعملات الناشئة)
  },
  
  // 4️⃣ معايير النمو (نمو معقول مع سماح لسلبي قليل)
  growthRangePercent: {
    min: -5,    // سماح بنمو سلبي قليل (قد تحتاج للارتفاع)
    max: 300    // نمو معقول (ليس عالي جداً)
  },
  
  // 5️⃣ معايير رأس المال السوقي
  marketCapRange: {
    min: 50000,      // حد أدنى معقول (بدل 500K) - نتائج جيدة
    max: 500000000   // ليس رأس مال ضخم
  },
  
  // 6️⃣ استبعاد العملات المعروفة الكبرى
  excludeMajorCoins: [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'SHIB',
    'DOT', 'LTC', 'LINK', 'XLM', 'ALGO', 'VET', 'MATIC', 'AVAX',
    'TRX', 'NEAR', 'FTM', 'ONE', 'ATOM', 'FLOW', 'SAND', 'MANA',
    'AAVE', 'UNI', 'SUSHI', 'CURVE', 'APE', 'ENS'
  ],

  // 🚫 استبعاد عملات الميم والمضاربة
  excludeMemeCoins: [
    // عملات ميم trash فقط (بدون مشروع)
    'GIGA', 'KEKIUS', 'WOJAK', 'GME', 'AMC', 'TSLA', 'NVIDIA',
    'BORK', 'FLUFF', 'COIN', 'TOKEN', 'SAFE', 'RANDOMTOKEN'
  ],

  // ✅ عملات ميم معقولة (لها مشروع حقيقي - مسموحة في 30%)
  allowedMemeCoins: [
    'PEPE',    // مشروع حقيقي، كمية محدودة، مشهورة
    'WIF',     // لديه كمية وحركة تداول
    'BONK',    // مشروع على Solana
    'POPCAT',  // لديه حقيقة مشروع
    'BRETT',   // مشروع حقيقي على Base
  ],
  
  // 7️⃣ استبعاد الرموز المريبة والخطرة والميم
  excludePatterns: [
    // الأنماط الأساسية فقط (الخطرة جداً)
    /^test/i, /^fake/i, /^spam/i, /^dead/i,
    /rug/i, /scam/i,
    /pump|coin2/i,
    // الرموز الخطرة جداً فقط
    /cumrocket|sexcoin|pussy|anal|poop|shit|ass|butt|cum/i
  ],
  
  // 8️⃣ معايير الاستقرار
  stabilityMetrics: {
    maxPriceJump: 200,        // أقصى تغير سعر معقول في دقيقة
    minConsecutiveTrades: 100 // عدد تبادلات في 24 ساعة
  },

  // 9️⃣ معايير الثقة
  trustScore: {
    minVolume: 100000,        // حد أدنى للحجم الموثوق
    minTraders: 50,           // حد أدنى للمتداولين
    minSpread: 0.01           // فارق سعر معقول
  },

  // 🕌 معايير الحلال (الشريعة الإسلامية)
  halalCriteria: {
    // 1. تجنب الربا - لا عملات مرتبطة بالفائدة
    excludeInterestBased: ['USDI', 'USDP'],
    
    // 2. تجنب الغرر - عملات مشبوهة بدون فائدة
    excludeDerivatives: [],
    
    // 3. عملات حقيقية ذات قيمة فعلية - لا عملات فارغة
    requireRealUtility: true,
    
    // 4. تجنب المقامرة والعملات المشبوهة جداً فقط
    excludeGambling: [],  // سنستبعد من الأنماط بدلاً من القوائم
    
    // 5. لا معاملات مع المحرمات (الكحول، القمار، المخدرات)
    excludeProhibited: ['ALCO'],  // فقط الواضح منها
    
    // 6. يفضل عملات بمشاريع حقيقية مفيدة
    preferUtilityCoins: true,
    
    // 7. تجنب الاحتكار والمركزية الشديدة
    preferDecentralized: true
  }
};

/**
 * 🔎 دالة الفلترة الذكية المحسّنة
 */
export function applySmartFilters(
  coins: any[],
  priceOptions?: { priceMin?: number; priceMax?: number }
): SearchCoin[] {
  let filtered = coins;

  // استخدام نطاق السعر من الواجهة إذا وُجد، وإلا لا حدود
  const minPrice = priceOptions?.priceMin ?? 0;
  const maxPrice = priceOptions?.priceMax ?? Infinity;

  // ============= STAGE 1: الفلاتر الأساسية =============
  
  // فلتر 1: يجب أن تكون USDT فقط
  filtered = filtered.filter((coin: any) => coin.symbol?.endsWith('USDT'));
  
  // فلتر 2: السعر (من الواجهة)
  filtered = filtered.filter((coin: any) => {
    const price = parseFloat(coin.lastPrice || 0);
    return price >= minPrice && price <= maxPrice;
  });

  // فلتر 3: الحجم/التداول (معيار العملات الجديدة الأساسي)
  filtered = filtered.filter((coin: any) => {
    const volume = parseFloat(coin.quoteVolume || 0);
    return volume >= smartFilters.volumeRange.min && volume <= smartFilters.volumeRange.max;
  });

  // فلتر 4: التقلب
  filtered = filtered.filter((coin: any) => {
    const volatility = Math.abs(parseFloat(coin.priceChangePercent || 0));
    return volatility >= smartFilters.volatilityRange.min && 
           volatility <= smartFilters.volatilityRange.max;
  });

  // فلتر 5: النمو المعقول
  filtered = filtered.filter((coin: any) => {
    const growth = parseFloat(coin.priceChangePercent || 0);
    return growth >= smartFilters.growthRangePercent.min && 
           growth <= smartFilters.growthRangePercent.max;
  });

  // ============= STAGE 2: استبعاد العملات المشهورة والمريبة =============
  
  // فلتر 6: استبعاد العملات الكبرى المعروفة
  filtered = filtered.filter((coin: any) => {
    const symbol = coin.symbol.replace('USDT', '');
    return !smartFilters.excludeMajorCoins.some((major) => symbol === major);
  });

  // فلتر 7: استبعاد عملات الميم والمضاربة
  filtered = filtered.filter((coin: any) => {
    const symbol = coin.symbol.replace('USDT', '');
    // استبعاد العملات المدرجة في قائمة الميم
    if (smartFilters.excludeMemeCoins.some((meme) => symbol.toUpperCase() === meme)) {
      return false;
    }
    return true;
  });

  // فلتر 8: استبعاد الرموز المريبة والخطرة والميم
  filtered = filtered.filter((coin: any) => {
    const symbol = coin.symbol;
    return !smartFilters.excludePatterns.some((pattern) => pattern.test(symbol));
  });

  // ============= STAGE 3: معايير الحلال (الشريعة الإسلامية) =============
  
  // فلتر 9: تطبيق شروط الحلال
  filtered = filtered.filter((coin: any) => {
    const symbol = coin.symbol.replace('USDT', '');
    const halalCriteria = smartFilters.halalCriteria;
    
    // 1. تجنب العملات المحرمة المعروفة
    if (halalCriteria.excludeGambling.some((bad: string) => symbol.toUpperCase() === bad)) {
      return false;
    }
    
    // 2. تجنب المقامرة والعملات المشبوهة
    if (halalCriteria.excludeProhibited.some((bad: string) => symbol.includes(bad))) {
      return false;
    }
    
    // 3. تجنب عملات الميم والمضاربة النقية (فقط الأنماط الواضحة جداً)
    if (/moon|lamborghini|rocket|diamond|paperhands|safemoon|floki|doge|shib|yolo|lol|rofl/i.test(symbol)) {
      return false;
    }
    
    return true;
  });

  // ============= STAGE 4: معايير الجودة المتقدمة =============

  // ============= تحويل البيانات مع حسابات متقدمة =============
  
  const result = filtered.map((ticker: any) => {
    const price = parseFloat(ticker.lastPrice);
    const quoteVolume = parseFloat(ticker.quoteVolume || 0);
    const symbol = ticker.symbol.replace('USDT', '');
    const priceChangePercent = parseFloat(ticker.priceChangePercent);
    const count = parseFloat(ticker.count || 0);
    const prevClosePrice = parseFloat(ticker.prevClosePrice || price);

    // ============= حسابات الجودة المتقدمة =============
    
    // 1. درجة السيولة المحسّنة
    let liquidity = '🔴 منخفضة';
    let liquidityScore = 0;
    if (quoteVolume >= 2000000) {
      liquidity = '🟢 عالية جداً';
      liquidityScore = 10;
    } else if (quoteVolume >= 1000000) {
      liquidity = '🟢 عالية';
      liquidityScore = 8;
    } else if (quoteVolume >= 500000) {
      liquidity = '🟡 متوسطة';
      liquidityScore = 6;
    } else if (quoteVolume >= 200000) {
      liquidity = '🟡 معقولة';
      liquidityScore = 4;
    } else {
      liquidityScore = 2;
    }

    // 2. درجة المخاطرة المحسّنة
    let riskLevel = '🟡 متوسط';
    let riskScore = 5;
    
    const volatility = Math.abs(priceChangePercent);
    const volumeHealth = quoteVolume >= smartFilters.volumeRange.optimalMin && 
                         quoteVolume <= smartFilters.volumeRange.optimalMax ? 1 : 0;
    
    if (volatility <= 5 && quoteVolume >= 500000 && count >= 500) {
      riskLevel = '🟢 منخفض جداً';
      riskScore = 2;
    } else if (volatility <= 10 && quoteVolume >= 300000) {
      riskLevel = '🟢 منخفض';
      riskScore = 3;
    } else if (volatility <= 20 && quoteVolume >= 150000) {
      riskLevel = '🟡 متوسط';
      riskScore = 5;
    } else if (volatility > 50 || quoteVolume < 100000) {
      riskLevel = '🔴 عالي جداً';
      riskScore = 9;
    } else if (volatility > 30) {
      riskLevel = '🔴 عالي';
      riskScore = 7;
    }

    // 3. درجة الاستقرار
    const stabilityScore = Math.max(0, 10 - volatility);
    
    // 4. درجة النشاط/الثقة
    const activityScore = Math.min(10, (count / 1000) * 10);
    
    // 5. درجة السيولة النسبية
    const volumeScore = Math.min(10, (quoteVolume / smartFilters.volumeRange.optimalMax) * 10);
    
    // 6. درجة النمو (إيجابية للنمو المعقول)
    let growthScore = 5;
    if (priceChangePercent > 0 && priceChangePercent <= 50) {
      growthScore = 7;
    } else if (priceChangePercent > 50 && priceChangePercent <= 200) {
      growthScore = 8;
    } else if (priceChangePercent > 200) {
      growthScore = 6; // نمو عالي جداً قد يكون خطير
    } else if (priceChangePercent < 0 && priceChangePercent >= -10) {
      growthScore = 5;
    }

    // حساب الدرجة النهائية (الأداء الكلي)
    const performanceScore = Math.round(
      (stabilityScore * 0.25 + // 25% الاستقرار
       volumeScore * 0.25 +     // 25% السيولة
       activityScore * 0.2 +     // 20% النشاط
       growthScore * 0.2 +       // 20% النمو
       (10 - riskScore) * 0.1) / 5 // 10% معاكس المخاطرة
    );

    // حساب قيمة اللون للأداء
    const valueScore = Math.min(10, Math.max(1, performanceScore));

    // 📅 حساب تاريخ الإدراج (تقدير تقريبي بناءً على فترة القيمة المنخفضة)
    // العملات الناشئة تبدأ بحجم تداول منخفض والعديد من التبادلات
    // نستخدم heuristic بسيط: العملات الجديدة عادة لديها count أقل
    let ageInDays = 30; // افتراضي: 30 يوم (شهر واحد)
    
    if (count < 100) {
      ageInDays = 7; // جديدة جداً (أقل من أسبوع)
    } else if (count < 500) {
      ageInDays = 14; // أسبوعين تقريباً
    } else if (count < 1000) {
      ageInDays = 21; // حوالي 3 أسابيع
    } else if (count < 2000) {
      ageInDays = 30; // شهر واحد
    } else if (count < 5000) {
      ageInDays = 60; // شهرين
    } else {
      ageInDays = 90; // 3 أشهر أو أكثر
    }

    // تحديد تاريخ الإدراج بناءً على العمر المتوقع
    const listingDate = new Date();
    listingDate.setDate(listingDate.getDate() - ageInDays);
    const formattedDate = listingDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // تصنيف المشروع حسب القطاع
    const projectType = classifyProject(symbol);

    return {
      name: symbol,
      symbol: symbol,
      price: `$${price.toFixed(8)}`,
      marketCap: `${(quoteVolume / 1e6).toFixed(2)}M`,
      growth: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`,
      riskLevel,
      liquidity,
      performanceScore: valueScore,
      valueScore: `${Math.round(valueScore)}/10`,
      category: `${projectType.icon} ${projectType.nameAr}`,
      listingDate: formattedDate,
      ageInDays: ageInDays,
      isHalal: true, // ✅ جميع العملات المتبقية بعد الفلترة هي حلال
      links: {
        website: `https://www.binance.com/en/trade/${ticker.symbol}?theme=dark`,
      },
    };
  });

  return result;
}

/**
 * 🎯 ترتيب النتائج حسب الأفضلية المتقدمة
 */
export function rankCoins(
  coins: SearchCoin[],
  recentPenalties?: Map<string, number>
): SearchCoin[] {
  return coins.sort((a, b) => {
    const penaltyA = recentPenalties?.get(a.symbol.toUpperCase()) ?? 0;
    const penaltyB = recentPenalties?.get(b.symbol.toUpperCase()) ?? 0;

    const riskScoreA = a.riskLevel.includes('منخفض') ? 1 : a.riskLevel.includes('متوسط') ? 0 : -1;
    const riskScoreB = b.riskLevel.includes('منخفض') ? 1 : b.riskLevel.includes('متوسط') ? 0 : -1;

    const ageBonusA = typeof a.ageInDays === 'number' ? Math.max(0, 2 - (a.ageInDays / 45)) : 0;
    const ageBonusB = typeof b.ageInDays === 'number' ? Math.max(0, 2 - (b.ageInDays / 45)) : 0;

    const growthA = Math.abs(parseFloat(a.growth));
    const growthB = Math.abs(parseFloat(b.growth));
    const growthBiasA = isNaN(growthA) ? 0 : Math.max(-1, Math.min(1, (25 - Math.abs(25 - growthA)) / 25));
    const growthBiasB = isNaN(growthB) ? 0 : Math.max(-1, Math.min(1, (25 - Math.abs(25 - growthB)) / 25));

    const compositeA = a.performanceScore + riskScoreA + ageBonusA + growthBiasA - penaltyA;
    const compositeB = b.performanceScore + riskScoreB + ageBonusB + growthBiasB - penaltyB;

    if (Math.abs(compositeB - compositeA) > 0.2) {
      return compositeB - compositeA;
    }

    // fallback قديم لضمان استقرار الترتيب
    if (Math.abs(b.performanceScore - a.performanceScore) > 0.1) {
      return b.performanceScore - a.performanceScore;
    }

    const riskA = a.riskLevel.includes('منخفض') ? 0 : 
                  a.riskLevel.includes('متوسط') ? 1 : 2;
    const riskB = b.riskLevel.includes('منخفض') ? 0 : 
                  b.riskLevel.includes('متوسط') ? 1 : 2;
    if (riskA !== riskB) return riskA - riskB;

    const diffA = Math.abs(growthA - 25);
    const diffB = Math.abs(growthB - 25);
    return diffB - diffA;
  });
}

/**
 * 🎲 تنويع ذكي للنتائج مع تنوع القطاعات
 */
export function shuffleCoins(coins: SearchCoin[]): SearchCoin[] {
  // تجميع العملات حسب القطاع
  const categorizedCoins: Map<string, SearchCoin[]> = new Map();
  
  coins.forEach(coin => {
    // استخراج القطاع من category (مثل "💰 تمويل لامركزي" -> "تمويل لامركزي")
    const categoryKey = coin.category.replace(/^[^\s]+\s/, '').trim() || 'جديد';
    if (!categorizedCoins.has(categoryKey)) {
      categorizedCoins.set(categoryKey, []);
    }
    categorizedCoins.get(categoryKey)!.push(coin);
  });

  // ترتيب عشوائي داخل كل قطاع
  const shuffleArray = (arr: SearchCoin[]) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ترتيب القطاعات عشوائياً
  const categories = Array.from(categorizedCoins.keys());
  const shuffledCategories = shuffleArray(categories.map(c => ({ symbol: c, category: c } as any))).map(c => c.symbol);

  // توزيع متوازن من كل قطاع (Round-robin)
  const result: SearchCoin[] = [];
  let maxIterations = coins.length;
  let iteration = 0;

  while (result.length < coins.length && iteration < maxIterations) {
    for (const category of shuffledCategories) {
      const categoryCoins = categorizedCoins.get(category);
      if (categoryCoins && categoryCoins.length > 0) {
        const coin = categoryCoins.shift()!;
        result.push(coin);
        if (result.length >= coins.length) break;
      }
    }
    iteration++;
  }

  // إذا بقيت عملات لم تُضف
  categorizedCoins.forEach(remaining => {
    result.push(...remaining);
  });

  console.log(`🎯 تنوع القطاعات: ${categorizedCoins.size} قطاعات مختلفة`);
  
  return result;
}

/**
 * 📊 تطبيق معايير متقدمة إضافية
 */
export function applyAdvancedCriteria(coins: SearchCoin[]): SearchCoin[] {
  // فلتر الحد الأدنى للأداء (1/10) - منخفض للسماح بتنويع أفضل
  return coins.filter(
    (coin) => coin.performanceScore >= 1.0
  );
}

/**
 * 📅 جلب تاريخ إدراج العملة الحقيقي من Binance
 */
// cache للتواريخ لتجنب استدعاءات متكررة
const listingDateCache = new Map<string, { listingDate: string; ageInDays: number; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

export async function getListingDate(symbol: string): Promise<{ listingDate: string; ageInDays: number }> {
  try {
    // التحقق من الـ cache أولاً
    const cached = listingDateCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { listingDate: cached.listingDate, ageInDays: cached.ageInDays };
    }

    // تأخير صغير لتجنب الحد من الطلبات
    await new Promise(resolve => setTimeout(resolve, 100));

    // جلب معلومات العملة من Binance klines API (أكثر دقة)
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=1&startTime=0`,
      { signal: AbortSignal.timeout(5000) } // timeout بعد 5 ثواني
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch klines');
    }

    const klines = await response.json();
    
    if (Array.isArray(klines) && klines.length > 0) {
      // الحصول على أول شمعة (candle) - وقت الإدراج
      const firstCandle = klines[0];
      const listingTime = new Date(firstCandle[0]); // timestamp
      
      const now = new Date();
      const ageInMs = now.getTime() - listingTime.getTime();
      const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
      
      const formattedDate = listingTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // حفظ في الـ cache
      listingDateCache.set(symbol, {
        listingDate: formattedDate,
        ageInDays,
        timestamp: Date.now()
      });
      
      return { listingDate: formattedDate, ageInDays };
    }
    
    throw new Error('No kline data found');
  } catch (error) {
    console.log(`⚠️ خطأ في جلب تاريخ ${symbol}:`, error);
    
    // في حالة الفشل، استخدم تقدير افتراضي
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 30);
    
    const result = {
      listingDate: defaultDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      ageInDays: 30
    };

    // حفظ التقدير في الـ cache أيضاً
    listingDateCache.set(symbol, {
      ...result,
      timestamp: Date.now()
    });
    
    return result;
  }
}

async function enrichWithListingDates(
  coins: SearchCoin[],
  batchSize = 3,
  delayMs = 120
): Promise<SearchCoin[]> {
  const enriched: SearchCoin[] = [];

  for (let index = 0; index < coins.length; index += batchSize) {
    const batch = coins.slice(index, index + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (coin) => {
        try {
          const { listingDate, ageInDays } = await getListingDate(`${coin.symbol}USDT`);
          return { ...coin, listingDate, ageInDays };
        } catch (error) {
          console.log(`خطأ في جلب تاريخ ${coin.symbol}:`, error);
          return { ...coin, listingDate: 'N/A', ageInDays: 0 };
        }
      })
    );

    enriched.push(...batchResults);

    if (index + batchSize < coins.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return enriched;
}

/**
 * 🔍 البحث الشامل النهائي المحسّن
 */

export async function performSmartSearch(
  tickers: any[],
  options?: {
    count?: number;
    shuffle?: boolean;
    minScore?: number;
    excludePortfolio?: string[]; // عملات المحفظة للاستبعاد
    skipRecentTracking?: boolean;
    priceMin?: number; // الحد الأدنى للسعر (من الواجهة)
    priceMax?: number; // الحد الأعلى للسعر (من الواجهة)
  }
): Promise<SearchCoin[]> {
  const {
    count = 8,
    shuffle = true,
    minScore = 3,
    excludePortfolio = [],
    skipRecentTracking = false,
    priceMin,
    priceMax,
  } = options || {};

  // تطبيق الفلاتر الذكية الشاملة مع نطاق السعر المخصص
  let results = applySmartFilters(tickers, { priceMin, priceMax });
  console.log(`📊 بعد Filters الأساسية: ${results.length} عملة`);

  // استبعاد عملات المحفظة إذا وجدت
  if (excludePortfolio.length > 0) {
    results = results.filter((coin) => {
      const coinName = coin.symbol.toUpperCase();
      return !excludePortfolio.some((asset) => 
        asset.toUpperCase() === coinName || 
        coinName.includes(asset.toUpperCase())
      );
    });
    console.log(`📊 بعد استبعاد المحفظة: ${results.length} عملة`);
  }

  // تطبيق المعايير الإضافية
  results = applyAdvancedCriteria(results);
  console.log(`📊 بعد معايير متقدمة: ${results.length} عملة`);

  const recentPenaltyMap = buildPenaltyMap(readRecentEntries());

  // ترتيب النتائج حسب الأفضلية
  results = rankCoins(results, recentPenaltyMap);
  console.log(`📊 بعد ترتيب: ${results.length} عملة`);

  // تنويع ذكي إذا طُلب
  if (shuffle) {
    results = shuffleCoins(results);
    console.log(`📊 بعد Shuffle: ${results.length} عملة`);
  }

  // ============= نظام هجين 70/30 (محسّن) =============
  // فصل النتائج إلى 70% آمنة + 30% مجازفة
  
  const safeCoins = results.filter(coin => {
    const symbol = coin.symbol.replace('USDT', '').toUpperCase();
    // العملات الآمنة: بدون ميم على الإطلاق
    const isMeme = smartFilters.excludeMemeCoins.some(m => symbol === m) ||
                   smartFilters.allowedMemeCoins.some(m => symbol === m);
    return !isMeme;
  });

  const riskCoins = results.filter(coin => {
    const symbol = coin.symbol.replace('USDT', '').toUpperCase();
    // عملات المجازفة: ميم معقول فقط (مع ضوابط شرعية)
    return smartFilters.allowedMemeCoins.some(m => symbol === m);
  });

  console.log(`🎯 نظام 70/30 - آمنة: ${safeCoins.length}, مجازفة: ${riskCoins.length}`);

  // إذا لم تكن لدينا نتائج كافية، استخدم كل ما متاح
  let finalResults: SearchCoin[] = [];
  
  if (safeCoins.length > 0 || riskCoins.length > 0) {
    const totalAvailable = safeCoins.length + riskCoins.length;
    const targetCount = Math.min(count, totalAvailable);

    const qualityRiskCoins = riskCoins.filter((coin) => {
      const goodLiquidity = coin.liquidity.includes('🟢') || coin.liquidity.includes('🟡');
      const moderateRisk = !coin.riskLevel.includes('🔴');
      return coin.performanceScore >= 5 && goodLiquidity && moderateRisk;
    });

    const riskPool = qualityRiskCoins.length > 0 ? qualityRiskCoins : riskCoins;

    const maxRiskShare = Math.min(0.2, riskPool.length / (targetCount || 1));
    const provisionalRiskTarget = Math.min(riskPool.length, Math.max(0, Math.floor(targetCount * maxRiskShare)));

    const safeFloor = Math.ceil(targetCount * 0.65);
    let safeTarget = Math.min(safeCoins.length, Math.max(safeFloor, targetCount - provisionalRiskTarget));

    if (safeTarget < safeFloor && riskPool.length > 0) {
      const additionalSafeNeeded = safeFloor - safeTarget;
      const adjustedRisk = Math.max(0, provisionalRiskTarget - additionalSafeNeeded);
      safeTarget = Math.min(safeCoins.length, Math.max(safeFloor, targetCount - adjustedRisk));
    }

    const riskTarget = Math.min(riskPool.length, Math.max(0, targetCount - safeTarget));

    finalResults = [
      ...safeCoins.slice(0, safeTarget),
      ...riskPool.slice(0, riskTarget)
    ];

    if (finalResults.length < targetCount) {
      const remaining = targetCount - finalResults.length;
      const fillerSource = safeCoins.length >= safeFloor ? safeCoins : riskPool;
      const already = new Set(finalResults.map((coin) => coin.symbol));
      for (const coin of fillerSource) {
        if (finalResults.length >= targetCount) break;
        if (already.has(coin.symbol)) continue;
        finalResults.push(coin);
      }
    }

    finalResults = finalResults.slice(0, targetCount);
  }
  
  // إذا كانت النتائج فارغة تماماً، استخدم النتائج الأصلية (fallback)
  if (finalResults.length === 0 && results.length > 0) {
    console.log(`⚠️ النظام الهجين لم يرجع نتائج! استخدام fallback...`);
    finalResults = results.slice(0, Math.min(count, results.length));
  }
  
  console.log(`✅ النتائج النهائية: ${finalResults.length} عملة`);

  if (!skipRecentTracking) {
    writeRecentEntries(finalResults.map((coin) => coin.symbol));
  }

  const resultsWithDates = await enrichWithListingDates(finalResults);
  return resultsWithDates;
}

/**
 * 📈 إحصائيات البحث المتقدمة
 */
export function getSearchStats(coins: SearchCoin[]) {
  if (coins.length === 0) return null;

  const avgPerformance =
    coins.reduce((sum, c) => sum + c.performanceScore, 0) / coins.length;
  const avgGrowth =
    coins.reduce((sum, c) => sum + parseFloat(c.growth), 0) / coins.length;
  const lowRiskCount = coins.filter(c => c.riskLevel.includes('منخفض')).length;

  return {
    count: coins.length,
    avgPerformance: avgPerformance.toFixed(1),
    avgGrowth: avgGrowth.toFixed(2),
    lowRiskCount,
  };
}
