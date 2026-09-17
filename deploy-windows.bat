@echo off
title Congregation Tools - Deploy to Firebase Hosting
echo ========================================================
echo   Building and Deploying to Firebase Hosting...
echo ========================================================
echo.

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please resolve any errors above.
    pause
    exit /b 1
)

echo.
echo [INFO] Deploying build to Firebase Hosting...
call npx -y firebase-tools deploy --only hosting
if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed. Ensure you are logged into Firebase (run 'npx firebase-tools login').
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] Application successfully deployed!
echo ========================================================
echo.
pause
