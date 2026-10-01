@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "NR-TRANS serveur local" /min node server.mjs
  timeout /t 2 /nobreak >nul
  start "" http://127.0.0.1:8765
  exit /b
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0LANCER_NR_TRANS.ps1"
pause
