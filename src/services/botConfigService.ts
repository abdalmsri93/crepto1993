/**
 * خدمة مزامنة إعدادات البوت مع Supabase
 * تنقل الإعدادات من localStorage إلى الجدول حتى يعمل البوت بدون متصفح
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpxuacnrncwyopehwxsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweHVhY25ybmN3eW9wZWh3eHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTE1ODksImV4cCI6MjA4MjkyNzU4OX0.1AIdMc4COv30K-XUL3zU6wHAZ_1JlCaNKpmOY90AXRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface BotConfig {
  enabled: boolean;
  last_run?: string;
  last_log?: string;
}

async function getUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/** قراءة إعدادات البوت من Supabase */
export async function getBotConfig(): Promise<BotConfig | null> {
  try {
    const session = await getUserSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('bot_config')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}

/** مزامنة الإعدادات من localStorage → Supabase */
export async function syncBotConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    // جلب مفاتيح Binance (مشفرة) من save-binance-keys
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

    // حفظ المفاتيح المشفرة في bot_config عبر Edge Function
    const saveRes = await fetch(`${SUPABASE_URL}/functions/v1/save-binance-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, secretKey }),
    });

    if (!saveRes.ok) {
      const err = await saveRes.text();
      return { success: false, error: `خطأ في حفظ المفاتيح: ${err}` };
    }

    // تحديث باقي الإعدادات
    const { error } = await supabase
      .from('bot_config')
      .upsert({
        user_id: session.user.id,
        groq_api_key: groqKey,
        profit_percent: profitPercent,
        max_portfolio_coins: maxCoins,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) return { success: false, error: `خطأ: ${error.message}` };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** تفعيل/تعطيل البوت */
export async function setBotEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    // عند التفعيل — تأكد من مزامنة الإعدادات أولاً
    if (enabled) {
      const sync = await syncBotConfig();
      if (!sync.success) return sync;
    }

    const { error } = await supabase
      .from('bot_config')
      .upsert({
        user_id: session.user.id,
        enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** تشغيل البوت يدوياً الآن */
export async function runBotNow(): Promise<{ success: boolean; logs?: string[]; error?: string }> {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/auto-trade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
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
