-- RLS لسجل أنشطة التشفير
ALTER TABLE encryption_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own encryption logs"
  ON encryption_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own encryption logs"
  ON encryption_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
