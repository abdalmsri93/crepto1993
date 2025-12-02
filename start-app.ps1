# تشغيل خادم التطوير
cd "c:\Users\USER\Downloads\binance-watch-live-main (2)\binance-watch-live-main"

# إنشاء نافذة جديدة لتشغيل الخادم
$serverScript = @"
cd "c:\Users\USER\Downloads\binance-watch-live-main (2)\binance-watch-live-main"
npm run dev
"@

# تشغيل الخادم في نافذة منفصلة
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $serverScript -WindowStyle Normal

# الانتظار لبدء الخادم
Start-Sleep -Seconds 8

# فتح المتصفح Chrome
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    & $chromePath "http://localhost:8080/"
} else {
    $chromeAlt = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    if (Test-Path $chromeAlt) {
        & $chromeAlt "http://localhost:8080/"
    } else {
        Write-Host "Chrome is not installed"
        Start-Process "http://localhost:8080/"
    }
}
