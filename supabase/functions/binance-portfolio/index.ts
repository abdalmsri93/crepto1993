import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Binance Portfolio Function Starting...');

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    console.log('Resolved user id from JWT:', userId);

    // Get user's Binance API keys from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('binance_api_key, binance_api_secret')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = profile.binance_api_key;
    const apiSecret = profile.binance_api_secret;

    if (!apiKey || !apiSecret) {
      console.log('API Key exists:', !!apiKey);
      console.log('API Secret exists:', !!apiSecret);
      return new Response(
        JSON.stringify({ 
          error: 'Binance API keys not configured',
          message: 'Please add your Binance API keys in Settings'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('API keys found. Key prefix:', apiKey.substring(0, 5) + '...');

    // Create signature for Binance API
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    
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
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Fetch account information from Binance
    const response = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API error:', errorText);
      throw new Error(`Binance API error: ${response.status} - ${errorText}`);
    }

    const accountData = await response.json();
    console.log('Account data received, processing balances...');

    // Filter out zero balances and format data
    const balances = accountData.balances
      .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
      .map((balance: any) => ({
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
      }));

    console.log(`Found ${balances.length} non-zero balances:`, balances.map((b: any) => `${b.asset}: ${b.total}`));

    // If no balances, return empty portfolio
    if (balances.length === 0) {
      console.log('No balances found in account');
      return new Response(
        JSON.stringify({
          balances: [],
          totalValue: '0.00',
          totalDayPnL: '0.00',
          dayPnLPercent: '0.00',
          lastUpdate: new Date().toISOString(),
          message: 'No balances found in your Binance account'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch current prices and 24h stats for all assets
    const pricesResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const allTicker24h = await pricesResponse.json();
    
    console.log('Fetched 24h ticker data, total symbols:', allTicker24h.length);
    
    // Create price and change maps with complete data
    const priceMap = new Map();
    const openPriceMap = new Map();
    const changeMap = new Map();
    
    allTicker24h.forEach((t: any) => {
      const symbol = t.symbol;
      const lastPrice = parseFloat(t.lastPrice);
      const openPrice = parseFloat(t.openPrice);
      const priceChangePercent = parseFloat(t.priceChangePercent);
      
      if (!isNaN(lastPrice)) {
        priceMap.set(symbol, lastPrice);
      }
      if (!isNaN(openPrice)) {
        openPriceMap.set(symbol, openPrice);
      }
      if (!isNaN(priceChangePercent)) {
        changeMap.set(symbol, priceChangePercent);
      }
    });

    console.log('Price maps created with', priceMap.size, 'symbols');
    const sampleSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
    sampleSymbols.forEach(symbol => {
      const data = {
        price: priceMap.get(symbol),
        open: openPriceMap.get(symbol),
        change: changeMap.get(symbol)
      };
      if (data.price || data.open) {
        console.log(`${symbol}:`, data);
      }
    });

    // Calculate USD values and get 24h change for each balance
    const enrichedBalances = balances.map((balance: any) => {
      let usdValue = 0;
      let priceChange = 0;
      let currentPrice = 0;
      let dayPnL = 0;
      let openPrice = 0;
      const asset = balance.asset;
      const quantity = parseFloat(balance.total);
      
      console.log(`[${asset}] Processing: quantity=${quantity}`);
      
      // Try to get price against USDT
      if (asset === 'USDT' || asset === 'USDC' || asset === 'BUSD') {
        currentPrice = 1;
        openPrice = 1;
        usdValue = quantity;
        priceChange = 0;
        dayPnL = 0;
      } else {
        const symbol = `${asset}USDT`;
        const price = priceMap.get(symbol);
        const open = openPriceMap.get(symbol);
        const change = changeMap.get(symbol);
        
        console.log(`[${asset}] Looking up ${symbol}: price=${price} open=${open} change=${change}`);
        
        if (typeof price === 'number' && !isNaN(price)) {
          currentPrice = price;
          usdValue = quantity * currentPrice;
          console.log(`[${asset}]   price found: ${price}, usdValue=${usdValue}`);
        } else {
          console.log(`[${asset}]   price NOT found or invalid`);
        }
        
        if (typeof open === 'number' && !isNaN(open) && typeof price === 'number' && !isNaN(price)) {
          openPrice = open;
          const previousValue = quantity * openPrice;
          dayPnL = usdValue - previousValue;
          console.log(`[${asset}]   openPrice=${open}, dayPnL=${dayPnL}`);
        } else {
          console.log(`[${asset}]   skipping PnL: open=${open} (valid=${typeof open === 'number' && !isNaN(open)})`);
        }
        
        if (typeof change === 'number' && !isNaN(change)) {
          priceChange = change;
        }
      }

      const result = {
        ...balance,
        currentPrice: currentPrice.toFixed(8),
        usdValue: usdValue.toFixed(2),
        dayPnL: dayPnL.toFixed(2),
        priceChangePercent: priceChange.toFixed(2),
      };
      
      console.log(`[${asset}] Result:`, result);
      return result;

    // Sort by USD value
    enrichedBalances.sort((a: any, b: any) => parseFloat(b.usdValue) - parseFloat(a.usdValue));

    // Calculate total portfolio value and total PnL (matching Binance calculation)
    let totalCurrentValue = 0;
    let totalPreviousValue = 0;
    
    enrichedBalances.forEach((b: any) => {
      const currentVal = parseFloat(b.usdValue);
      const dayPnlVal = parseFloat(b.dayPnL);
      const previousVal = currentVal - dayPnlVal;
      
      totalCurrentValue += currentVal;
      totalPreviousValue += previousVal;
      
      console.log(`[${b.asset}] Current: $${currentVal}, Previous: $${previousVal}, PnL: $${dayPnlVal}`);
    });
    
    const totalValue = totalCurrentValue;
    const totalDayPnL = totalCurrentValue - totalPreviousValue;
    const dayPnLPercent = totalPreviousValue > 0 ? (totalDayPnL / totalPreviousValue) * 100 : 0;

    console.log(`Portfolio Total - Current: $${totalCurrentValue.toFixed(2)}, Previous: $${totalPreviousValue.toFixed(2)}, PnL: $${totalDayPnL.toFixed(2)}, PnL%: ${dayPnLPercent.toFixed(2)}%`);

    const response_data = {
      balances: enrichedBalances,
      totalValue: totalValue.toFixed(2),
      totalDayPnL: totalDayPnL.toFixed(2),
      dayPnLPercent: dayPnLPercent.toFixed(2),
      lastUpdate: new Date().toISOString(),
    };
    
    console.log('Final response:', JSON.stringify(response_data, null, 2));

    return new Response(
      JSON.stringify(response_data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in binance-portfolio function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to fetch portfolio data from Binance'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
