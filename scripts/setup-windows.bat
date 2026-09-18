@echo off
title Congregation Tools - 1-Click Setup (Windows)
cd /d "%~dp0\.."

echo ========================================================
echo   Congregation Tools - Initial Setup
echo ========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js (LTS version) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
npm -v
echo.

:: Setup environment configuration
if not exist .env (
    if exist .env.example (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
        echo [OK] .env file created. You can edit it later with your Firebase config.
    )
)

:: Install dependencies
echo [INFO] Installing project dependencies (this may take a minute)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies. Check your internet connection.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] Dependencies Installed!
echo ========================================================
echo.
set /p runWizard="Would you like to run the automated Firebase setup wizard now? (Y/N): "
if /i "%runWizard%"=="Y" (
    call node scripts\setup-congregation.mjs
) else (
    echo.
    echo You can configure your congregation anytime by running:
    echo   npm run setup
    echo.
    echo To start the app:
    echo   - scripts\start-windows.bat  : Local server (http://localhost:5173)
    echo   - scripts\deploy-windows.bat : Deploy to Firebase Hosting
    echo.
    pause
)
