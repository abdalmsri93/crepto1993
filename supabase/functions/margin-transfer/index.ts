import { corsHeaders } from '../_shared/cors.ts';

console.log('Margin Transfer Function Starting...');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { apiKey, secretKey, asset, symbol, amount, type } = body;

    if (!apiKey || !secretKey || !asset || !symbol || !amount || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Margin Transfer: ${type} - ${amount} ${asset} for ${symbol}`);

    // إنشاء التوقيع
    const timestamp = Date.now();
    const queryString = `asset=${asset}&symbol=${symbol}&amount=${amount}&transFrom=${type === 'MAIN_TO_MARGIN' ? 'SPOT' : 'ISOLATED_MARGIN'}&transTo=${type === 'MAIN_TO_MARGIN' ? 'ISOLATED_MARGIN' : 'SPOT'}&timestamp=${timestamp}`;

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

    // تنفيذ التحويل
    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/transfer?${queryString}&signature=${signatureHex}`,
      {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Transfer failed:', data);
      return new Response(
        JSON.stringify({ error: data.msg || 'Transfer failed', code: data.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transfer successful:', data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in margin-transfer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
