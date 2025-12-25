# 🤖 دليل تثبيت خدمة البحث الآلي

## المميزات ✨

- 🔄 **بحث تلقائي دوري**: كل 60 ثانية
- 🎯 **5 عملات في كل دورة**: مع تطبيق جميع الفلاتر
- 🤖 **تحليل ثنائي الذكاء**: ChatGPT (Groq) + Gemini
- 💾 **حفظ تلقائي**: في قاعدة البيانات
- 🌙 **عمل 24/7**: حتى بدون متصفح
- ⚡ **سريع وخفيف**: استهلاك منخفض للموارد

---

## المتطلبات 📋

✅ Node.js 14+ (تحقق بـ: `node --version`)
✅ npm (تحقق بـ: `npm --version`)
✅ ملف .env بـ مفاتيح API
✅ اتصال إنترنت

---

## خطوات التثبيت 🚀

### 1️⃣ **بدء يدوي (للاختبار)**

```powershell
# افتح PowerShell في مجلد المشروع
cd C:\Users\YOUR_USERNAME\Desktop\binance-watch-live

# تشغيل الخدمة
node auto-search-service.js
```

ستظهر رسائل مثل:
```
🟢 خدمة البحث الآلي تم تشغيلها
⏰ ستبدأ دورة بحث كل 60 ثانية
🚀 بدء دورة البحث الآلي - 12/25/2025 3:00 PM
📊 جاري جلب العملات من Binance...
✅ تم جلب 5 عملات
```

---

### 2️⃣ **تشغيل تلقائي عند فتح الجهاز**

#### الطريقة الأولى: Windows Task Scheduler (الأفضل)

```powershell
# افتح PowerShell كـ Admin وشغل:
$taskName = "BinanceAutoSearch"
$scriptPath = "C:\Users\YOUR_USERNAME\Desktop\binance-watch-live\auto-search-startup.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserID $env:USERNAME -LogonType Interactive

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Force

Write-Host "✅ تم تسجيل المهمة المجدولة" -ForegroundColor Green
```

#### الطريقة الثانية: Startup Folder

```powershell
# انسخ الملف .bat إلى مجلد Startup
Copy-Item "C:\Users\YOUR_USERNAME\Desktop\binance-watch-live\start-auto-search.bat" `
  -Destination "C:\Users\YOUR_USERNAME\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\"

Write-Host "✅ تم إضافة الخدمة إلى Startup" -ForegroundColor Green
```

---

### 3️⃣ **التحقق من المفاتيح في .env**

تأكد من وجود هذه المفاتيح في ملف `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# AI APIs
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_gemini_key
```

---

## كيفية العمل 🔧

```
1️⃣ جهاز يبدأ
   ↓
2️⃣ Scheduled Task يشغل الخدمة
   ↓
3️⃣ auto-search-service.js يبدأ
   ↓
4️⃣ كل 60 ثانية:
   ├─ جلب 5 عملات من Binance
   ├─ تطبيق الفلاتر
   ├─ تحليل بـ ChatGPT + Gemini
   ├─ إذا اتفقا على الشراء → إضافة للمفضلات
   └─ حفظ في قاعدة البيانات
   ↓
5️⃣ أنت تفتح الموقع وترى النتائج ✅
```

---

## المراقبة والسجلات 📊

### عرض السجلات
```powershell
# عرض آخر 50 سطر من السجل
Get-Content "C:\Users\YOUR_USERNAME\Desktop\binance-watch-live\auto-search.log" -Tail 50
```

### التحقق من العملات المضافة
```powershell
# قاعدة البيانات (Supabase)
# انظر: favorites table
```

---

## حل المشاكل 🔧

### ❌ "Node.js غير مثبت"
```
✅ الحل: حمل من https://nodejs.org واتبع التعليمات
```

### ❌ "خطأ في API"
```
✅ الحل: تحقق من المفاتيح في .env
```

### ❌ "لا توجد عملات"
```
✅ الحل: تأكد من الفلاتر واتصال Binance
```

### ❌ الخدمة توقفت بعد إعادة التشغيل
```
✅ الحل: أعد تسجيل المهمة المجدولة (انظر الخطوة 2)
```

---

## إيقاف الخدمة ⛔

### إيقاف مؤقت
```powershell
# اضغط Ctrl+C في نافذة الأوامر
```

### إيقاف دائم
```powershell
# حذف المهمة المجدولة
Unregister-ScheduledTask -TaskName "BinanceAutoSearch" -Confirm:$false

# أو احذف الملف من Startup folder
```

---

## الإعدادات المتقدمة ⚙️

### تغيير توقيت البحث
في ملف `auto-search-service.js` غير:
```javascript
setInterval(runAutoSearch, 60000); // 60 ثانية
// إلى:
setInterval(runAutoSearch, 30000); // 30 ثانية
```

### تغيير عدد العملات
```javascript
// غير من:
for (let i = 0; i < 5 && filtered.length > 0; i++)
// إلى:
for (let i = 0; i < 10 && filtered.length > 0; i++)
```

### تعطيل AI واختبار البحث الأساسي
في `auto-search-service.js` غير:
```javascript
if (!GROQ_API_KEY || !GEMINI_API_KEY) {
  // الآن سيعمل بدون API
}
```

---

## الدعم 💬

إذا واجهت مشكلة:
1. تحقق من السجلات: `auto-search.log`
2. تأكد من الاتصال بالإنترنت
3. تحقق من مفاتيح API
4. أعد تشغيل الجهاز

---

## الترخيص 📄

هذا الكود جزء من مشروع binance-watch-live
استخدام حر مع الإشارة للمصدر

---

**تم الإنشاء:** 25 ديسمبر 2025
**النسخة:** 1.0
**الحالة:** ✅ منتجة وجاهزة
