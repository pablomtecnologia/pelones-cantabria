@echo off
title Pelones Cantabria - servidor local
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-local.ps1"
pause
