@echo off
title Sonnensystem-Simulation
echo.
echo ========================================
echo    Sonnensystem-Simulation starten
echo ========================================
echo.

cd /d "%~dp0"

echo Starte Entwicklungsserver...
echo.
echo Nach dem Start oeffnet sich automatisch:
echo    http://localhost:3000
echo.
echo Druecken Sie Strg+C zum Beenden.
echo ========================================
echo.

cmd /c npm run dev

pause
