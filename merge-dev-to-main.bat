@echo off
echo ====================================
echo   دمج التعديلات الناجحة
echo   Merge Successful Changes
echo ====================================
cd /d "%~dp0"

echo.
echo هل انت متأكد ان التعديلات ناجحة ومختبرة؟
echo Are you sure the changes are tested and working?
echo.
set /p confirm="اكتب YES للمتابعة / Type YES to continue: "

if /i not "%confirm%"=="YES" (
    echo.
    echo تم الإلغاء / Cancelled
    pause
    exit /b
)

echo.
echo جاري التبديل الى main...
git checkout main

echo.
echo جاري دمج التعديلات من development...
git merge development

echo.
echo هل تريد رفع التعديلات الى GitHub؟
echo Do you want to push to GitHub?
set /p push="اكتب YES للرفع / Type YES to push: "

if /i "%push%"=="YES" (
    echo.
    echo جاري الرفع الى GitHub...
    git push origin main
    echo.
    echo ✓ تم الرفع بنجاح!
    echo ✓ Pushed successfully!
)

echo.
echo ✓ تم دمج التعديلات بنجاح!
echo ✓ Changes merged successfully!
echo.
pause
