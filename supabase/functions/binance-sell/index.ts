/**
 * Binance Sell Edge Function
 * بيع عملة وتحويلها إلى USDT
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BINANCE_API_BASE = "https://api.binance.com";

interface SellRequest {
  apiKey: string;
  secretKey: string;
  asset: string;      // العملة المراد بيعها (BTC, ETH, etc.)
  quantity?: number;  // الكمية (اختياري - إذا لم تُحدد، يبيع كل الرصيد)
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
 * جلب رصيد عملة معينة
 */
async function getAssetBalance(apiKey: string, secretKey: string, asset: string): Promise<number> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = await createSignature(queryString, secretKey);

  const response = await fetch(`${BINANCE_API_BASE}/api/v3/account?${queryString}&signature=${signature}`, {
    headers: { 'X-MBX-APIKEY': apiKey },
  });

  if (!response.ok) {
    throw new Error('فشل جلب رصيد الحساب');
  }

  const data = await response.json();
  const balance = data.balances?.find((b: any) => b.asset === asset.toUpperCase());
  
  return balance ? parseFloat(balance.free) : 0;
}

/**
 * جلب معلومات الرمز
 */
async function getSymbolInfo(symbol: string): Promise<{stepSize: number; minQty: number} | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/api/v3/exchangeInfo?symbol=${symbol}`);
    if (!response.ok) return { stepSize: 0.00001, minQty: 0.00001 };
    
    const data = await response.json();
    if (!data.symbols || data.symbols.length === 0) return { stepSize: 0.00001, minQty: 0.00001 };

    const lotSizeFilter = data.symbols[0].filters.find((f: any) => f.filterType === 'LOT_SIZE');
    
    return {
      stepSize: parseFloat(lotSizeFilter?.stepSize || '0.00001'),
      minQty: parseFloat(lotSizeFilter?.minQty || '0.00001'),
    };
  } catch {
    return { stepSize: 0.00001, minQty: 0.00001 };
  }
}

/**
 * تقريب الكمية حسب stepSize
 */
function adjustQuantity(quantity: number, stepSize: number): number {
  return Math.floor(quantity / stepSize) * stepSize;
}

/**
 * تنفيذ أمر Market Sell
 */
async function executeMarketSell(
  apiKey: string,
  secretKey: string,
  symbol: string,
  quantity: number
): Promise<any> {
  const timestamp = Date.now();
  
  const params: Record<string, string | number> = {
    symbol: symbol,
    side: 'SELL',
    type: 'MARKET',
    quantity: quantity.toFixed(8).replace(/\.?0+$/, ''),
    timestamp: timestamp,
  };

  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signature = await createSignature(queryString, secretKey);
  const signedQueryString = `${queryString}&signature=${signature}`;

  console.log('📤 Sending SELL order:', { symbol, quantity });

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: SellRequest = await req.json();
    
    console.log('🔄 Sell request:', { asset: requestData.asset, quantity: requestData.quantity });

    if (!requestData.apiKey || !requestData.secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'مفاتيح API مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.asset) {
      return new Response(
        JSON.stringify({ success: false, error: 'اسم العملة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asset = requestData.asset.toUpperCase();
    const symbol = `${asset}USDT`;

    // جلب الكمية المتاحة إذا لم تُحدد
    let quantity = requestData.quantity;
    if (!quantity) {
      quantity = await getAssetBalance(requestData.apiKey, requestData.secretKey, asset);
      console.log(`💰 Available balance for ${asset}: ${quantity}`);
    }

    if (quantity <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: `لا يوجد رصيد متاح من ${asset}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // جلب معلومات الرمز وضبط الكمية
    const symbolInfo = await getSymbolInfo(symbol);
    if (symbolInfo) {
      quantity = adjustQuantity(quantity, symbolInfo.stepSize);
      if (quantity < symbolInfo.minQty) {
        return new Response(
          JSON.stringify({ success: false, error: `الكمية أقل من الحد الأدنى المسموح` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // تنفيذ البيع
    const result = await executeMarketSell(
      requestData.apiKey,
      requestData.secretKey,
      symbol,
      quantity
    );

    // حساب المبلغ المستلم بـ USDT
    const receivedUsdt = parseFloat(result.cummulativeQuoteQty || '0');
    const executedQty = parseFloat(result.executedQty || '0');
    const avgPrice = executedQty > 0 ? (receivedUsdt / executedQty).toFixed(8) : '0';

    return new Response(
      JSON.stringify({
        success: true,
        orderId: result.orderId,
        symbol: symbol,
        side: 'SELL',
        executedQty: result.executedQty,
        receivedUsdt: receivedUsdt.toFixed(2),
        avgPrice: avgPrice,
        status: result.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'خطأ في تنفيذ البيع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
