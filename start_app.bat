@echo off
echo ==========================================
echo       STARTING NEON STREAM PROJECT
echo ==========================================

echo [1/2] Launching Backend Server (Port 5000)...
start "Neon Backend" /D "server" cmd /k "node index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Client (Port 5173)...
start "Neon Frontend" /D "client" cmd /k "npm run dev"

echo.
echo ==========================================
echo       ALL SYSTEMS GO! 🚀
echo ==========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
