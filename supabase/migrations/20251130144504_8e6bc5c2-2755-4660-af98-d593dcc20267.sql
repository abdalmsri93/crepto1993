-- إنشاء جدول لحالات تنفيذ التوصيات
CREATE TABLE public.recommendation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coin_symbol TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- احتفاظ، شراء، بيع، مراقبة
  status TEXT NOT NULL DEFAULT 'لم ينفذ', -- تم التنفيذ، قيد التنفيذ، لم ينفذ
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, coin_symbol)
);

-- تفعيل RLS
ALTER TABLE public.recommendation_status ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان: المستخدمون يمكنهم قراءة سجلاتهم فقط
CREATE POLICY "Users can view own recommendation status"
ON public.recommendation_status
FOR SELECT
USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إدراج سجلاتهم
CREATE POLICY "Users can insert own recommendation status"
ON public.recommendation_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث سجلاتهم
CREATE POLICY "Users can update own recommendation status"
ON public.recommendation_status
FOR UPDATE
USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف سجلاتهم
CREATE POLICY "Users can delete own recommendation status"
ON public.recommendation_status
FOR DELETE
USING (auth.uid() = user_id);

-- إضافة trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_recommendation_status_updated_at
BEFORE UPDATE ON public.recommendation_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();