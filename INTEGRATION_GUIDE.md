# 🔌 دليل تكامل نظام التوصيات المحسّن

## 📋 الخطوات التالية للتكامل

### الخطوة 1: استدعاء الدالة الجديدة من Frontend

#### في صفحة التوصيات (`src/pages/SuggestCoins.tsx`):

```typescript
// إضافة import
import { AdvancedRecommendationCard } from '@/components/AdvancedRecommendationCard';

// داخل الكومبوننت:
const callAdvancedAnalysis = async (symbol: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('advanced-analysis', {
      body: {
        symbol,
        coinData: {
          // المؤشرات الفنية
          priceChangePercent: 5.2,
          movingAveragePosition: 1,
          rsi: 65,
          macd: 1,
          bollingerBandPosition: 0,
          volume: 1,
          
          // الأساسيات
          teamStrength: 90,
          projectMaturity: 85,
          communitySize: 80,
          adoptionRate: 75,
          useCaseValidity: 85,
          competitionLevel: 40,
          
          // المعنويات
          newsScore: 70,
          socialMediaScore: 65,
          whaleActivityScore: 60,
          institutionalInterest: 55,
          
          // المخاطر
          regulatoryRisk: 20,
          technicalRisk: 15,
          marketRisk: 35,
          concentrationRisk: 30,
          liquidityRisk: 15,
          
          // التقلب
          dailyVolatility: 3.5,
          weeklyVolatility: 7.2,
          monthlyVolatility: 12.8,
          
          // حجم التداول
          currentVolume: 1500000,
          averageVolume: 1000000,
          volumeTrend: 'increasing',
          
          // الاعتماد
          newAddresses: 50000,
          activeAddresses: 800000,
          transactionGrowth: 25,
          partnershipCount: 15
        }
      }
    });

    if (error) throw error;
    
    // استخدام البيانات
    console.log('Advanced recommendation:', data.recommendation);
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### الخطوة 2: عرض النتائج

```typescript
// استخدام المكون الجديد:
<AdvancedRecommendationCard
  symbol={recommendation.symbol}
  technicalScore={recommendation.technicalScore}
  fundamentalScore={recommendation.fundamentalScore}
  sentimentScore={recommendation.sentimentScore}
  riskScore={recommendation.riskScore}
  volatilityScore={recommendation.volatilityScore}
  volumeScore={recommendation.volumeScore}
  adoptionScore={recommendation.adoptionScore}
  overallScore={recommendation.overallScore}
  confidence={recommendation.confidence}
  recommendation={recommendation.recommendation}
  strength={recommendation.strength}
  buySignals={recommendation.buySignals}
  sellSignals={recommendation.sellSignals}
  riskFactors={recommendation.riskFactors}
  timing={recommendation.timing}
  priceTargets={recommendation.priceTargets}
/>
```

---

## 🔄 تدفق البيانات

```
Frontend (SuggestCoins.tsx)
    ↓
    ├─ جمع بيانات العملة
    ├─ حساب المؤشرات الفنية
    ├─ جلب بيانات الأساسيات
    └─ جمع معنويات السوق
    ↓
    POST /functions/v1/advanced-analysis
    ↓
Backend (advanced-analysis/index.ts)
    ↓
    ├─ calculateTechnicalScore()
    ├─ calculateFundamentalScore()
    ├─ calculateSentimentScore()
    ├─ calculateRiskScore()
    ├─ calculateVolatilityScore()
    ├─ calculateVolumeScore()
    ├─ calculateAdoptionScore()
    └─ generateAdvancedRecommendation()
    ↓
    ← JSON Response
    ↓
Frontend (AdvancedRecommendationCard.tsx)
    ↓
    عرض النتائج بشكل جميل
```

---

## 📡 مثال الاستدعاء الكامل

```typescript
// استدعاء كامل:
const response = await fetch(
  'https://[project].supabase.co/functions/v1/advanced-analysis',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      symbol: 'BTC',
      coinData: {
        priceChangePercent: 5.2,
        rsi: 65,
        // ... المزيد من البيانات
      }
    })
  }
);

const result = await response.json();
console.log(result.recommendation);
```

---

## 🎯 خيارات التخصيص

### 1. تعديل الأوزان

في `advanced-recommendations.ts`:
```typescript
const weights = {
  technical: 0.25,      // قيّمه إلى 0.30 لتأثير أكبر
  fundamental: 0.25,
  sentiment: 0.15,
  risk: 0.15,
  // ...
};
```

### 2. تعديل حدود التوصيات

في `generateAdvancedRecommendation()`:
```typescript
if (overallScore >= 75) {      // أضبط إلى 70 أو 80
  recommendation = "تعزيز";
}
```

### 3. إضافة مؤشرات جديدة

أنشئ دالة جديدة:
```typescript
export function calculateNewScore(param1, param2): number {
  // حسابك
  return score;
}

// ثم أضفها للحساب الإجمالي
const newScore = calculateNewScore(...);
const overallScore = (...) + (newScore * weight);
```

---

## 🧪 الاختبار

### اختبار محلي:

```bash
# تثبيت التبعيات
npm install

# تشغيل الـ Supabase محلياً
supabase start

# تشغيل الـ functions محلياً
supabase functions serve

# اختبار API
curl -X POST http://localhost:54321/functions/v1/advanced-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "symbol": "BTC",
    "coinData": { ... }
  }'
```

### اختبار في React:

```typescript
import { AdvancedRecommendationCard } from '@/components/AdvancedRecommendationCard';

