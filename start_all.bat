@echo off
echo ============================================
echo Starting Ailexity POS System (MongoDB Edition)
echo ============================================
echo.
echo Current directory: %CD%
echo Script location: %~dp0
echo.

REM Check if MongoDB is already running
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/3] MongoDB is already running...
) else (
    echo [1/3] Starting MongoDB Server...
    start "MongoDB Server" cmd /k "mongod --dbpath=%USERPROFILE%\data\db"
    timeout /t 3 /nobreak >nul
)

REM Check if Backend is already running
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [2/3] Backend is already running...
) else (
    echo [2/3] Starting Backend API Server...
    start "Ailexity Backend" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
    timeout /t 5 /nobreak >nul
)

REM Check if Frontend is already running
netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo [3/3] Frontend is already running...
) else (
    echo [3/3] Starting Frontend Development Server...
    echo Frontend path: %~dp0frontend
    if exist "%~dp0frontend\package.json" (
        start "Ailexity Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
        timeout /t 7 /nobreak >nul
    ) else (
        echo ERROR: package.json not found in frontend directory!
        pause
    )
)

echo.
echo ============================================
echo All services started successfully!
echo ============================================
echo.
echo Services:
echo   - MongoDB:  mongodb://localhost:27017
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo   - System Admin: sysadmin / sysadmin123
echo   - Admin 1:      admin / admin123
echo   - Admin 2:      admin2 / admin123
echo.
echo Opening frontend in browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
