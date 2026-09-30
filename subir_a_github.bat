@echo off
title Subir ITM Academico a GitHub
echo ========================================================
echo    ACTUALIZANDO PROYECTO EN GITHUB: NotaFinal
echo ========================================================
echo.
echo Repositorio: https://github.com/diegoalejandroquinterocano/NotaFinal
echo.
cd /d "C:\Users\ssdaquintero\.gemini\antigravity\scratch\itm-academic-antigravity"

echo Enviando commit con los datos de Diego Quintero...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  [OK] Proyecto actualizado con exito en GitHub:
    echo  https://github.com/diegoalejandroquinterocano/NotaFinal
    echo ========================================================
) else (
    echo.
    echo Si GitHub te pide iniciar sesion, completa el inicio en la ventana del navegador.
)
echo.
pause
