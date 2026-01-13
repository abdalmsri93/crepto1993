const crypto = require('crypto');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { apiKey, secretKey, symbol, amount } = JSON.parse(event.body);

    if (!apiKey || !secretKey || !symbol || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Binance API
    const timestamp = Date.now();
    const params = `symbol=${symbol}&side=BUY&type=MARKET&quoteOrderQty=${amount}&timestamp=${timestamp}`;
    
    // Create signature
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/order?${params}&signature=${signature}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok || data.code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.msg || 'Failed to buy', code: data.code }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
