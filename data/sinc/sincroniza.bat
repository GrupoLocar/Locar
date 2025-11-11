@echo off
setlocal

REM === Caminho para a instalacao do Python (ajuste se necessario) ===
set PYTHON_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe

REM === Caminho para o script de sincronizacao ===
set SCRIPT_PATH=C:\Locar\backend\scripts\sync_atlas_to_local.py

echo ==========================================
echo  Iniciando sincronizacao do MongoDB Atlas
echo ==========================================

REM === Verifica se o Python existe ===
if not exist "%PYTHON_PATH%" (
    echo Python nao encontrado em: %PYTHON_PATH%
    echo Por favor, verifique o caminho no arquivo .bat
    pause
    exit /b
)

REM === Instalar pymongo (ignora erro se ja instalado) ===
echo Verificando pymongo...
"%PYTHON_PATH%" -m pip install --upgrade pip
"%PYTHON_PATH%" -m pip install pymongo

REM === Executar script de sincronizacao ===
echo Executando script de sincronizacao...
"%PYTHON_PATH%" "%SCRIPT_PATH%"

echo ==========================================
echo  Sincronizacao finalizada
echo ==========================================
pause
endlocal
