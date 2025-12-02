// نظام حسابات التوصيات المحسّن - Advanced Recommendation Engine

export interface AdvancedRecommendationData {
  symbol: string;
  technicalScore: number;        // 0-100: مؤشرات فنية
  fundamentalScore: number;      // 0-100: أساسيات المشروع
  sentimentScore: number;        // 0-100: معنويات السوق
  riskScore: number;            // 0-100: تقييم المخاطر
  volatilityScore: number;       // 0-100: تقلب الأسعار
  volumeScore: number;           // 0-100: حجم التداول
  adoptionScore: number;         // 0-100: معدل الاعتماد
  
  overallScore: number;          // 0-100: الدرجة الإجمالية
  confidence: number;            // 0-100: درجة الثقة
  
  recommendation: "تعزيز" | "احتفاظ" | "تقليص" | "إيقاف";
  strength: "قوية جداً" | "قوية" | "معتدلة" | "ضعيفة";
  
  buySignals: string[];
  sellSignals: string[];
  riskFactors: string[];
  
  priceTargets: {
    short_term: string;          // 1-3 أشهر
    medium_term: string;          // 3-12 شهر
    long_term: string;            // 1+ سنة
  };
  
  timing: "شراء فوري" | "انتظر انخفاض" | "انتظر ارتفاع" | "تجنب الآن";
  
  alternativeCoins: string[];     // عملات بديلة إذا لم تكن جاهزة
}

// حساب درجات المؤشرات التقنية
export function calculateTechnicalScore(
  priceChangePercent: number,
  movingAveragePosition: number,  // -1: تحت | 0: محايد | 1: فوق
  rsi: number,                    // 0-100
  macd: number,                   // -1: سالب | 0: محايد | 1: موجب
  bollingerBandPosition: number,  // -1: تحت | 0: وسط | 1: فوق
  volume: number                  // -1: منخفض | 0: محايد | 1: مرتفع
): number {
  let score = 50; // البداية من المنتصف
  
  // تأثير السعر (0-20 نقطة)
  score += priceChangePercent > 5 ? 15 : 
           priceChangePercent > 0 ? 8 : 
           priceChangePercent > -5 ? 2 : 0;
  
  // تأثير المتوسطات المتحركة (0-15 نقطة)
  score += movingAveragePosition === 1 ? 15 : 
           movingAveragePosition === 0 ? 8 : 0;
  
  // تأثير RSI (0-20 نقطة)
  score += rsi > 70 ? 5 :        // فوق الحد الأقصى (بيع محتمل)
           rsi > 60 ? 15 :        // قوي
           rsi > 40 ? 12 :        // معتدل
           rsi > 30 ? 8 :         // ضعيف
           5;                      // تحت الحد الأدنى (شراء محتمل)
  
  // تأثير MACD (0-15 نقطة)
  score += macd === 1 ? 15 : macd === 0 ? 8 : 0;
  
  // تأثير Bollinger Bands (0-15 نقطة)
  score += bollingerBandPosition === 1 ? 5 :  // محاذير ارتفاع
           bollingerBandPosition === 0 ? 15 : // معتدل
           10;                                 // انخفاض محتمل
  
  // تأثير حجم التداول (0-15 نقطة)
  score += volume === 1 ? 15 : volume === 0 ? 8 : 0;
  
  return Math.min(100, Math.max(0, score));
}

// حساب درجة الأساسيات
export function calculateFundamentalScore(
  teamStrength: number,          // 0-100
  projectMaturity: number,        // 0-100: العمر والاستقرار
  communitySize: number,          // 0-100: حجم المجتمع
  adoptionRate: number,           // 0-100: معدل الاعتماد
  useCaseValidity: number,        // 0-100: صحة الفكرة
  competitionLevel: number        // 0-100: مستوى المنافسة (أقل = أفضل)
): number {
  const weights = {
    teamStrength: 0.25,
    projectMaturity: 0.20,
    communitySize: 0.15,
    adoptionRate: 0.25,
    useCaseValidity: 0.10,
    competitionLevel: 0.05
  };
  
  return (
    teamStrength * weights.teamStrength +
    projectMaturity * weights.projectMaturity +
    communitySize * weights.communitySize +
    adoptionRate * weights.adoptionRate +
    useCaseValidity * weights.useCaseValidity +
    (100 - competitionLevel) * weights.competitionLevel
  );
}

