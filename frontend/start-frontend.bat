@echo off
echo Iniciando Frontend Locar em modo PRODUCAO...
echo %date% %time%
cd /d C:\Locar\frontend
npx serve -s build >> log.txt 2>&1
