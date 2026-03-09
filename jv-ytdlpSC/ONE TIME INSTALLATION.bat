@echo off
setlocal enabledelayedexpansion
title EcomineAI Downloader — Installation
color 0B
mode con: cols=70 lines=50

echo.
echo  ================================================================
echo   ECOMINEAI DOWNLOADER — INSTALLER
echo   Powered by yt-dlp
echo  ================================================================
echo.
echo  This will install everything needed to run EcomineAI Downloader:
echo    [1] Winget (Windows Package Manager check)
echo    [2] Node.js
echo    [3] yt-dlp
echo    [4] ffmpeg  (for merging video + audio)
echo    [5] Deno    (JS runtime for yt-dlp)
echo    [6] Place yt-dlp.exe into Downloads folder
echo.
echo  ================================================================
echo.
pause

:: ================================================================
:: STEP 0 — Check if running as Admin (recommended)
:: ================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] WARNING: Not running as Administrator.
    echo      Some installs may fail. Right-click INSTALL.bat
    echo      and choose "Run as administrator" for best results.
    echo.
    pause
)

:: ================================================================
:: STEP 1 — Check winget
:: ================================================================
echo  [1/5] Checking winget (Windows Package Manager)...
winget --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] winget not found.
    echo      Please update Windows or install App Installer from the
    echo      Microsoft Store: https://aka.ms/getwinget
    echo.
    echo  Opening Microsoft Store...
    start "" "ms-windows-store://pdp/?productid=9NBLGGH4NNS1"
    echo  After installing App Installer, re-run this script.
    pause
    exit /b
) else (
    echo  [OK] winget found.
)
echo.

:: ================================================================
:: STEP 2 — Node.js
:: ================================================================
echo  [2/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js already installed: %%v
) else (
    echo  [ ] Node.js not found. Installing...
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    if !errorlevel! neq 0 (
        echo  [!] Node.js install failed. Try manually: https://nodejs.org
        pause
    ) else (
        echo  [OK] Node.js installed!
    )
)
echo.

:: ================================================================
:: STEP 3 — ffmpeg
:: ================================================================
echo  [3/5] Checking ffmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] ffmpeg already installed.
) else (
    echo  [ ] ffmpeg not found. Installing...
    winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
    if !errorlevel! neq 0 (
        echo  [!] ffmpeg install failed via winget. Trying chocolatey fallback...
        where choco >nul 2>&1
        if !errorlevel! equ 0 (
            choco install ffmpeg -y
        ) else (
            echo  [!] Please install ffmpeg manually: https://ffmpeg.org/download.html
            echo      Extract and add to PATH, then re-run this installer.
        )
    ) else (
        echo  [OK] ffmpeg installed!
    )
)
echo.

:: ================================================================
:: STEP 4 — Deno
:: ================================================================
echo  [4/5] Checking Deno (JS runtime for yt-dlp)...
deno --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%v in ('deno --version 2^>nul') do echo  [OK] Deno already installed: %%v
) else (
    echo  [ ] Deno not found. Installing...
    winget install --id DenoLand.Deno -e --accept-source-agreements --accept-package-agreements
    if !errorlevel! neq 0 (
        echo  [!] winget install failed. Trying PowerShell installer...
        powershell -Command "irm https://deno.land/install.ps1 | iex"
        if !errorlevel! neq 0 (
            echo  [!] Deno install failed. Install manually: https://deno.land
        ) else (
            echo  [OK] Deno installed via PowerShell!
        )
    ) else (
        echo  [OK] Deno installed!
    )
)
echo.

:: ================================================================
:: STEP 5 — yt-dlp
:: ================================================================
echo  [5/5] Checking yt-dlp...

:: Check if already in PATH
yt-dlp --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('yt-dlp --version') do echo  [OK] yt-dlp already in PATH: %%v
    goto :ytdlp_done
)

:: Check Downloads folder
set "YTDLP_PATH=%USERPROFILE%\Downloads\yt-dlp.exe"
if exist "%YTDLP_PATH%" (
    for /f "tokens=*" %%v in ('"%YTDLP_PATH%" --version 2^>nul') do echo  [OK] yt-dlp found in Downloads: %%v
    goto :ytdlp_done
)

echo  [ ] yt-dlp not found. Downloading latest release...
:: Try winget first
winget install --id yt-dlp.yt-dlp -e --accept-source-agreements --accept-package-agreements >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] yt-dlp installed via winget!
    goto :ytdlp_done
)

:: Fallback: download .exe directly to Downloads
echo  [ ] winget failed, downloading .exe directly to Downloads folder...
powershell -Command "& { $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile '$env:USERPROFILE\Downloads\yt-dlp.exe' }"
if exist "%YTDLP_PATH%" (
    echo  [OK] yt-dlp.exe downloaded to: %YTDLP_PATH%
) else (
    echo  [!] yt-dlp download failed.
    echo      Download manually from: https://github.com/yt-dlp/yt-dlp/releases
    echo      Save yt-dlp.exe to your Downloads folder.
)

:ytdlp_done
echo.

:: ================================================================
:: STEP 6 — Update PATH for this session
:: ================================================================
echo  [+] Refreshing PATH for this session...
:: Reload user PATH
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USER_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SYS_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%;%PATH%"
echo  [OK] PATH refreshed.
echo.

:: ================================================================
:: FINAL VERIFY
:: ================================================================
echo  ================================================================
echo   VERIFICATION
echo  ================================================================
echo.

set "ALL_OK=1"

node --version >nul 2>&1
if %errorlevel% equ 0 ( for /f %%v in ('node --version') do echo  [OK] Node.js    : %%v ) else ( echo  [!!] Node.js    : NOT FOUND & set "ALL_OK=0" )

ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 ( echo  [OK] ffmpeg     : installed ) else ( echo  [!!] ffmpeg     : NOT FOUND & set "ALL_OK=0" )

deno --version >nul 2>&1
if %errorlevel% equ 0 ( for /f "tokens=1" %%v in ('deno --version 2^>nul') do echo  [OK] Deno       : %%v ) else ( echo  [!!] Deno       : NOT FOUND ^(yt-dlp may warn but still work^) )

yt-dlp --version >nul 2>&1
if %errorlevel% equ 0 ( for /f %%v in ('yt-dlp --version') do echo  [OK] yt-dlp     : %%v ) else (
    if exist "%USERPROFILE%\Downloads\yt-dlp.exe" (
        for /f %%v in ('"%USERPROFILE%\Downloads\yt-dlp.exe" --version 2^>nul') do echo  [OK] yt-dlp     : %%v ^(in Downloads^)
    ) else (
        echo  [!!] yt-dlp     : NOT FOUND & set "ALL_OK=0"
    )
)

echo.
if "%ALL_OK%"=="1" (
    echo  ================================================================
    echo   ALL DONE! Installation complete.
    echo   Double-click START.bat to launch EcomineAI Downloader.
    echo  ================================================================
) else (
    echo  ================================================================
    echo   INSTALLATION INCOMPLETE
    echo   Some components failed. Check the [!!] items above.
    echo   You may need to restart your PC for PATH changes to take effect,
    echo   then re-run INSTALL.bat.
    echo  ================================================================
)

echo.
echo  NOTE: If this is your first install, please RESTART your PC
echo  or open a new terminal so PATH changes take effect.
echo.
pause