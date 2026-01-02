# نشر Edge Function لجلب مبلغ الاستثمار 💰

## خطوات النشر على Supabase Dashboard

### 1. افتح Supabase Dashboard
اذهب إلى: https://supabase.com/dashboard/project/ftgvxvwvbtfkbgkuccwx/functions

### 2. اختر Function الموجودة
- اضغط على `binance-portfolio` من القائمة

### 3. استبدل الكود
انسخ الكود من الملف:
```
supabase/functions/binance-portfolio/index.ts
```

أو انسخ الكود التالي مباشرة:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Binance Portfolio Function Starting...');

// دالة لإنشاء التوقيع
async function createSignature(queryString: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة لجلب مبلغ الاستثمار من سجل الصفقات
async function fetchInvestmentAmount(symbol: string, apiKey: string, apiSecret: string): Promise<number> {
  try {
    const tradingPair = `${symbol}USDT`;
    const timestamp = Date.now();
    const queryString = `symbol=${tradingPair}&timestamp=${timestamp}`;
    const signature = await createSignature(queryString, apiSecret);

    const response = await fetch(
      `https://api.binance.com/api/v3/myTrades?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': apiKey } }
    );

    if (!response.ok) return 0;

    const trades = await response.json();
    
    let totalInvestment = 0;
    let totalQuantityBought = 0;
    let totalSellValue = 0;
    let totalQuantitySold = 0;

    trades.forEach((trade: any) => {
      const quoteQty = parseFloat(trade.quoteQty);
      const qty = parseFloat(trade.qty);
      if (trade.isBuyer) {
        totalInvestment += quoteQty;
        totalQuantityBought += qty;
      } else {
        totalSellValue += quoteQty;
        totalQuantitySold += qty;
      }
    });

    const avgBuyPrice = totalQuantityBought > 0 ? totalInvestment / totalQuantityBought : 0;
    const netQuantity = totalQuantityBought - totalQuantitySold;
    const costBasis = netQuantity * avgBuyPrice;

    return costBasis;
  } catch (e) {
    console.error(`Error fetching trades for ${symbol}:`, e);
    return 0;
  }
}

// باقي الكود يبقى كما هو...
```

### 4. احفظ وانشر
- اضغط على **Save** ثم **Deploy**

---

## ملاحظات مهمة ⚠️

1. **صلاحيات API Key**: تأكد أن مفتاح Binance API لديه صلاحية `Enable Reading`
2. **الأصول الجديدة**: إذا اشتريت عملة حديثاً قد لا تظهر القيمة فوراً
3. **العملات المستقرة**: USDT, USDC, BUSD لا يتم حساب استثمارها

---

## التحقق من النجاح ✅

بعد النشر، افتح التطبيق وسترى:
- مبلغ الاستثمار يظهر تلقائياً لكل عملة
- الربح/الخسارة يحتسب بناءً على سعر الشراء الحقيقي

---

## استكشاف الأخطاء 🔧

### إذا لم يظهر مبلغ الاستثمار:
1. تحقق من صلاحيات API Key في Binance
2. افحص logs في Supabase Dashboard
3. تأكد من وجود صفقات سابقة للعملة
