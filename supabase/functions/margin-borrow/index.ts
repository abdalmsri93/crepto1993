import { corsHeaders } from '../_shared/cors.ts';

console.log('Margin Borrow Function Starting...');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { apiKey, secretKey, asset, symbol, amount, isIsolated } = body;

    if (!apiKey || !secretKey || !asset || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💰 Margin Borrow: ${amount} ${asset} for ${symbol || 'Cross'}`);

    // إنشاء التوقيع
    const timestamp = Date.now();
    let queryString = `asset=${asset}&amount=${amount}&timestamp=${timestamp}`;
    
    if (isIsolated && symbol) {
      queryString += `&isIsolated=TRUE&symbol=${symbol}`;
    }

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

    // تنفيذ الاقتراض
    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/loan?${queryString}&signature=${signatureHex}`,
      {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Borrow failed:', data);
      return new Response(
        JSON.stringify({ error: data.msg || 'Borrow failed', code: data.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Borrow successful:', data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in margin-borrow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
