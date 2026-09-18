@echo off
title Khoi Dong We Bare Bears Anki Learning App
echo ========================================================
echo   DANG KHOI DONG HE THONG HOC TIENG ANH WE BARE BEARS ANKI
echo ========================================================
echo.
cd /d "%~dp0"
echo 1. Dang kiem tra dependencies...
echo 2. Dang bat server Vite...
start "" "http://localhost:5173/"
npm run dev
pause
