import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test the ticker 24h endpoint
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const data = await response.json();
    
    // Get first 5 symbols to show structure
    const sample = data.slice(0, 5).map((t: any) => ({
      symbol: t.symbol,
      lastPrice: t.lastPrice,
      openPrice: t.openPrice,
      priceChangePercent: t.priceChangePercent
    }));

    console.log('Ticker 24h data sample:', sample);

    return new Response(
      JSON.stringify({
        success: true,
        totalSymbols: data.length,
        sample: sample,
        sampleWithAllFields: data[0]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
