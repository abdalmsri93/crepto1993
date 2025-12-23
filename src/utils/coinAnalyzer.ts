// 🔧 محلل العملات الذكي - حسابات درجة الثقة وتصفية العملات

export interface Coin {
  name: string;
  symbol: string;
  price: string;
  growth: string;
  riskLevel: string;
  liquidity: string;
  performanceScore: number;
  marketCap?: string;
  volume?: number;
  quoteVolume?: number;
  priceChangePercent?: number;
  [key: string]: any;
}

/**
 * حساب درجة ثقة العملة بناءً على 10 معايير
 * @param coin - بيانات العملة
 * @param allCoins - جميع العملات (للمقارنة)
 * @returns درجة ثقة من 0-100
 */
export function calculateConfidenceScore(coin: Coin, allCoins: Coin[] = []): number {
  let score = 0;

  // 1️⃣ النمو (20%)
  const growthValue = parseFloat(coin.growth || "0");
  const growthScore = Math.min(10, Math.max(0, (growthValue + 10) / 2)) * 0.20;
  score += growthScore;

  // 2️⃣ الاستقرار (20%) - كلما كان التغير أقل، كان أكثر استقراراً
  const volatility = Math.abs(parseFloat(coin.growth || "0"));
  const stabilityScore = Math.max(0, 10 - (volatility / 3)) * 0.20;
  score += stabilityScore;

  // 3️⃣ السيولة (15%)
  let liquidityScore = 0;
  if (coin.liquidity?.includes("عالية")) {
    liquidityScore = 10 * 0.15;
  } else if (coin.liquidity?.includes("متوسطة")) {
    liquidityScore = 7 * 0.15;
  } else if (coin.liquidity?.includes("منخفضة")) {
    liquidityScore = 3 * 0.15;
  }
  score += liquidityScore;

  // 4️⃣ المخاطرة (15%) - العملات الآمنة تأخذ درجة أعلى
  let riskScore = 0;
  if (coin.riskLevel?.includes("منخفض")) {
    riskScore = 10 * 0.15;
  } else if (coin.riskLevel?.includes("متوسط")) {
    riskScore = 7 * 0.15;
  } else if (coin.riskLevel?.includes("عالي")) {
    riskScore = 3 * 0.15;
  }
  score += riskScore;

  // 5️⃣ الأداء (10%)
  const perfScore = (coin.performanceScore || 5) / 10;
  score += perfScore * 0.10;

  // 6️⃣ Market Cap (10%) - العملات الكبيرة أكثر أماناً
  const marketCapStr = coin.marketCap || "";
  let marketCapScore = 0;
  if (marketCapStr.includes("B")) {
    const billion = parseFloat(marketCapStr);
    if (billion >= 1) {
      marketCapScore = 10 * 0.10;
    } else if (billion >= 0.1) {
      marketCapScore = 8 * 0.10;
    } else {
      marketCapScore = 5 * 0.10;
    }
  } else if (marketCapStr.includes("M")) {
    marketCapScore = 3 * 0.10;
  }
  score += marketCapScore;

  // 7️⃣ التوافق الشرعي (5%)
  const shariahScore = (coin.shariaCompliance?.includes("✅") ? 10 : 3) * 0.05;
  score += shariahScore;

  // 8️⃣ التوصية (5%) - توصية "شراء" = ثقة أعلى
  let recommendationScore = 0;
  if (coin.recommendation?.includes("شراء")) {
    recommendationScore = 10 * 0.05;
  } else if (coin.recommendation?.includes("احتفاظ")) {
    recommendationScore = 7 * 0.05;
  } else {
    recommendationScore = 3 * 0.05;
  }
  score += recommendationScore;

  // 9️⃣ قيمة الأداء (5%)
  const valueScore = parseFloat(coin.valueScore || "5");
  score += (valueScore / 10) * 0.05;

  // 🔟 الحجم النسبي (5%) - الحجم العالي يعني اهتمام أكثر
  const quoteVolume = coin.quoteVolume || 0;
  let volumeScore = 0;
  if (quoteVolume > 100000000) {
    volumeScore = 10 * 0.05;
  } else if (quoteVolume > 50000000) {
    volumeScore = 8 * 0.05;
  } else if (quoteVolume > 10000000) {
    volumeScore = 5 * 0.05;
  } else {
    volumeScore = 2 * 0.05;
  }
  score += volumeScore;

  return Math.round(Math.min(100, Math.max(0, score * 10)));
}

/**
 * تطبيق الفلاتر المتقدمة تلقائياً
 * @param coins - قائمة العملات
 * @param advancedFilters - الفلاتر المتقدمة
 * @returns العملات المفلترة
 */
