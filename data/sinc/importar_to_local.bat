@echo off
set PYTHON_PATH=python
set SCRIPT_PATH="C:\Locar\data\sinc\import_to_local.py"

echo Executando importacao do arquivo JSON para o MongoDB local...
%PYTHON_PATH% %SCRIPT_PATH%
pause