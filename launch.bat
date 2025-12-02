@echo off
cd /d "c:\Users\USER\Downloads\binance-watch-live-main (2)\binance-watch-live-main"
start "Binance Watch Server" cmd /k npm run dev
timeout /t 8
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:8080/"
exit
