-- =====================================================
-- جدول إعدادات البوت التلقائي (يعمل 24/7 على السيرفر)
-- =====================================================

CREATE TABLE IF NOT EXISTS bot_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  binance_api_key TEXT DEFAULT '',
  binance_secret_key TEXT DEFAULT '',
  groq_api_key TEXT DEFAULT '',
  profit_percent INTEGER DEFAULT 3,
  max_portfolio_coins INTEGER DEFAULT 20,
  enabled BOOLEAN DEFAULT false,
  last_run TIMESTAMP WITH TIME ZONE,
  last_log TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- صف واحد دائماً
INSERT INTO bot_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- بدون RLS — التطبيق بدون تسجيل دخول
ALTER TABLE bot_config DISABLE ROW LEVEL SECURITY;
