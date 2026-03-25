@echo off
cd /d "%~dp0"
echo ============================================
echo Seeding MongoDB with default users and data
echo ============================================
echo.

REM Use same Python as start_all.bat if available, else fallback to python
set PY=python
where python >nul 2>&1 || set PY=C:\Users\Alok\AppData\Local\Microsoft\WindowsApps\python3.11.exe

%PY% backend\init_db.py
if %errorlevel% neq 0 (
    echo.
    echo Failed. Ensure:
    echo   1. MongoDB is running on mongodb://localhost:27017
    echo   2. You are in the project root and backend exists
    pause
    exit /b 1
)

echo.
pause
