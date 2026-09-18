@echo off
title Congregation Tools - Local Server
cd /d "%~dp0\.."

echo ========================================================
echo   Starting Congregation Tools Server...
echo ========================================================
echo.

if not exist node_modules (
    echo [INFO] First time running? Running setup first...
    call scripts\setup-windows.bat
)

echo [INFO] Starting local development server...
echo Access in your browser at: http://localhost:5173
echo Press Ctrl+C in this window to stop the server.
echo.

start "" http://localhost:5173
call npm run dev
pause
