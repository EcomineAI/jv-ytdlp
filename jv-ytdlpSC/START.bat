@echo off
title jv-ytdlp — EcomineAI Downloader
color 0A

echo.
echo  ==========================================
echo   jv-ytdlp v0.1 — Starting...
echo  ==========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed!
    echo  Download it from: https://nodejs.org
    pause
    exit /b
)

:: Find server.js — check same folder as this .bat
set "SCRIPT_DIR=%~dp0"
set "SERVER=%SCRIPT_DIR%server.js"

if not exist "%SERVER%" (
    echo  [ERROR] server.js not found next to START.bat
    pause
    exit /b
)

:: Kill any existing server on port 3000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  [OK] Starting server...
echo  [OK] Opening browser...
echo.
echo  Press Ctrl+C or close this window to stop the server.
echo.

:: Start server in background, open browser after short delay
start "" /B node "%SERVER%"

:: Wait for server to start
timeout /t 2 /nobreak >nul

:: Open browser
start "" "http://localhost:3000"

:: Keep window open to show logs (also keeps server alive)
node "%SERVER%"