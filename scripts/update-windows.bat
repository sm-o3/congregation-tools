@echo off
title Congregation Tools - 1-Click Update
cd /d "%~dp0\.."

echo ========================================================
echo   Updating Congregation Tools...
echo ========================================================
echo.

node scripts\update.mjs
pause
