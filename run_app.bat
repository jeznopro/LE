@echo off
title Khoi Dong Mochi Anki Learning App
echo ========================================================
echo   DANG KHOI DONG HE THONG HOC TIENG ANH MOCHI ANKI
echo ========================================================
echo.
cd /d "%~dp0"
echo 1. Dang kiem tra dependencies...
echo 2. Dang bat server Vite...
start "" "http://localhost:5173/"
npm run dev
pause
