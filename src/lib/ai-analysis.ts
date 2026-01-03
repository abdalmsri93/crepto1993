// AI Analysis Service using Groq API (Free)
// Supports dual AI analysis: ChatGPT-like & Gemini-like models

interface CoinData {
  symbol: string;
  price: string;
  growth: string;
  riskLevel: string;
  liquidity: string;
  performanceScore: number;
  marketCap: string;
  recommendation: string;
}

interface AIRecommendation {
  recommended: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  summary: string;
}

export interface DualAnalysis {
  chatgpt: AIRecommendation;
  gemini: AIRecommendation;
  isLoading: boolean;
  error?: string;
}

// Get API key from localStorage
const getGroqApiKey = (): string | null => {
  return localStorage.getItem('groq_api_key');
};

// Analyze coin using Groq API
async function analyzeWithGroq(coinData: CoinData, model: string): Promise<AIRecommendation> {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    return {
      recommended: false,
      confidence: 'low',
      reason: 'يرجى إضافة Groq API Key في الإعدادات',
      summary: '⚙️ افتح الإعدادات وأضف المفتاح'
    };
  }

  const prompt = `
أنت خبير تحليل عملات رقمية. قم بتحليل هذه العملة وأعطِ توصية واضحة:

العملة: ${coinData.symbol}
السعر: ${coinData.price}
التغير (24h): ${coinData.growth}
مستوى المخاطرة: ${coinData.riskLevel}
السيولة: ${coinData.liquidity}
درجة الأداء: ${coinData.performanceScore}/10
حجم السوق: ${coinData.marketCap}

قدم إجابة بالصيغة التالية بالضبط:
RECOMMENDED: [YES/NO]
CONFIDENCE: [HIGH/MEDIUM/LOW]
REASON: [سبب واحد رئيسي في سطر واحد]
SUMMARY: [ملخص قصير جداً 10-15 كلمة]
`;

  try {
    console.log('🤖 Starting AI analysis for:', coinData.symbol);
    console.log('📊 Model:', model);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'أنت خبير تحليل عملات رقمية محترف. قدم توصيات واضحة ومختصرة.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received for:', coinData.symbol);
    
    const analysis = data.choices[0].message.content;
    console.log('📝 AI Raw Response:', analysis);

    // Parse the response - check multiple patterns for YES
    const recommendedPatterns = [
      'RECOMMENDED: YES',
      'RECOMMENDED:YES',
      'YES',
      'ينصح',
      'نعم',
      'موصى',
      'شراء',
      'BUY',
      'اشتري',
      'فرصة'
    ];
    
    // Check if any positive pattern exists (case insensitive)
    const analysisUpper = analysis.toUpperCase();
    const recommended = recommendedPatterns.some(pattern => 
      analysisUpper.includes(pattern.toUpperCase())
    ) && !analysisUpper.includes('RECOMMENDED: NO') && !analysisUpper.includes('لا ينصح');
    
    console.log(`🎯 ${coinData.symbol} - Recommended: ${recommended}`);
    
    const confidenceMatch = analysis.match(/CONFIDENCE: (HIGH|MEDIUM|LOW)/i);
    const reasonMatch = analysis.match(/REASON: (.+)/);
    const summaryMatch = analysis.match(/SUMMARY: (.+)/);

    return {
      recommended,
      confidence: (confidenceMatch?.[1]?.toLowerCase() as any) || 'medium',
      reason: reasonMatch?.[1]?.trim() || 'تحليل غير متوفر',
      summary: summaryMatch?.[1]?.trim() || 'ملخص غير متوفر'
    };
  } catch (error: any) {
    console.error('Groq API Error:', error);
    
    // More detailed error messages
    let errorReason = 'فشل الاتصال بـ AI';
    let errorSummary = 'حدث خطأ في التحليل';
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorReason = 'API Key غير صحيح أو منتهي';
      errorSummary = '⚠️ تحقق من المفتاح في الإعدادات';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorReason = 'تم تجاوز الحد المسموح من الطلبات';
      errorSummary = '⏳ انتظر دقيقة وحاول مرة أخرى';
    } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      errorReason = 'مشكلة في الاتصال بالإنترنت';
      errorSummary = '🌐 تحقق من الاتصال وحاول مرة أخرى';
    }
    
    return {
      recommended: false,
      confidence: 'low',
      reason: errorReason,
      summary: errorSummary
    };
  }
}

