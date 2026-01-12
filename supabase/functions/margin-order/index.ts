import { corsHeaders } from '../_shared/cors.ts';

console.log('Margin Order Function Starting...');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      apiKey, 
      secretKey, 
      symbol, 
      side, 
      type, 
      quantity, 
      quoteOrderQty,
      price,
      isIsolated,
      sideEffectType // NO_SIDE_EFFECT, MARGIN_BUY, AUTO_REPAY
    } = body;

    if (!apiKey || !secretKey || !symbol || !side || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Margin Order: ${side} ${symbol} - Type: ${type}`);

    // إنشاء التوقيع
    const timestamp = Date.now();
    const params: Record<string, any> = {
      symbol,
      side,
      type,
      timestamp,
    };

    if (quantity) params.quantity = quantity;
    if (quoteOrderQty) params.quoteOrderQty = quoteOrderQty;
    if (price) params.price = price;
    if (isIsolated) params.isIsolated = 'TRUE';
    if (sideEffectType) params.sideEffectType = sideEffectType;
    if (type === 'LIMIT') params.timeInForce = 'GTC';

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(queryString)
    );

    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // تنفيذ الأمر
    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/order?${queryString}&signature=${signatureHex}`,
      {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Order failed:', data);
      return new Response(
        JSON.stringify({ error: data.msg || 'Order failed', code: data.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order successful:', data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in margin-order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
