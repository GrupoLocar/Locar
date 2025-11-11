@echo off
set LOGFILE=C:\Locar\logs\backend_log.txt

echo [%date% %time%] Iniciando backend... > %LOGFILE%

cd /d C:\Locar\backend

echo [%date% %time%] Executando node server.js > %LOGFILE%
node server.js > %LOGFILE% 2>&1

echo [%date% %time%] Backend finalizado. > %LOGFILE%