// Get basic analysis without API (fallback)
function getBasicAnalysis(coinData: CoinData): AIRecommendation {
  const growthPercent = parseFloat(coinData.growth.replace('%', '').replace('+', ''));
  const score = coinData.performanceScore;
  const isHighLiquidity = coinData.liquidity.includes('عالية');
  const isLowRisk = coinData.riskLevel.includes('منخفض');
  const isMediumRisk = coinData.riskLevel.includes('متوسط');

  let recommended = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';
  let summary = '';

  // تحليل أكثر مرونة - نوصي بالعملات الجيدة
  // شروط التوصية بالشراء:
  if (score >= 7 && growthPercent > 0 && isHighLiquidity && isLowRisk) {
    // ممتاز
    recommended = true;
    confidence = 'high';
    reason = 'أداء قوي مع سيولة عالية ومخاطرة منخفضة';
    summary = 'فرصة استثمارية ممتازة';
  } else if (score >= 6 && growthPercent > 0 && (isHighLiquidity || isLowRisk)) {
    // جيد جداً
    recommended = true;
    confidence = 'high';
    reason = 'أداء جيد جداً مع مؤشرات إيجابية';
    summary = 'فرصة جيدة للاستثمار';
  } else if (score >= 5 && growthPercent > 0) {
    // جيد
    recommended = true;
    confidence = 'medium';
    reason = 'أداء جيد مع إمكانية نمو';
    summary = 'يمكن النظر في الاستثمار بحذر';
  } else if (score >= 4 && growthPercent >= 0 && isMediumRisk) {
    // مقبول
    recommended = true;
    confidence = 'medium';
    reason = 'أداء مقبول مع مخاطرة متوسطة';
    summary = 'فرصة محتملة للمراقبة';
  } else if (growthPercent > 5 && score >= 3) {
    // نمو جيد
    recommended = true;
    confidence = 'low';
    reason = 'نمو إيجابي ملحوظ';
    summary = 'قد تكون فرصة قصيرة المدى';
  } else if (growthPercent < -5 || score < 3) {
    // ضعيف
    recommended = false;
    confidence = 'high';
    reason = 'انخفاض في السعر أو أداء ضعيف';
    summary = 'يُفضل الانتظار أو تجنب الاستثمار';
  } else {
    // متوسط - قرار محايد
    recommended = Math.random() > 0.5; // 50% فرصة للتوصية
    confidence = 'low';
    reason = 'بيانات متوسطة - يحتاج مراقبة';
    summary = 'راقب العملة قبل الاستثمار';
  }

  return { recommended, confidence, reason, summary };
}

// Main function: Dual AI Analysis
export async function getDualAIAnalysis(coinData: CoinData): Promise<DualAnalysis> {
  const apiKey = getGroqApiKey();

  // If no API key, use basic analysis with slight randomization for variety
  if (!apiKey) {
    // تحليل أساسي مع تنويع بسيط
    const basic1 = getBasicAnalysis(coinData);
    const basic2 = getBasicAnalysis(coinData);
    return {
      chatgpt: { ...basic1, summary: '🤖 ChatGPT: ' + basic1.summary },
      gemini: { ...basic2, summary: '✨ Gemini: ' + basic2.summary },
      isLoading: false,
      error: 'API Key غير موجود - يعمل التحليل الأساسي'
    };
  }

  // Analyze with both models in parallel
  try {
    console.log('🔄 Starting dual AI analysis...');
    
    // Use supported models: llama-3.3-70b-versatile & llama-3.1-8b-instant
    const chatgptAnalysis = await analyzeWithGroq(coinData, 'llama-3.3-70b-versatile');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    const geminiAnalysis = await analyzeWithGroq(coinData, 'llama-3.1-8b-instant');

    console.log('✅ Dual analysis complete');
    
    return {
      chatgpt: chatgptAnalysis,
      gemini: geminiAnalysis,
      isLoading: false
    };
  } catch (error: any) {
    console.error('❌ Dual analysis failed:', error);
    const basic = getBasicAnalysis(coinData);
    return {
      chatgpt: basic,
      gemini: basic,
      isLoading: false,
      error: 'فشل التحليل الذكي - يعمل التحليل الأساسي'
    };
  }
}

// Batch analysis for multiple coins
export async function batchAnalyzeCoins(coins: CoinData[]): Promise<Map<string, DualAnalysis>> {
  const results = new Map<string, DualAnalysis>();
  
  // Analyze coins one by one to avoid rate limits
  for (const coin of coins) {
    const analysis = await getDualAIAnalysis(coin);
    results.set(coin.symbol, analysis);
    
    // Small delay to avoid rate limiting (Groq allows 30 req/min on free tier)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// Check if API key is configured
export function isAIConfigured(): boolean {
  return !!getGroqApiKey();
}

// Save API key
export function saveGroqApiKey(apiKey: string): void {
  localStorage.setItem('groq_api_key', apiKey);
}

// Remove API key
export function removeGroqApiKey(): void {
  localStorage.removeItem('groq_api_key');
}
