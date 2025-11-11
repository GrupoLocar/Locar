@echo off
title Instalar PM2 como servico do Windows
echo ----------------------------------------
echo Instalando PM2 e o servico para Windows...
echo ----------------------------------------

:: Instala pm2 e pm2-windows-service globalmente
npm install -g pm2 pm2-windows-service

IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar os pacotes npm.
    pause
    exit /b
)

:: Instala o servico PM2 no Windows
echo ----------------------------------------
echo Instalando o servico do PM2...
echo ----------------------------------------

pm2-service-install

IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar o servico PM2.
    pause
    exit /b
)

:: Salva os processos atuais no dump.pm2
echo ----------------------------------------
echo Salvando lista de processos atual do PM2...
echo ----------------------------------------
pm2 save

:: Confirma se o servico esta instalado e rodando
echo ----------------------------------------
echo Verificando servico PM2...
echo ----------------------------------------
sc query PM2

echo ----------------------------------------
echo Concluido!
echo O PM2 agora sera executado como servico e iniciara automaticamente.
echo Os processos 'locar-backend' e 'locar-frontend' serao iniciados sem janelas visiveis.
echo ----------------------------------------
pause

