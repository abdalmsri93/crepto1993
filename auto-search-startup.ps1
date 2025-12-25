# 🤖 سكريبت تشغيل خدمة البحث الآلي عند بدء الجهاز
# ضع هذا السكريبت في: C:\Users\<username>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup

param(
    [string]$ProjectPath = "C:\Users\USER\Desktop\binance-watch-live"
)

# التحقق من وجود المشروع
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ خطأ: المشروع غير موجود في: $ProjectPath" -ForegroundColor Red
    exit 1
}

# التحقق من وجود Node.js
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ خطأ: Node.js غير مثبت" -ForegroundColor Red
    exit 1
}

# التحقق من وجود ملف .env
$envFile = Join-Path $ProjectPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ خطأ: ملف .env غير موجود" -ForegroundColor Red
    exit 1
}

# بدء الخدمة
Write-Host "🚀 بدء خدمة البحث الآلي..." -ForegroundColor Green
Write-Host "📁 المسار: $ProjectPath" -ForegroundColor Cyan

Set-Location $ProjectPath

# تثبيت المكتبات المفقودة
Write-Host "📦 التحقق من المكتبات..." -ForegroundColor Yellow
npm install node-fetch dotenv --silent

# تشغيل الخدمة في الخلفية
Write-Host "🟢 تشغيل البحث الآلي في الخلفية..." -ForegroundColor Green

# استخدام Start-Process لتشغيل في الخلفية
$arguments = "auto-search-service.js"
Start-Process -FilePath "node" -ArgumentList $arguments -WindowStyle Hidden -NoNewWindow

Write-Host "✅ تم بدء الخدمة بنجاح!" -ForegroundColor Green
Write-Host "💡 الخدمة تعمل الآن في الخلفية 24/7" -ForegroundColor Cyan
Write-Host "📊 ستظهر النتائج في قاعدة البيانات" -ForegroundColor Cyan

# إنشاء ملف سجل
$logFile = Join-Path $ProjectPath "auto-search.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] ✅ تم بدء خدمة البحث الآلي`n"

exit 0
