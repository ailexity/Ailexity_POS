@echo off
echo Starting Ailexity POS Frontend Server...
cd /d "%~dp0frontend"
npm run dev
pause
