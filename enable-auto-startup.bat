@echo off
REM 🤖 تفعيل البدء التلقائي للبحث الآلي
REM يجب تشغيل هذا الملف كـ Admin

setlocal enabledelayedexpansion

echo.
echo ================================================
echo 🔧 تفعيل البدء التلقائي للخدمة
echo ================================================
echo.

REM التحقق من وجود Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ خطأ: يجب تشغيل هذا الملف كـ Administrator
    echo.
    echo الرجاء:
    echo 1. انقر بزر الماوس الأيمن على الملف
    echo 2. اختر "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ تم الوصول للصلاحيات المطلوبة
echo.

REM إنشاء المهمة
echo 🔧 جاري تسجيل المهمة المجدولة...
echo.

set TASK_NAME=BinanceAutoSearch
set PROJECT_PATH=C:\Users\USER\Desktop\binance-watch-live
set COMMAND=cd /d "%PROJECT_PATH%" ^&^& node auto-search-service.js

REM حذف المهمة القديمة إن وجدت
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM إنشاء المهمة الجديدة
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command '%COMMAND%'" ^
  /sc onstart ^
  /ru "%USERNAME%" ^
  /rp ^
  /f

if %errorlevel% equ 0 (
    echo.
    echo ✅ تم تفعيل البدء التلقائي بنجاح!
    echo.
    echo 📋 تفاصيل المهمة:
    echo    اسم المهمة: %TASK_NAME%
    echo    الموقع: %PROJECT_PATH%
    echo    التشغيل: عند بدء الجهاز تلقائياً
    echo    الحالة: ✅ مفعّل
    echo.
    echo 💡 الخدمة ستبدأ تلقائياً عند بدء الجهاز القادم
    echo.
    echo 🧪 لاختبار:
    echo    schtasks /run /tn "%TASK_NAME%"
    echo.
) else (
    echo.
    echo ❌ فشل تفعيل البدء التلقائي
    echo.
)

pause
