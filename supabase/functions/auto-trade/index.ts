/**
 * 🤖 Auto-Trade Edge Function
 * يعمل 24/7 على سيرفر Supabase — بدون الحاجة لفتح المتصفح
 * يبحث عن عملات، يشتري، ويضع Limit Sell تلقائياً
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptAES } from '../_shared/aes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BINANCE_API = 'https://api.binance.com';

// =====================
// Supabase Client
// =====================
function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// =====================
// HMAC-SHA256 Signature
// =====================
async function createSignature(queryString: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// =====================
// Binance: USDT Balance
// =====================
async function getUSDTBalance(apiKey: string, secretKey: string): Promise<number> {
  const ts = Date.now();
  const qs = `timestamp=${ts}`;
  const sig = await createSignature(qs, secretKey);
  const res = await fetch(`${BINANCE_API}/api/v3/account?${qs}&signature=${sig}`, {
    headers: { 'X-MBX-APIKEY': apiKey }
  });
  if (!res.ok) throw new Error('فشل جلب الرصيد');
  const data = await res.json();
  const usdt = data.balances?.find((b: any) => b.asset === 'USDT');
  return usdt ? parseFloat(usdt.free) : 0;
}

// =====================
// Binance: Portfolio Count (non-USDT coins > $1)
// =====================
async function getPortfolioCount(apiKey: string, secretKey: string): Promise<number> {
  const ts = Date.now();
  const qs = `timestamp=${ts}`;
  const sig = await createSignature(qs, secretKey);
  const res = await fetch(`${BINANCE_API}/api/v3/account?${qs}&signature=${sig}`, {
    headers: { 'X-MBX-APIKEY': apiKey }
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const prices = await fetch(`${BINANCE_API}/api/v3/ticker/price`).then(r => r.json());
  const priceMap: Record<string, number> = {};
  for (const p of prices) priceMap[p.symbol] = parseFloat(p.price);

  return (data.balances || []).filter((b: any) => {
    if (b.asset === 'USDT' || b.asset === 'BNB') return false;
    const qty = parseFloat(b.free) + parseFloat(b.locked);
    const price = priceMap[`${b.asset}USDT`] || 0;
    return qty * price > 1;
  }).length;
}

// =====================
// Binance: Symbol Info
// =====================
async function getSymbolInfo(symbol: string): Promise<{ stepSize: number; minQty: number; tickSize: number }> {
  try {
    const res = await fetch(`${BINANCE_API}/api/v3/exchangeInfo?symbol=${symbol}`);
    const data = await res.json();
    const filters = data.symbols?.[0]?.filters || [];
    const lot = filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const price = filters.find((f: any) => f.filterType === 'PRICE_FILTER');
    return {
      stepSize: parseFloat(lot?.stepSize || '0.00001'),
      minQty: parseFloat(lot?.minQty || '0.00001'),
      tickSize: parseFloat(price?.tickSize || '0.00001'),
    };
  } catch {
    return { stepSize: 0.00001, minQty: 0.00001, tickSize: 0.00001 };
  }
}

// =====================
// Binance: Market Buy
// =====================
async function marketBuy(apiKey: string, secretKey: string, symbol: string, usdtAmount: number): Promise<any> {
  const ts = Date.now();
  const params = new URLSearchParams({
    symbol, side: 'BUY', type: 'MARKET',
    quoteOrderQty: usdtAmount.toFixed(2),
    timestamp: ts.toString(),
  });
  const sig = await createSignature(params.toString(), secretKey);
  params.append('signature', sig);
  const res = await fetch(`${BINANCE_API}/api/v3/order?${params.toString()}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': apiKey },
  });
  return await res.json();
}

// =====================
// Binance: Limit Sell
// =====================
async function limitSell(apiKey: string, secretKey: string, symbol: string, quantity: number, price: number): Promise<any> {
  const info = await getSymbolInfo(symbol);
  const adjQty = Math.floor(quantity / info.stepSize) * info.stepSize;
  const adjPrice = Math.round(price / info.tickSize) * info.tickSize;

  const ts = Date.now();
  const params = new URLSearchParams({
    symbol, side: 'SELL', type: 'LIMIT', timeInForce: 'GTC',
    quantity: adjQty.toFixed(8).replace(/\.?0+$/, ''),
    price: adjPrice.toFixed(8).replace(/\.?0+$/, ''),
    timestamp: ts.toString(),
  });
  const sig = await createSignature(params.toString(), secretKey);
  params.append('signature', sig);
  const res = await fetch(`${BINANCE_API}/api/v3/order?${params.toString()}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': apiKey },
  });
  return await res.json();
}

// =====================
// Pre-Score (0-10)
// =====================
const WHITELIST = ['BTC','ETH','BNB','SOL','ADA','DOT','LINK','MATIC','AVAX','UNI','LTC','ATOM','XLM','VET','FIL','TRX','ETC','ALGO','XMR','NEAR','FTM','ICP','THETA','EOS','XTZ'];
const BLACKLIST = ['LUNA','LUNC','UST','FTT','SRM','MAPS','OXY','COPE','MER','MEDIA','TULIP','PORT','SLND','SUNNY'];

function preScore(ticker: any): number {
  let score = 0;
  const vol = parseFloat(ticker.quoteVolume || 0);
  const change = parseFloat(ticker.priceChangePercent || 0);
  const high = parseFloat(ticker.highPrice || 0);
  const low = parseFloat(ticker.lowPrice || 0);
  const last = parseFloat(ticker.lastPrice || 0);
  const trades = parseInt(ticker.count || 0);
  const sym = ticker.symbol.replace('USDT', '');

  if (vol >= 5_000_000) score += 3;
  else if (vol >= 1_000_000) score += 2;
  else if (vol >= 300_000) score += 1;

  if (change >= -3 && change <= 1) score += 2;
  else if (change >= -5 && change <= 2.5) score += 1;

  if (high > low && last > 0) {
    const pos = ((last - low) / (high - low)) * 100;
    if (pos <= 25) score += 2;
    else if (pos <= 45) score += 1;
  }

  if (trades >= 10000) score += 2;
  else if (trades >= 3000) score += 1;

  if (WHITELIST.includes(sym)) score += 1;

  return Math.min(10, score);
}

// =====================
// Groq AI Analysis
// =====================
async function analyzeWithGroq(groqKey: string, ticker: any, profitPercent: number): Promise<boolean> {
  const sym = ticker.symbol;
  const price = parseFloat(ticker.lastPrice);
  const change = parseFloat(ticker.priceChangePercent);
  const vol = parseFloat(ticker.quoteVolume);
  const high = parseFloat(ticker.highPrice);
  const low = parseFloat(ticker.lowPrice);
  const trades = parseInt(ticker.count);
  const pos = high > low ? Math.round(((price - low) / (high - low)) * 100) : 50;
  const score = preScore(ticker);

  const prompt = `أنت متداول محترف. قيّم فرصة شراء ${sym} قصير المدى (هدف +${profitPercent}%).

السعر: $${price} | التغير 24h: ${change.toFixed(2)}%
الأعلى/الأدنى: $${high}/$${low} | الموضع: ${pos}%
الحجم: $${(vol/1e6).toFixed(2)}M | الصفقات: ${trades.toLocaleString()}
درجة الجودة: ${score}/10

معايير الشراء الجيد:
✅ موضع < 40% (قريب من القاع)
✅ تغير بين -5% و +2%
✅ حجم > $1M
❌ تجنب: pump، حجم منخفض، تغير > +5%

أجب بالصيغة التالية فقط:
RECOMMENDED: [YES/NO]
CONFIDENCE: [HIGH/MEDIUM/LOW]
REASON: [سبب قصير]`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });
    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content || '').toUpperCase();
    return text.includes('RECOMMENDED: YES') && !text.includes('RECOMMENDED: NO');
  } catch {
    return false;
  }
}

// =====================
// Main Handler
// =====================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(`[${new Date().toISOString().slice(11,19)}] ${msg}`); console.log(msg); };

  try {
    // 1. قراءة إعدادات جميع المستخدمين المفعّلين
    const { data: configs, error: configErr } = await supabase
      .from('bot_config').select('*').eq('enabled', true);

    if (configErr || !configs || configs.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'لا يوجد بوت مفعّل' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const allResults = [];

    for (const config of configs) {
    logs.length = 0; // تصفير اللوق لكل مستخدم

    if (!config.binance_api_key || !config.binance_secret_key) {
      logs.push(`⚠️ مفاتيح Binance غير موجودة للمستخدم ${config.user_id}`);
      allResults.push({ user_id: config.user_id, success: false, error: 'مفاتيح غير موجودة' });
      continue;
    }

    const encKey = Deno.env.get('BINANCE_ENCRYPTION_KEY')!;
    const encIv = Deno.env.get('BINANCE_ENCRYPTION_IV')!;
    const apiKey = await decryptAES(config.binance_api_key, encKey, encIv);
    const secretKey = await decryptAES(config.binance_secret_key, encKey, encIv);
    const { groq_api_key: groqKey, profit_percent: profitPercent, max_portfolio_coins: maxCoins } = config;

    log(`🤖 بدء دورة البوت | هدف الربح: ${profitPercent}% | أقصى عملات: ${maxCoins}`);

    // 2. فحص المحفظة
    const portfolioCount = await getPortfolioCount(apiKey, secretKey);
    log(`📊 عملات في المحفظة: ${portfolioCount}/${maxCoins}`);

    if (portfolioCount >= maxCoins) {
      log(`⛔ المحفظة ممتلئة — لا شراء جديد`);
      await supabase.from('bot_config').update({ last_run: new Date().toISOString(), last_log: logs.join('\n') }).eq('user_id', config.user_id);
      return new Response(JSON.stringify({ success: true, message: 'المحفظة ممتلئة', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. جلب الرصيد
    const usdtBalance = await getUSDTBalance(apiKey, secretKey);
    const buyAmount = Math.min(200, Math.max(5, usdtBalance * 0.05));
    log(`💰 رصيد USDT: $${usdtBalance.toFixed(2)} | مبلغ الشراء: $${buyAmount.toFixed(2)}`);

    if (usdtBalance < 5) {
      log(`⛔ الرصيد غير كافٍ`);
      await supabase.from('bot_config').update({ last_run: new Date().toISOString(), last_log: logs.join('\n') }).eq('user_id', config.user_id);
      return new Response(JSON.stringify({ success: true, message: 'رصيد غير كافٍ', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. جلب تيكرات Binance
    log(`📡 جلب بيانات السوق من Binance...`);
    const tickersRes = await fetch(`${BINANCE_API}/api/v3/ticker/24hr`);
    const tickers: any[] = await tickersRes.json();

    // 5. تحديد نطاق السعر حسب نسبة الربح
    const PRICE_MAP: Record<number, number> = { 3: 5, 5: 3, 7: 2, 9: 1, 11: 0.5, 13: 0.3, 15: 0.2 };
    const maxPrice = PRICE_MAP[profitPercent] || 5;

    // 6. فلترة وتقييم العملات
    const filtered = tickers.filter((t: any) => {
      if (!t.symbol.endsWith('USDT')) return false;
      const sym = t.symbol.replace('USDT', '');
      if (BLACKLIST.includes(sym)) return false;
      const price = parseFloat(t.lastPrice);
      if (price < 0.0001 || price > maxPrice) return false;
      const change = parseFloat(t.priceChangePercent);
      if (change < -10 || change > 3) return false;
      const vol = parseFloat(t.quoteVolume);
      if (vol < 300_000) return false;
      return true;
    });

    log(`🔍 عملات بعد الفلترة: ${filtered.length}`);

    // إضافة Pre-Score وترتيب
    const scored = filtered
      .map((t: any) => ({ ...t, _score: preScore(t) }))
      .filter((t: any) => t._score >= 5)
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, 8);

    log(`⭐ أفضل ${scored.length} عملة للتحليل`);

    if (scored.length === 0) {
      log(`😴 لا توجد عملات مناسبة الآن`);
      await supabase.from('bot_config').update({ last_run: new Date().toISOString(), last_log: logs.join('\n') }).eq('user_id', config.user_id);
      return new Response(JSON.stringify({ success: true, message: 'لا توجد فرص الآن', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. تحليل AI وشراء
    let bought = false;

    for (const ticker of scored) {
      if (bought) break;
      const sym = ticker.symbol; // e.g. XYZUSDT

      log(`🔎 تحليل ${sym} (Score: ${ticker._score}/10)...`);

      // تحليل Groq
      let aiRecommended = false;
      if (groqKey) {
        aiRecommended = await analyzeWithGroq(groqKey, ticker, profitPercent);
        log(`🤖 AI → ${aiRecommended ? '✅ يوصي بالشراء' : '❌ لا يوصي'}`);
        await new Promise(r => setTimeout(r, 1200)); // تجنب rate limit
      } else {
        // بدون Groq: اعتمد على Pre-Score فقط
        aiRecommended = ticker._score >= 7;
        log(`📊 بدون AI — Score ${ticker._score}/10 → ${aiRecommended ? '✅ مقبول' : '❌ مرفوض'}`);
      }

      if (!aiRecommended) continue;

      // شراء
      log(`💳 شراء ${sym} بـ $${buyAmount.toFixed(2)}...`);
      const buyResult = await marketBuy(apiKey, secretKey, sym, buyAmount);

      if (buyResult.code) {
        log(`❌ فشل الشراء: ${buyResult.msg}`);
        continue;
      }

      const executedQty = parseFloat(buyResult.executedQty || '0');
      const avgPrice = buyResult.fills?.length > 0
        ? parseFloat(buyResult.fills[0].price)
        : parseFloat(buyResult.cummulativeQuoteQty) / executedQty;

      log(`✅ تم الشراء! الكمية: ${executedQty} | متوسط السعر: $${avgPrice.toFixed(6)}`);
      bought = true;

      // Limit Sell
      const targetPrice = avgPrice * (1 + profitPercent / 100);
      log(`🎯 وضع Limit Sell @ $${targetPrice.toFixed(6)} (+${profitPercent}%)...`);

      const sellResult = await limitSell(apiKey, secretKey, sym, executedQty, targetPrice);

      if (sellResult.code) {
        log(`⚠️ تعذّر Limit Sell: ${sellResult.msg} — Binance لن يبيع تلقائياً`);
      } else {
        log(`✅ Limit Sell Order #${sellResult.orderId} — Binance سيبيع عند الهدف تلقائياً`);
      }
    }

    if (!bought) {
      log(`😴 لم يُوصَ بأي عملة في هذه الدورة`);
    }

    // 8. تحديث آخر تشغيل في Supabase
    await supabase.from('bot_config').update({
      last_run: new Date().toISOString(),
      last_log: logs.join('\n'),
      updated_at: new Date().toISOString(),
    }).eq('user_id', config.user_id);

    log(`✅ انتهت الدورة للمستخدم ${config.user_id}`);
    allResults.push({ user_id: config.user_id, success: true, bought, logs: [...logs] });

    } // نهاية loop المستخدمين

    return new Response(JSON.stringify({ success: true, results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('❌ خطأ في البوت:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
