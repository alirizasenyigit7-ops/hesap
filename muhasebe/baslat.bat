@echo off
title Muhasebe Uygulamasi
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
