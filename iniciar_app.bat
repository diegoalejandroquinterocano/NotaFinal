@echo off
title ITM Academico - Gestor de Notas y Antigravedad
echo ======================================================
echo    INICIANDO ITM ACADEMICO (GESTOR DE NOTAS 3.0)
echo ======================================================
echo.
echo Iniciando servidor local en http://localhost:8000 ...
echo Puedes abrirlo en tu PC o desde tu celular en la misma Wi-Fi.
echo.
start http://localhost:8000
py -m http.server 8000
if %ERRORLEVEL% NEQ 0 (
    echo Python py no encontrado, intentando con python directo...
    python -m http.server 8000
)
pause