export function applySmartFiltering(coins: Coin[], advancedFilters: any = {}): Coin[] {
  let filtered = [...coins];

  // الفلاتر الافتراضية
  const defaults = {
    marketCap: 100_000_000,
    volume24h: 5_000_000,
    liquidityScore: 5,
    volatility: 15,
    riskLevels: ["منخفض", "متوسط"],
    ranking: 1000,
    shariaCompliance: true,
    ...advancedFilters,
  };

  // تطبيق فلاتر Market Cap
  filtered = filtered.filter((coin: Coin) => {
    const volume = parseFloat(coin.marketCap || "0") * 1e6;
    return volume >= defaults.marketCap;
  });

  // تطبيق فلاتر السيولة
  filtered = filtered.filter((coin: Coin) => {
    if (defaults.liquidityScore <= 3) {
      return coin.liquidity?.includes("عالية");
    } else if (defaults.liquidityScore <= 6) {
      return coin.liquidity?.includes("عالية") || coin.liquidity?.includes("متوسطة");
    }
    return true;
  });

  // تطبيق فلاتر مستوى المخاطرة
  filtered = filtered.filter((coin: Coin) => {
    for (let risk of defaults.riskLevels) {
      if (coin.riskLevel?.includes(risk)) {
        return true;
      }
    }
    return false;
  });

  // تطبيق التوافق الشرعي
  if (defaults.shariaCompliance) {
    filtered = filtered.map((coin: Coin) => ({
      ...coin,
      shariaCompliance: "✅ متوافق شرعياً",
    }));
  }

  return filtered;
}

/**
 * تصفية العملات حسب السعر المناسب للاستثمار
 * @param coins - قائمة العملات
 * @param investmentAmount - مبلغ الاستثمار
 * @param coinCount - عدد العملات المراد شراؤها
 * @returns العملات المناسبة للسعر
 */
export function filterByInvestmentAmount(
  coins: Coin[],
  investmentAmount: number,
  coinCount: number = 5
): Coin[] {
  if (!investmentAmount || investmentAmount <= 0) {
    return coins;
  }

  // حساب السعر المناسب للعملة الواحدة
  const appropriatePrice = investmentAmount / coinCount;

  // تصفية العملات بناءً على السعر
  return coins.filter((coin: Coin) => {
    const price = parseFloat(coin.price || "0");
    // السعر يجب أن يكون معقول للاستثمار
    // نسمح بـ ±200% من السعر المناسب
    return price <= appropriatePrice * 3 && price > 0;
  });
}

/**
 * اختيار أفضل عملة واحدة فقط
 * @param coins - قائمة العملات
 * @param allCoins - جميع العملات (للمقارنة)
 * @returns أفضل عملة أو null
 */
export function findBestCoin(coins: Coin[], allCoins: Coin[] = []): Coin | null {
  if (coins.length === 0) {
    return null;
  }

  // حساب درجة الثقة لكل عملة
  const coinsWithScores = coins.map((coin) => ({
    ...coin,
    confidenceScore: calculateConfidenceScore(coin, allCoins),
  }));

  // ترتيب حسب الدرجة وأخذ الأفضل
  const sorted = coinsWithScores.sort(
    (a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0)
  );

  return sorted[0] || null;
}

/**
 * الحصول على أفضل N عملات
 * @param coins - قائمة العملات
 * @param count - عدد العملات المطلوبة
 * @param allCoins - جميع العملات (للمقارنة)
 * @returns أفضل N عملات
 */
export function getTopCoins(coins: Coin[], count: number = 5, allCoins: Coin[] = []): Coin[] {
  // حساب درجة الثقة لكل عملة
  const coinsWithScores = coins.map((coin) => ({
    ...coin,
    confidenceScore: calculateConfidenceScore(coin, allCoins),
  }));

  // ترتيب حسب الدرجة
  const sorted = coinsWithScores.sort(
    (a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0)
  );

  return sorted.slice(0, Math.min(count, sorted.length));
}

/**
 * الحصول على رسالة توضيح لماذا هذه العملة أفضل
 * @param coin - بيانات العملة
 * @param score - درجة الثقة
 * @returns رسالة توضيح
 */
export function getBestCoinReason(coin: Coin, score: number): string {
  const reasons: string[] = [];

  // التحقق من النمو
  const growth = parseFloat(coin.growth || "0");
  if (growth > 5) {
    reasons.push("نمو قوي جداً");
  } else if (growth > 2) {
    reasons.push("نمو إيجابي");
  }

  // التحقق من الاستقرار
  if (Math.abs(growth) < 5) {
    reasons.push("استقرار عالي");
  }

  // التحقق من السيولة
  if (coin.liquidity?.includes("عالية")) {
    reasons.push("سيولة عالية");
  }

  // التحقق من المخاطرة
  if (coin.riskLevel?.includes("منخفض")) {
    reasons.push("مخاطرة منخفضة");
  }

  // التحقق من Market Cap
  if (coin.marketCap?.includes("B")) {
    reasons.push("قيمة سوقية كبيرة");
  }

  // التحقق من التوصية
  if (coin.recommendation?.includes("شراء")) {
    reasons.push("توصية شراء");
  }

  if (reasons.length === 0) {
    reasons.push("أداء جيدة مقارنة بالعملات الأخرى");
  }

  return reasons.slice(0, 3).join(" + ");
}
