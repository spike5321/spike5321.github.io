@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
set CMD=

where python >nul 2>nul && set CMD=python -m http.server %PORT%
if "%CMD%"=="" ( where py     >nul 2>nul && set CMD=py -m http.server %PORT% )
if "%CMD%"=="" ( where python3 >nul 2>nul && set CMD=python3 -m http.server %PORT% )
if "%CMD%"=="" ( where npx    >nul 2>nul && set CMD=npx --yes serve -l %PORT% . )

if "%CMD%"=="" (
  echo.
  echo   [!] Python / Node.js not found on this computer.
  echo.
  echo   The site needs a tiny local web server to preview.
  echo   Easiest fix: install Python from https://www.python.org/downloads/
  echo   ^(check "Add python.exe to PATH" during setup^), then run this file again.
  echo.
  echo   Alternatively, just push the site to GitHub Pages - it works there
  echo   without installing anything.
  echo.
  pause
  exit /b 1
)

echo.
echo   Local preview:  http://localhost:%PORT%
echo   Keep this window open while browsing. Press Ctrl+C to stop.
echo.
start "" "http://localhost:%PORT%"
%CMD%
