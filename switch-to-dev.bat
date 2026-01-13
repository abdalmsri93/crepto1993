@echo off
echo ====================================
echo   التبديل الى فرع التطوير
echo   Switching to Development Branch
echo ====================================
cd /d "%~dp0"
git checkout development
echo.
echo ✓ انت الان في فرع التطوير (development)
echo ✓ You are now in development branch
echo.
echo اعمل على التعديلات هنا بحرية
echo Work on your changes here safely
echo.
pause
