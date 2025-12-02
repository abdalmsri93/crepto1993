@echo off
setlocal enabledelayedexpansion

REM تعريف المسار
set SCRIPT_DIR=c:\Users\USER\Downloads\binance-watch-live-main (2)\binance-watch-live-main

REM تشغيل خادم npm في نافذة منفصلة
start "Binance Watch Server" /D "%SCRIPT_DIR%" cmd /k "npm run dev"

REM الانتظار 8 ثوان
timeout /t 8 /nobreak

REM فتح Chrome
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
if exist "%CHROME_PATH%" (
    start "" "%CHROME_PATH%" "http://localhost:8080/"
) else (
    set CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
    if exist "%CHROME_PATH%" (
        start "" "%CHROME_PATH%" "http://localhost:8080/"
    ) else (
        start "" "http://localhost:8080/"
    )
)

exit /b 0
