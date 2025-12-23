📌 **الخطوات اللازمة لإنشاء الجداول:**

## 1️⃣ استخرج Service Role Key

اتبع هذه الخطوات:

1. اذهب إلى: https://supabase.com/dashboard
2. اختر المشروع: **ftgvxvwvbtfkbgkuccwx**
3. في الشريط الجانبي اختر: **Settings** → **API**
4. ابحث عن قسم **Project API keys**
5. انسخ المفتاح تحت **service_role secret** (المفتاح الطويل جداً)

## 2️⃣ أنشئ ملف .env.local

في جذر المشروع (نفس مستوى package.json)، أنشئ ملف باسم `.env.local` وأضف:

```env
VITE_SUPABASE_URL="https://ftgvxvwvbtfkbgkuccwx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z3Z4dnd2YnRma2Jna3VjY3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzEwMjYsImV4cCI6MjA3OTY0NzAyNn0.38ttXMQK9f9Mzi054T-srCIb6uojWTh1ZPDktApdDdY"
SUPABASE_SERVICE_ROLE_KEY="PUT_SERVICE_ROLE_KEY_HERE"
```

> ⚠️ استبدل `PUT_SERVICE_ROLE_KEY_HERE` بالمفتاح الذي نسخته

## 3️⃣ شغل الـ Script

في Terminal:

```bash
node setup-database.js
```

---

**النتيجة المتوقعة:**
```
✅ تم إنشاء الجداول بنجاح!
✨ يمكنك الآن استخدام تطبيق Binance Watch Live
```
