@echo off
title Congregation Tools - 1-Click Setup (Windows)
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
echo   [SUCCESS] Setup Completed Successfully!
echo ========================================================
echo.
echo You can now run:
echo   - start-windows.bat  : To start local development server
echo   - deploy-windows.bat : To deploy to Firebase Hosting
echo.
pause
