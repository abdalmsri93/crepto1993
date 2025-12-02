// Deno Edge Function - تحليل متقدم للعملات الرقمية
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  calculateTechnicalScore,
  calculateFundamentalScore,
  calculateSentimentScore,
  calculateRiskScore,
  calculateVolatilityScore,
  calculateVolumeScore,
  calculateAdoptionScore,
  generateAdvancedRecommendation
} from "../_shared/advanced-recommendations.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { symbol, coinData } = await req.json();

    if (!symbol || !coinData) {
      return new Response(
        JSON.stringify({ error: 'Symbol and coinData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Advanced analysis starting for: ${symbol}`);

    // ====== حساب المؤشرات الفنية ======
    const technicalScore = calculateTechnicalScore(
      coinData.priceChangePercent || 0,      // التغيير في السعر %
      coinData.movingAveragePosition || 0,   // موضع MA (-1/0/1)
      coinData.rsi || 50,                    // مؤشر القوة النسبية
      coinData.macd || 0,                    // MACD (-1/0/1)
      coinData.bollingerBandPosition || 0,   // Bollinger Band (-1/0/1)
      coinData.volume || 0                   // حجم التداول (-1/0/1)
    );

    console.log(`📊 Technical Score: ${technicalScore}`);

    // ====== حساب الأساسيات ======
    const fundamentalScore = calculateFundamentalScore(
      coinData.teamStrength || 70,           // قوة الفريق (0-100)
      coinData.projectMaturity || 70,        // نضج المشروع
      coinData.communitySize || 60,          // حجم المجتمع
      coinData.adoptionRate || 50,           // معدل الاعتماد
      coinData.useCaseValidity || 75,        // صحة حالة الاستخدام
      coinData.competitionLevel || 60        // مستوى المنافسة
    );

    console.log(`🏗️ Fundamental Score: ${fundamentalScore}`);

    // ====== حساب المعنويات ======
    const sentimentScore = calculateSentimentScore(
      coinData.newsScore || 50,              // درجة الأخبار
      coinData.socialMediaScore || 50,       // درجة وسائل التواصل
      coinData.whaleActivityScore || 50,     // نشاط الحيتان
      coinData.institutionalInterest || 40   // الاهتمام المؤسسي
    );

    console.log(`📢 Sentiment Score: ${sentimentScore}`);

    // ====== حساب المخاطر ======
    const riskScore = calculateRiskScore(
      coinData.regulatoryRisk || 30,         // الخطر التنظيمي
      coinData.technicalRisk || 25,          // الخطر التقني
      coinData.marketRisk || 40,             // الخطر السوقي
      coinData.concentrationRisk || 35,      // خطر التركيز
      coinData.liquidityRisk || 20           // خطر السيولة
    );

    console.log(`⚠️ Risk Score: ${riskScore}`);

    // ====== حساب التقلب ======
    const volatilityScore = calculateVolatilityScore(
      coinData.dailyVolatility || 5,         // التقلب اليومي %
      coinData.weeklyVolatility || 8,        // التقلب الأسبوعي %
      coinData.monthlyVolatility || 15       // التقلب الشهري %
    );

    console.log(`📈 Volatility Score: ${volatilityScore}`);

    // ====== حساب حجم التداول ======
    const volumeScore = calculateVolumeScore(
      coinData.currentVolume || 1000000,
      coinData.averageVolume || 800000,
      coinData.volumeTrend || "stable"
    );

    console.log(`💰 Volume Score: ${volumeScore}`);

    // ====== حساب الاعتماد ======
    const adoptionScore = calculateAdoptionScore(
      coinData.newAddresses || 5000,
      coinData.activeAddresses || 50000,
      coinData.transactionGrowth || 10,
      coinData.partnershipCount || 3
    );

    console.log(`🚀 Adoption Score: ${adoptionScore}`);

    // ====== تحديد الإشارات ======
    const buySignals: string[] = [];
    const sellSignals: string[] = [];
    const riskFactors: string[] = [];

    // إشارات الشراء
    if (technicalScore > 70) buySignals.push("المؤشرات الفنية قوية جداً");
    if (fundamentalScore > 75) buySignals.push("الأساسيات قوية جداً");
    if (adoptionScore > 70) buySignals.push("معدل الاعتماد عالي");
    if (coinData.rsi && coinData.rsi < 30) buySignals.push("مؤشر RSI يشير لفرصة شراء");
    if (sentimentScore > 65) buySignals.push("المعنويات إيجابية");
    if (volumeScore > 70) buySignals.push("حجم التداول مرتفع");

    // إشارات البيع
    if (technicalScore < 40) sellSignals.push("المؤشرات الفنية ضعيفة");
    if (fundamentalScore < 45) sellSignals.push("الأساسيات ضعيفة");
    if (adoptionScore < 30) sellSignals.push("معدل الاعتماد منخفض جداً");
    if (coinData.rsi && coinData.rsi > 70) sellSignals.push("مؤشر RSI يشير لفرصة بيع");
    if (sentimentScore < 35) sellSignals.push("المعنويات سلبية");
    if (volatilityScore < 40) sellSignals.push("التقلب مرتفع جداً");

    // عوامل الخطر
    if (riskScore > 60) riskFactors.push("مستوى المخاطر مرتفع");
    if (coinData.regulatoryRisk > 50) riskFactors.push("هناك خطر تنظيمي محتمل");
    if (coinData.technicalRisk > 50) riskFactors.push("هناك خطر تقني محتمل");
    if (volatilityScore < 35) riskFactors.push("التقلب السعري قد يسبب خسائر سريعة");
    if (coinData.liquidityRisk > 60) riskFactors.push("السيولة محدودة - صعوبة البيع");
    if (coinData.concentrationRisk > 70) riskFactors.push("تركيز ملكية عالي - خطر متزايد");

    console.log(`✅ Signals identified - Buy: ${buySignals.length}, Sell: ${sellSignals.length}`);

    // ====== توليد التوصية النهائية ======
    const recommendation = generateAdvancedRecommendation(
      symbol,
      technicalScore,
      fundamentalScore,
      sentimentScore,
      riskScore,
      volatilityScore,
      volumeScore,
      adoptionScore,
      buySignals,
      sellSignals,
      riskFactors
    );

    console.log(`🎯 Final Recommendation: ${recommendation.recommendation} (${recommendation.overallScore}/100)`);

    return new Response(
      JSON.stringify({
        success: true,
        recommendation,
        metadata: {
          timestamp: new Date().toISOString(),
          analysisVersion: "2.0",
          components: {
            technical: technicalScore,
            fundamental: fundamentalScore,
            sentiment: sentimentScore,
            risk: riskScore,
            volatility: volatilityScore,
            volume: volumeScore,
            adoption: adoptionScore
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("❌ Error in advanced-analysis function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "خطأ غير متوقع",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
