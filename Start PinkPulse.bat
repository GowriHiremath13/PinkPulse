
@echo off
cd /d "G:\pink-pulse"
start "" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173/