// حساب درجة المعنويات
export function calculateSentimentScore(
  newsScore: number,             // 0-100: الأخبار الإيجابية
  socialMediaScore: number,       // 0-100: تفاعل وسائل التواصل
  whaleActivityScore: number,     // 0-100: نشاط الحيتان
  institutionalInterest: number   // 0-100: اهتمام المؤسسات
): number {
  const weights = {
    news: 0.30,
    socialMedia: 0.25,
    whaleActivity: 0.25,
    institutional: 0.20
  };
  
  return (
    newsScore * weights.news +
    socialMediaScore * weights.socialMedia +
    whaleActivityScore * weights.whaleActivity +
    institutionalInterest * weights.institutional
  );
}

// حساب درجة المخاطر
export function calculateRiskScore(
  regulatoryRisk: number,        // 0-100: خطر تنظيمي
  technicalRisk: number,         // 0-100: خطر تقني
  marketRisk: number,            // 0-100: خطر سوقي
  concentrationRisk: number,     // 0-100: خطر التركيز
  liquidityRisk: number          // 0-100: خطر السيولة
): number {
  const weights = {
    regulatory: 0.20,
    technical: 0.20,
    market: 0.30,
    concentration: 0.15,
    liquidity: 0.15
  };
  
  return (
    regulatoryRisk * weights.regulatory +
    technicalRisk * weights.technical +
    marketRisk * weights.market +
    concentrationRisk * weights.concentration +
    liquidityRisk * weights.liquidity
  );
}

// حساب درجة التقلب
export function calculateVolatilityScore(
  dailyVolatility: number,       // النسبة المئوية
  weeklyVolatility: number,      // النسبة المئوية
  monthlyVolatility: number      // النسبة المئوية
): number {
  // تقلب مرتفع = درجة منخفضة (أكثر خطورة)
  const avgVolatility = (dailyVolatility + weeklyVolatility + monthlyVolatility) / 3;
  
  // تحويل التقلب إلى درجة (أقل = أفضل للاستقرار)
  return Math.max(0, 100 - (avgVolatility * 2));
}

// حساب درجة حجم التداول
export function calculateVolumeScore(
  currentVolume: number,
  averageVolume: number,
  volumeTrend: "increasing" | "stable" | "decreasing"
): number {
  let score = 50;
  
  // مقارنة الحجم الحالي بالمتوسط
  const volumeRatio = currentVolume / averageVolume;
  score += volumeRatio > 1.5 ? 30 : 
           volumeRatio > 1 ? 20 : 
           volumeRatio > 0.7 ? 10 : -20;
  
  // اتجاه الحجم
  score += volumeTrend === "increasing" ? 15 :
           volumeTrend === "stable" ? 0 : -15;
  
  return Math.min(100, Math.max(0, score));
}

// حساب درجة الاعتماد
export function calculateAdoptionScore(
  newAddresses: number,          // عدد العناوين الجديدة
  activeAddresses: number,       // العناوين النشطة
  transactionGrowth: number,     // نمو المعاملات %
  partnershipCount: number       // عدد الشراكات
): number {
  let score = 0;
  
  // نمو العناوين الجديدة
  score += newAddresses > 100000 ? 20 : 
           newAddresses > 10000 ? 15 : 
           newAddresses > 1000 ? 10 : 5;
  
  // العناوين النشطة
  score += activeAddresses > 1000000 ? 25 : 
           activeAddresses > 100000 ? 20 : 
           activeAddresses > 10000 ? 10 : 5;
  
  // نمو المعاملات
  score += transactionGrowth > 50 ? 20 : 
           transactionGrowth > 20 ? 15 : 
           transactionGrowth > 10 ? 10 : 5;
  
  // الشراكات
  score += Math.min(20, partnershipCount * 2);
  
  return Math.min(100, score);
}

