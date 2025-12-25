#!/usr/bin/env node

/**
 * 🤖 خدمة البحث التلقائي عن العملات
 * تعمل في الخلفية 24/7 بدون متصفح
 * تجلب 5 عملات، تحللها، وتضيفها للمفضلات تلقائياً
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// التحقق من وجود المفاتيح
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ خطأ: مفاتيح Supabase غير موجودة في .env');
  process.exit(1);
}

if (!GROQ_API_KEY || !GEMINI_API_KEY) {
  console.warn('⚠️ تحذير: مفاتيح AI غير موجودة - سيتم تشغيل البحث بدون تحليل');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * جلب 5 عملات عشوائية من Binance مع تطبيق الفلاتر
 */
async function fetchCoins() {
  try {
    console.log('📊 جاري جلب العملات من Binance...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
    
    const tickers = await response.json();
    
    // تصفية العملات
    const usdtCoins = tickers.filter(t => t.symbol && t.symbol.endsWith('USDT'));
    
    console.log(`📈 وجدنا ${usdtCoins.length} عملة USDT`);
    
    // تطبيق الشروط الأساسية - بسيطة جداً للاختبار
    let filtered = usdtCoins.slice(0, 50).map(t => {
      const symbol = t.symbol.replace('USDT', '');
      return {
        symbol,
        name: symbol,
        price: t.lastPrice,
        priceChange: parseFloat(t.priceChangePercent) || 0,
        volume: parseFloat(t.quoteAssetVolume) || 0,
      };
    });

    console.log(`✅ بعد الفلاتر: ${filtered.length} عملة`);

    // اختيار 5 عملات عشوائية
    const selected = [];
    for (let i = 0; i < 5 && filtered.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      selected.push(filtered[randomIndex]);
      filtered.splice(randomIndex, 1);
    }

    console.log(`✅ تم اختيار ${selected.length} عملة`);
    return selected;
  } catch (error) {
    console.error('❌ خطأ في جلب العملات:', error.message);
    return [];
  }
}

/**
 * تحليل العملة بـ Groq (ChatGPT بديل)
 */
async function analyzeWithGroq(coin) {
  try {
    if (!GROQ_API_KEY) return null;

    const prompt = `
    حلل هذه العملة بسرعة:
    العملة: ${coin.symbol}
    السعر: $${coin.price}
    التغير 24س: ${coin.priceChange}%
    
    أجب بـ JSON فقط:
    {
      "recommendation": "شراء" أو "بيع" أو "احتفاظ",
      "confidence": 0-100,
      "reason": "السبب بالعربية"
    }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Groq API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ خطأ في تحليل Groq: ${error.message}`);
    return null;
  }
}

/**
 * تحليل العملة بـ Gemini
 */
async function analyzeWithGemini(coin) {
  try {
    if (!GEMINI_API_KEY) return null;

    const prompt = `
    تحليل سريع للعملة:
    ${coin.symbol} - السعر: $${coin.price} - التغير: ${coin.priceChange}%
    
    استجب بـ JSON:
    {
      "recommendation": "شراء" أو "بيع" أو "احتفاظ",
      "confidence": 0-100,
      "reason": "السبب"
    }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ Gemini API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ خطأ في تحليل Gemini: ${error.message}`);
    return null;
  }
}

/**
 * إضافة العملة للمفضلات في قاعدة البيانات
 */
async function addToFavorites(coin) {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        priceChange: coin.priceChange,
        addedAt: new Date().toISOString(),
        source: 'auto-search',
      });

    if (error) throw error;
    
    console.log(`✅ تمت إضافة ${coin.symbol} للمفضلات`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في إضافة ${coin.symbol}:`, error.message);
    return false;
  }
}

/**
 * البحث والتحليل والإضافة بشكل تلقائي
 */
async function runAutoSearch() {
  console.log(`\n🚀 بدء دورة البحث الآلي - ${new Date().toLocaleString('ar-SA')}`);
  
  // جلب العملات
  const coins = await fetchCoins();
  if (coins.length === 0) {
    console.log('⚠️ لم يتم جلب أي عملات');
    return;
  }

  // تحليل وإضافة كل عملة
  let addedCount = 0;
  for (const coin of coins) {
    console.log(`\n🔍 تحليل ${coin.symbol}...`);
    
    // تحليل بواسطة كلا الـ AI
    const groqResult = await analyzeWithGroq(coin);
    const geminiResult = await analyzeWithGemini(coin);
    
    // التحقق من التوصيات
    const groqBuy = groqResult?.recommendation === 'شراء';
    const geminiBuy = geminiResult?.recommendation === 'شراء';
    
    console.log(`  Groq: ${groqResult?.recommendation || 'N/A'} (${groqResult?.confidence || 0}%)`);
    console.log(`  Gemini: ${geminiResult?.recommendation || 'N/A'} (${geminiResult?.confidence || 0}%)`);
    
    // إذا اتفقا على الشراء
    if (groqBuy && geminiBuy) {
      console.log(`  ✨ اتفقا على الشراء!`);
      const success = await addToFavorites(coin);
      if (success) addedCount++;
    } else {
      console.log(`  ❌ لم يتفقا على التوصية`);
    }
    
    // تأخير لتجنب spam الـ API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✅ انتهت الدورة - تمت إضافة ${addedCount} عملة`);
}

/**
 * تشغيل البحث بشكل دوري
 */
async function startService() {
  console.log('🟢 خدمة البحث الآلي تم تشغيلها');
  console.log('⏰ ستبدأ دورة بحث كل 60 ثانية');
  console.log('اضغط Ctrl+C للإيقاف\n');
  
  // تشغيل فوري
  await runAutoSearch();
  
  // ثم تكرار كل 60 ثانية
  setInterval(runAutoSearch, 60000);
}

// بدء الخدمة
startService().catch(error => {
  console.error('❌ خطأ في خدمة البحث:', error);
  process.exit(1);
});