export const TestComponent = () => {
  const mockData = {
    symbol: 'BTC',
    technicalScore: 78,
    fundamentalScore: 85,
    // ... باقي البيانات
  };
  
  return <AdvancedRecommendationCard {...mockData} />;
};
```

---

## 🚨 معالجة الأخطاء

```typescript
try {
  const { data, error } = await supabase.functions.invoke('advanced-analysis', {
    body: { symbol, coinData }
  });

  if (error) {
    if (error.message.includes('Unauthorized')) {
      // معالجة عدم التصريح
    } else if (error.message.includes('Invalid data')) {
      // معالجة البيانات غير الصحيحة
    }
    throw error;
  }

  return data.recommendation;
  
} catch (error) {
  console.error('Analysis failed:', error);
  // عرض رسالة خطأ للمستخدم
}
```

---

## 📊 نموذج البيانات الكامل

```typescript
interface CoinAnalysisRequest {
  symbol: string;
  coinData: {
    // المؤشرات الفنية (7 مدخلات)
    priceChangePercent: number;
    movingAveragePosition: -1 | 0 | 1;
    rsi: number;
    macd: -1 | 0 | 1;
    bollingerBandPosition: -1 | 0 | 1;
    volume: -1 | 0 | 1;
    
    // الأساسيات (6 مدخلات)
    teamStrength: number;
    projectMaturity: number;
    communitySize: number;
    adoptionRate: number;
    useCaseValidity: number;
    competitionLevel: number;
    
    // المعنويات (4 مدخلات)
    newsScore: number;
    socialMediaScore: number;
    whaleActivityScore: number;
    institutionalInterest: number;
    
    // المخاطر (5 مدخلات)
    regulatoryRisk: number;
    technicalRisk: number;
    marketRisk: number;
    concentrationRisk: number;
    liquidityRisk: number;
    
    // التقلب (3 مدخلات)
    dailyVolatility: number;
    weeklyVolatility: number;
    monthlyVolatility: number;
    
    // حجم التداول (3 مدخلات)
    currentVolume: number;
    averageVolume: number;
    volumeTrend: 'increasing' | 'stable' | 'decreasing';
    
    // الاعتماد (4 مدخلات)
    newAddresses: number;
    activeAddresses: number;
    transactionGrowth: number;
    partnershipCount: number;
  };
}

interface AdvancedRecommendationResponse {
  success: boolean;
  recommendation: {
    symbol: string;
    technicalScore: number;
    fundamentalScore: number;
    sentimentScore: number;
    riskScore: number;
    volatilityScore: number;
    volumeScore: number;
    adoptionScore: number;
    overallScore: number;
    confidence: number;
    recommendation: 'تعزيز' | 'احتفاظ' | 'تقليص' | 'إيقاف';
    strength: 'قوية جداً' | 'قوية' | 'معتدلة' | 'ضعيفة';
    buySignals: string[];
    sellSignals: string[];
    riskFactors: string[];
    priceTargets: {
      short_term: string;
      medium_term: string;
      long_term: string;
    };
    timing: 'شراء فوري' | 'انتظر انخفاض' | 'انتظر ارتفاع' | 'تجنب الآن';
    alternativeCoins: string[];
  };
  metadata: {
    timestamp: string;
    analysisVersion: string;
    components: {
      technical: number;
      fundamental: number;
      sentiment: number;
      risk: number;
      volatility: number;
      volume: number;
      adoption: number;
    };
  };
}
```

---

## 🎨 تخصيص العرض

### تغيير الألوان في `AdvancedRecommendationCard.tsx`:

```typescript
const getRecommendationColor = () => {
  switch (recommendation) {
    case "تعزيز":
      return "bg-green-500/10 border-green-500/30";  // غير الألوان هنا
    case "احتفاظ":
      return "bg-blue-500/10 border-blue-500/30";
    // ...
  }
};
```

### إضافة رسوم بيانية:

```typescript
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Technical', value: technicalScore },
  { name: 'Fundamental', value: fundamentalScore },
  { name: 'Sentiment', value: sentimentScore },
  // ...
];

<BarChart data={data}>
  <Bar dataKey="value" fill="#8884d8" />
</BarChart>
```

---

## 🔐 الأمان

### التحقق من التصريح:

```typescript
// يتم تلقائياً في الـ Edge Function:
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

## 📈 المراقبة

### تفعيل الـ Logging:

```typescript
console.log(`🔍 Advanced analysis starting for: ${symbol}`);
console.log(`📊 Technical Score: ${technicalScore}`);
console.log(`🏗️ Fundamental Score: ${fundamentalScore}`);
// ... وغيرها

// هذه الـ logs ستظهر في Supabase Dashboard
```

---

## 🚀 النشر

```bash
# نشر الـ functions
supabase functions deploy advanced-analysis

# التحقق من النشر
supabase functions list

# عرض الـ logs
supabase functions logs advanced-analysis
```

---

## 💡 نصائح

1. **استخدم mock data أولاً** قبل البيانات الحقيقية
2. **راقب الـ console logs** لتتبع الخطأ
3. **اختبر مع قيم حدية** (أعلى وأقل قيم ممكنة)
4. **استخدم TypeScript** لضمان الأمان
5. **وثّق البيانات التي تجمعها** بوضوح

---

## 📞 المساعدة

للأسئلة والمشاكل:
- تحقق من الـ console logs
- تأكد من صحة البيانات
- راجع ADVANCED_RECOMMENDATION_SYSTEM.md
- تحقق من الاتصال بالإنترنت

