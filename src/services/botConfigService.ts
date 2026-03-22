/**
 * خدمة مزامنة إعدادات البوت مع Supabase
 * تنقل الإعدادات من localStorage إلى الجدول حتى يعمل البوت بدون متصفح
 */

const SUPABASE_URL = 'https://dpxuacnrncwyopehwxsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHVhY25ybmN3eW9wZWh3eHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUyNjIsImV4cCI6MjA0OTg2MTI2Mn0.cN5y3IvxZmE4aB0FXiWsN3h1sQT_m_OscmQCBtF7aXY';

export interface BotConfig {
  enabled: boolean;
  last_run?: string;
  last_log?: string;
}

async function dbRequest(method: string, body?: object) {
  return fetch(`${SUPABASE_URL}/rest/v1/bot_config?id=eq.1`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'PATCH' ? 'return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** قراءة إعدادات البوت من Supabase */
export async function getBotConfig(): Promise<BotConfig | null> {
  try {
    const res = await dbRequest('GET');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

/** مزامنة الإعدادات من localStorage → Supabase */
export async function syncBotConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    // جلب مفاتيح Binance
    const creds = localStorage.getItem('binance_credentials');
    if (!creds) return { success: false, error: 'أدخل مفاتيح Binance أولاً من الإعدادات' };
    const { apiKey, secretKey } = JSON.parse(creds);
    if (!apiKey || !secretKey) return { success: false, error: 'مفاتيح Binance غير مكتملة' };

    // جلب Groq key
    const groqKey = localStorage.getItem('groq_api_key') || '';

    // جلب نسبة الربح
    const stateRaw = localStorage.getItem('smart_trading_state');
    const profitPercent = stateRaw ? (JSON.parse(stateRaw).currentProfitPercent || 3) : 3;

    // جلب الحد الأقصى للعملات
    const settingsRaw = localStorage.getItem('smart_trading_settings');
    const maxCoins = settingsRaw ? (JSON.parse(settingsRaw).maxPortfolioCoins || 20) : 20;

    const res = await dbRequest('PATCH', {
      binance_api_key: apiKey,
      binance_secret_key: secretKey,
      groq_api_key: groqKey,
      profit_percent: profitPercent,
      max_portfolio_coins: maxCoins,
      updated_at: new Date().toISOString(),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `خطأ: ${err}` };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** تفعيل/تعطيل البوت */
export async function setBotEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // عند التفعيل — تأكد من مزامنة الإعدادات أولاً
    if (enabled) {
      const sync = await syncBotConfig();
      if (!sync.success) return sync;
    }

    const res = await dbRequest('PATCH', { enabled, updated_at: new Date().toISOString() });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** تشغيل البوت يدوياً الآن */
export async function runBotNow(): Promise<{ success: boolean; logs?: string[]; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/auto-trade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
