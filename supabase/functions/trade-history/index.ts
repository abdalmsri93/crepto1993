import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Binance Trade History Function Starting...');

function getUserIdFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    const json = atob(padded);
    const payload = JSON.parse(json);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch (e) {
    console.error('Failed to decode JWT payload:', e);
    return null;
  }
}

// إنشاء توقيع HMAC-SHA256
async function createSignature(queryString: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(queryString)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(authHeader);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // الحصول على رمز العملة من الطلب
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // الحصول على مفاتيح Binance API
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('binance_api_key, binance_api_secret')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.binance_api_key || !profile?.binance_api_secret) {
      return new Response(
        JSON.stringify({ error: 'Binance API keys not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = profile.binance_api_key;
    const apiSecret = profile.binance_api_secret;

    // جلب سجل الصفقات لهذه العملة
    const tradingPair = `${symbol}USDT`;
    const timestamp = Date.now();
    const queryString = `symbol=${tradingPair}&timestamp=${timestamp}`;
    const signature = await createSignature(queryString, apiSecret);

    console.log(`Fetching trades for ${tradingPair}...`);

    const response = await fetch(
      `https://api.binance.com/api/v3/myTrades?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API error:', errorText);
      
      // إذا لم يكن هناك زوج تداول مع USDT، جرب BUSD
      if (response.status === 400) {
        const busdPair = `${symbol}BUSD`;
        const busdQueryString = `symbol=${busdPair}&timestamp=${timestamp}`;
        const busdSignature = await createSignature(busdQueryString, apiSecret);
        
        const busdResponse = await fetch(
          `https://api.binance.com/api/v3/myTrades?${busdQueryString}&signature=${busdSignature}`,
          {
            headers: { 'X-MBX-APIKEY': apiKey },
          }
        );
        
        if (busdResponse.ok) {
          const busdTrades = await busdResponse.json();
          return processTradesResponse(busdTrades, symbol);
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trade history', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trades = await response.json();
    return processTradesResponse(trades, symbol);

  } catch (error) {
    console.error('Error in trade-history function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processTradesResponse(trades: any[], symbol: string) {
  console.log(`Found ${trades.length} trades for ${symbol}`);
  
  // حساب إجمالي مبلغ الاستثمار (صفقات الشراء فقط)
  let totalInvestment = 0;
  let totalQuantityBought = 0;
  let totalQuantitySold = 0;
  let totalSellValue = 0;
  
  trades.forEach((trade: any) => {
    const qty = parseFloat(trade.qty);
    const price = parseFloat(trade.price);
    const quoteQty = parseFloat(trade.quoteQty); // المبلغ بالـ USDT
    
    if (trade.isBuyer) {
      // صفقة شراء
      totalInvestment += quoteQty;
      totalQuantityBought += qty;
    } else {
      // صفقة بيع
      totalSellValue += quoteQty;
      totalQuantitySold += qty;
    }
  });
  
  // صافي الاستثمار = إجمالي الشراء - إجمالي البيع
  const netInvestment = totalInvestment - totalSellValue;
  
  // متوسط سعر الشراء
  const avgBuyPrice = totalQuantityBought > 0 ? totalInvestment / totalQuantityBought : 0;
  
  // الكمية الصافية (المتبقية)
  const netQuantity = totalQuantityBought - totalQuantitySold;
  
  // تكلفة الأساس للكمية المتبقية
  const costBasis = netQuantity * avgBuyPrice;
  
  const result = {
    symbol,
    totalInvestment: totalInvestment.toFixed(2),        // إجمالي مبلغ الشراء
    totalSellValue: totalSellValue.toFixed(2),          // إجمالي مبلغ البيع
    netInvestment: netInvestment.toFixed(2),            // صافي الاستثمار
    avgBuyPrice: avgBuyPrice.toFixed(8),                // متوسط سعر الشراء
    totalQuantityBought: totalQuantityBought.toFixed(8), // إجمالي الكمية المشتراة
    totalQuantitySold: totalQuantitySold.toFixed(8),    // إجمالي الكمية المباعة
    netQuantity: netQuantity.toFixed(8),                // الكمية المتبقية
    costBasis: costBasis.toFixed(2),                    // تكلفة الأساس
    tradesCount: trades.length,                          // عدد الصفقات
  };
  
  console.log('Investment calculation result:', result);
  
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
