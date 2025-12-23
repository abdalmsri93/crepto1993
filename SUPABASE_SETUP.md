📋 **خطوات إنشاء الجداول يدويًا في Supabase:**

## 1️⃣ اذهب إلى Supabase Dashboard

اضغط على الرابط:
https://supabase.com/dashboard

## 2️⃣ اختر مشروعك

- اختر المشروع: **ftgvxvwvbtfkbgkuccwx**

## 3️⃣ افتح SQL Editor

في القائمة الجانبية اليسرى:
- اضغط على **SQL Editor**
- ثم اضغط **+ New Query**

## 4️⃣ انسخ الكود التالي

```sql
-- جدول المفاتيح المشفرة
CREATE TABLE IF NOT EXISTS encrypted_binance_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret_key TEXT NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل الصفقات
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL(18, 8) NOT NULL,
  price DECIMAL(18, 2) NOT NULL,
  total DECIMAL(18, 2) NOT NULL,
  fee DECIMAL(18, 8) DEFAULT 0,
  fee_asset VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  binance_order_id VARCHAR(100),
  execution_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أخطاء الصفقات
CREATE TABLE IF NOT EXISTS trade_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  trade_params JSONB,
  binance_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل أنشطة التشفير
CREATE TABLE IF NOT EXISTS encryption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_encrypted_keys_user_id ON encrypted_binance_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_symbol ON trade_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_errors_user_id ON trade_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_encryption_logs_user_id ON encryption_logs(user_id);

-- RLS للمفاتيح
ALTER TABLE encrypted_binance_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON encrypted_binance_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON encrypted_binance_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON encrypted_binance_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON encrypted_binance_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS لسجل الصفقات
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON trade_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON trade_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON trade_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS لأخطاء الصفقات
ALTER TABLE trade_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trade errors"
  ON trade_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade errors"
  ON trade_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS لسجل التشفير
ALTER TABLE encryption_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON encryption_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON encryption_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 5️⃣ اضغط RUN

اضغط على الزر الأزرق **RUN** في الأسفل

## ✅ النتيجة المتوقعة

يجب أن ترى رسالة:
- ✅ "Command completed successfully"

بعدها ستكون الجداول جاهزة للاستخدام!

---

## ℹ️ ملاحظات هامة:

1. **RLS (Row Level Security)** - يضمن أن كل مستخدم يرى بيانته فقط
2. **Indexes** - تحسن سرعة الاستعلامات
3. **CHECK Constraints** - تحقق من صحة البيانات (مثل BUY/SELL)
4. **ON DELETE CASCADE** - إذا حذف المستخدم، تحذف جميع بياناته تلقائيًا

---

**بعد إكمال الخطوات أعلاه:**
- العودة إلى التطبيق
- محاولة إدخال مفاتيح Binance API مرة أخرى
- يجب أن تعمل الآن! ✨