// دالة شاملة لحساب التوصية المتقدمة
export function generateAdvancedRecommendation(
  symbol: string,
  technicalScore: number,
  fundamentalScore: number,
  sentimentScore: number,
  riskScore: number,
  volatilityScore: number,
  volumeScore: number,
  adoptionScore: number,
  buySignals: string[],
  sellSignals: string[],
  riskFactors: string[]
): AdvancedRecommendationData {
  
  // حساب الدرجة الإجمالية (بأوزان مختلفة)
  const weights = {
    technical: 0.25,
    fundamental: 0.25,
    sentiment: 0.15,
    risk: 0.15,
    volatility: 0.10,
    volume: 0.05,
    adoption: 0.05
  };
  
  // تقليل تأثير المخاطر والتقلب
  const adjustedRiskScore = Math.max(0, 100 - riskScore);
  const adjustedVolatilityScore = Math.max(0, volatilityScore * 0.7);
  
  const overallScore = (
    technicalScore * weights.technical +
    fundamentalScore * weights.fundamental +
    sentimentScore * weights.sentiment +
    adjustedRiskScore * weights.risk +
    adjustedVolatilityScore * weights.volatility +
    volumeScore * weights.volume +
    adoptionScore * weights.adoption
  );
  
  // حساب درجة الثقة بناءً على تناسق الإشارات
  const totalSignals = buySignals.length + sellSignals.length;
  const signalConsistency = totalSignals > 0 ? 
    Math.abs(buySignals.length - sellSignals.length) / totalSignals : 0;
  
  const confidence = Math.min(100, 50 + (signalConsistency * 40) + (overallScore > 50 ? 10 : 0));
  
  // تحديد نوع التوصية بناءً على الدرجة الإجمالية
  let recommendation: "تعزيز" | "احتفاظ" | "تقليص" | "إيقاف";
  let strength: "قوية جداً" | "قوية" | "معتدلة" | "ضعيفة";
  
  if (overallScore >= 75) {
    recommendation = "تعزيز";
    strength = confidence >= 80 ? "قوية جداً" : "قوية";
  } else if (overallScore >= 60) {
    recommendation = "احتفاظ";
    strength = "قوية";
  } else if (overallScore >= 40) {
    recommendation = "تقليص";
    strength = "معتدلة";
  } else {
    recommendation = "إيقاف";
    strength = "ضعيفة";
  }
  
  // تحديد التوقيت
  let timing: "شراء فوري" | "انتظر انخفاض" | "انتظر ارتفاع" | "تجنب الآن";
  
  if (recommendation === "تعزيز" && technicalScore > 70) {
    timing = "شراء فوري";
  } else if (recommendation === "تعزيز" && technicalScore > 50) {
    timing = "انتظر انخفاض";
  } else if (recommendation === "احتفاظ") {
    timing = "انتظر ارتفاع";
  } else {
    timing = "تجنب الآن";
  }
  
  // حساب أهداف السعر
  const priceTargets = {
    short_term: calculatePriceTarget(overallScore, "short"),
    medium_term: calculatePriceTarget(overallScore, "medium"),
    long_term: calculatePriceTarget(overallScore, "long")
  };
  
  return {
    symbol,
    technicalScore,
    fundamentalScore,
    sentimentScore,
    riskScore,
    volatilityScore,
    volumeScore,
    adoptionScore,
    overallScore: Math.round(overallScore),
    confidence: Math.round(confidence),
    recommendation,
    strength,
    buySignals,
    sellSignals,
    riskFactors,
    priceTargets,
    timing,
    alternativeCoins: []
  };
}

// حساب أهداف الأسعار
function calculatePriceTarget(score: number, timeframe: "short" | "medium" | "long"): string {
  const upside = score / 10;  // نسبة الارتفاع المتوقعة
  const downside = (100 - score) / 15;  // نسبة الانخفاض المتوقعة
  
  const timeframeText = {
    short: "1-3 أشهر",
    medium: "3-12 شهر",
    long: "1+ سنة"
  };
  
  return `${upside.toFixed(1)}% ارتفاع محتمل (${timeframeText[timeframe]}) أو ${downside.toFixed(1)}% انخفاض`;
}
