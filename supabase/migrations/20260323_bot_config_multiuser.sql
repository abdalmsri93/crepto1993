-- =====================================================
-- تحويل bot_config لدعم متعدد المستخدمين
-- =====================================================

-- حذف قيد الصف الواحد
ALTER TABLE bot_config DROP CONSTRAINT IF EXISTS single_row;

-- إضافة عمود user_id
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- فهرس فريد على user_id
CREATE UNIQUE INDEX IF NOT EXISTS bot_config_user_id_idx ON bot_config(user_id) WHERE user_id IS NOT NULL;

-- حذف الصف القديم id=1 بدون يوزر
DELETE FROM bot_config WHERE user_id IS NULL;

-- تفعيل RLS
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;

-- صلاحية المستخدم لإعداداته فقط
CREATE POLICY "Users manage own bot config" ON bot_config
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- صلاحية كاملة لـ service_role (Edge Functions)
CREATE POLICY "Service role full access" ON bot_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);
