@echo off
cd /d C:\Users\mohda\Desktop\hospital
:loop
node node_modules\next\dist\bin\next start -p 3200 >> .cloudflared\app.log 2>&1
timeout /t 5 /nobreak >nul
goto loop
