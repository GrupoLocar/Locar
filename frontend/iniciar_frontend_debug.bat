@echo off
cd /d C:\Locar\frontend

echo [ %date% %time% ] Iniciando frontend... >> log.txt

REM Executa o npm start e grava stdout e stderr no log.txt
npm start >> log.txt 2>&1

echo [ %date% %time% ] Processo finalizado. >> log.txt
pause
