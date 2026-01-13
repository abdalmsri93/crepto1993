@echo off
echo ====================================
echo   التبديل الى الفرع الاساسي
echo   Switching to Main Branch
echo ====================================
cd /d "%~dp0"
git checkout main
echo.
echo ✓ انت الان في الفرع الاساسي (main)
echo ✓ You are now in main branch
echo.
echo هذا هو النظام المستقر - كن حذرا!
echo This is the stable system - be careful!
echo.
pause
