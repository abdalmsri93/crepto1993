/**
 * Binance Convert / Market Buy Edge Function
 * تنفيذ شراء مباشر باستخدام Market Order أو Convert API
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Binance API URLs
const BINANCE_API_BASE = "https://api.binance.com";

interface ConvertRequest {
  apiKey: string;
  secretKey: string;
  fromAsset: string;  // USDT
  toAsset: string;    // BTC, ETH, etc.
  fromAmount: number; // المبلغ بـ USDT
}

/**
 * إنشاء توقيع HMAC-SHA256
 */
async function createSignature(queryString: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(queryString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * جلب السعر الحالي للعملة
 */
async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    console.log(`📊 Fetching price for ${symbol}...`);
    const url = `${BINANCE_API_BASE}/api/v3/ticker/price?symbol=${symbol}`;
    console.log(`🔗 URL: ${url}`);
    
    const response = await fetch(url);
    const responseText = await response.text();
    console.log(`📥 Response: ${responseText}`);
    
    if (!response.ok) {
      console.error(`❌ Price fetch failed: ${response.status} - ${responseText}`);
      return 0;
    }
    
    const data = JSON.parse(responseText);
    const price = parseFloat(data.price);
    console.log(`✅ Price for ${symbol}: ${price}`);
    return price;
  } catch (error) {
    console.error('❌ Error fetching price:', error);
    return 0;
  }
}

/**
 * جلب معلومات الرمز (الحدود)
 */
async function getSymbolInfo(symbol: string): Promise<{
  minNotional: number;
  stepSize: number;
  minQty: number;
} | null> {
  try {
    console.log(`📊 Fetching symbol info for ${symbol}...`);
    const response = await fetch(`${BINANCE_API_BASE}/api/v3/exchangeInfo?symbol=${symbol}`);
    
    if (!response.ok) {
      console.log(`⚠️ ExchangeInfo failed, using defaults for ${symbol}`);
      // إرجاع قيم افتراضية بدلاً من null
      return {
        minNotional: 5,
        stepSize: 0.00001,
        minQty: 0.00001,
      };
    }
    
    const data = await response.json();
    
    if (!data.symbols || data.symbols.length === 0) {
      console.log(`⚠️ No symbol data, using defaults for ${symbol}`);
      return {
        minNotional: 5,
        stepSize: 0.00001,
        minQty: 0.00001,
      };
    }

    const symbolData = data.symbols[0];
    const filters = symbolData.filters;

    const lotSizeFilter = filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const minNotionalFilter = filters.find((f: any) => f.filterType === 'NOTIONAL' || f.filterType === 'MIN_NOTIONAL');

    console.log(`✅ Symbol info for ${symbol}:`, { 
      minNotional: minNotionalFilter?.minNotional, 
      stepSize: lotSizeFilter?.stepSize 
    });

    return {
      minNotional: parseFloat(minNotionalFilter?.minNotional || '5'),
      stepSize: parseFloat(lotSizeFilter?.stepSize || '0.00001'),
      minQty: parseFloat(lotSizeFilter?.minQty || '0.00001'),
    };
  } catch (error) {
    console.error('Error fetching symbol info:', error);
    // إرجاع قيم افتراضية بدلاً من null
    return {
      minNotional: 5,
      stepSize: 0.00001,
      minQty: 0.00001,
    };
  }
}

/**
 * تقريب الكمية حسب stepSize
 */
function adjustQuantity(quantity: number, stepSize: number): number {
  const precision = Math.round(-Math.log10(stepSize));
  return Math.floor(quantity / stepSize) * stepSize;
}

/**
 * تنفيذ أمر Market Buy
 */
async function executeMarketBuy(
  apiKey: string,
  secretKey: string,
  symbol: string,
  quoteOrderQty: number
): Promise<any> {
  const timestamp = Date.now();
  
  // استخدام quoteOrderQty للشراء بمبلغ محدد من USDT
  const params: Record<string, string | number> = {
    symbol: symbol,
    side: 'BUY',
    type: 'MARKET',
    quoteOrderQty: quoteOrderQty.toFixed(2), // المبلغ بـ USDT
    timestamp: timestamp,
  };

  // بناء query string
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  // إنشاء التوقيع
  const signature = await createSignature(queryString, secretKey);
  const signedQueryString = `${queryString}&signature=${signature}`;

  console.log('📤 Sending order to Binance:', {
    symbol,
    quoteOrderQty,
    url: `${BINANCE_API_BASE}/api/v3/order`
  });

  // إرسال الطلب
  const response = await fetch(`${BINANCE_API_BASE}/api/v3/order?${signedQueryString}`, {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const responseData = await response.json();
  
  console.log('📥 Binance response:', responseData);

  if (!response.ok) {
    throw new Error(responseData.msg || `Binance error: ${responseData.code}`);
  }

  return responseData;
}

/**
 * الدالة الرئيسية
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // التحقق من الطريقة
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // قراءة البيانات
    const requestData: ConvertRequest = await req.json();
    
    console.log('🔄 Convert request:', {
      fromAsset: requestData.fromAsset,
      toAsset: requestData.toAsset,
      fromAmount: requestData.fromAmount,
    });

    // التحقق من المعاملات
    if (!requestData.apiKey || !requestData.secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'مفاتيح API مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.toAsset || !requestData.fromAmount) {
      return new Response(
        JSON.stringify({ success: false, error: 'معاملات غير مكتملة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من الحد الأدنى
    if (requestData.fromAmount < 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'الحد الأدنى للشراء هو $5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // تحضير الرمز
    const symbol = `${requestData.toAsset.toUpperCase()}USDT`;
    
    console.log(`🔍 Checking symbol: ${symbol}`);

    // جلب السعر الحالي أولاً للتحقق من وجود الرمز
    const currentPrice = await getCurrentPrice(symbol);
    if (currentPrice === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `الرمز ${symbol} غير موجود في Binance أو غير متاح للتداول` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💰 Current price for ${symbol}: $${currentPrice}`);

    // جلب معلومات الرمز (نستخدم القيم الافتراضية إذا فشل)
    const symbolInfo = await getSymbolInfo(symbol);

    console.log(`📊 Symbol info:`, symbolInfo);

    // تنفيذ الشراء
    const orderResult = await executeMarketBuy(
      requestData.apiKey,
      requestData.secretKey,
      symbol,
      requestData.fromAmount
    );

    // حساب السعر المتوسط
    const executedQty = parseFloat(orderResult.executedQty);
    const cummulativeQuoteQty = parseFloat(orderResult.cummulativeQuoteQty);
    const avgPrice = cummulativeQuoteQty / executedQty;

    // إرجاع النتيجة
    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderResult.orderId,
        symbol: orderResult.symbol,
        side: orderResult.side,
        toAmount: orderResult.executedQty,
        fromAmount: orderResult.cummulativeQuoteQty,
        inversePrice: avgPrice.toFixed(8),
        status: orderResult.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Convert error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
