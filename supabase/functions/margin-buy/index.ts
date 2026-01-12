import { corsHeaders } from '../_shared/cors.ts';

console.log('Margin Buy Function Starting...');

/**
 * Edge Function موحدة للشراء بالرافعة المالية
 * تدمج: التحويل + الاقتراض + الشراء في خطوة واحدة
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { apiKey, secretKey, symbol, amount, leverage } = body;

    if (!apiKey || !secretKey || !symbol || !amount || !leverage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const effectiveAmount = amount * leverage;
    console.log(`⚡ Margin Buy: ${symbol} - Amount: $${amount} - Leverage: ${leverage}x - Effective: $${effectiveAmount}`);

    // Helper function to create signature
    const createSignature = async (queryString: string) => {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const timestamp = Date.now();

    // ====== Step 1: Transfer USDT to Isolated Margin ======
    console.log('📤 Step 1: Transferring to Isolated Margin...');
    
    const transferParams = `asset=USDT&symbol=${symbol}&amount=${amount}&transFrom=SPOT&transTo=ISOLATED_MARGIN&timestamp=${timestamp}`;
    const transferSig = await createSignature(transferParams);
    
    const transferResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/transfer?${transferParams}&signature=${transferSig}`,
      {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': apiKey },
      }
    );

    if (!transferResponse.ok) {
      const error = await transferResponse.json();
      console.error('❌ Transfer failed:', error);
      
      // Check if it's because margin is not enabled for this pair
      if (error.code === -11001 || error.msg?.includes('not exist')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Margin not supported for this pair',
            code: error.code 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: error.msg || 'Transfer failed', code: error.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Transfer successful');

    // ====== Step 2: Borrow additional amount ======
    const borrowAmount = amount * (leverage - 1);
    if (borrowAmount > 0) {
      console.log(`💰 Step 2: Borrowing $${borrowAmount}...`);
      
      const borrowTimestamp = Date.now();
      const borrowParams = `asset=USDT&amount=${borrowAmount}&isIsolated=TRUE&symbol=${symbol}&timestamp=${borrowTimestamp}`;
      const borrowSig = await createSignature(borrowParams);
      
      const borrowResponse = await fetch(
        `https://api.binance.com/sapi/v1/margin/loan?${borrowParams}&signature=${borrowSig}`,
        {
          method: 'POST',
          headers: { 'X-MBX-APIKEY': apiKey },
        }
      );

      if (!borrowResponse.ok) {
        const error = await borrowResponse.json();
        console.error('❌ Borrow failed:', error);
        
        // Rollback: Transfer back to SPOT
        const rollbackTimestamp = Date.now();
        const rollbackParams = `asset=USDT&symbol=${symbol}&amount=${amount}&transFrom=ISOLATED_MARGIN&transTo=SPOT&timestamp=${rollbackTimestamp}`;
        const rollbackSig = await createSignature(rollbackParams);
        
        await fetch(
          `https://api.binance.com/sapi/v1/margin/isolated/transfer?${rollbackParams}&signature=${rollbackSig}`,
          {
            method: 'POST',
            headers: { 'X-MBX-APIKEY': apiKey },
          }
        );
        
        return new Response(
          JSON.stringify({ success: false, error: error.msg || 'Borrow failed', code: error.code }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Borrow successful');
    }

    // ====== Step 3: Execute Market Buy Order ======
    console.log(`📊 Step 3: Executing buy order for $${effectiveAmount}...`);
    
    const orderTimestamp = Date.now();
    const orderParams = `symbol=${symbol}&side=BUY&type=MARKET&quoteOrderQty=${effectiveAmount}&isIsolated=TRUE&timestamp=${orderTimestamp}`;
    const orderSig = await createSignature(orderParams);
    
    const orderResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/order?${orderParams}&signature=${orderSig}`,
      {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': apiKey },
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('❌ Order failed:', orderData);
      return new Response(
        JSON.stringify({ success: false, error: orderData.msg || 'Order failed', code: orderData.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order successful:', orderData);

    // Calculate average price
    const executedQty = parseFloat(orderData.executedQty || '0');
    const cummulativeQuoteQty = parseFloat(orderData.cummulativeQuoteQty || '0');
    const avgPrice = executedQty > 0 ? (cummulativeQuoteQty / executedQty).toFixed(8) : '0';

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.orderId,
        symbol: orderData.symbol,
        executedQty: orderData.executedQty,
        cummulativeQuoteQty: orderData.cummulativeQuoteQty,
        avgPrice,
        status: orderData.status,
        leverage,
        originalAmount: amount,
        effectiveAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in margin-buy:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
