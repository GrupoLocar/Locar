# instalar_pm2_servico.ps1
Write-Host "`n🚀 Iniciando instalação do PM2 como serviço do Windows..." -ForegroundColor Cyan

# Verifica se o npm está disponível
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "❌ O Node.js/NPM não está instalado ou não está no PATH."
    exit 1
}

# Instala o PM2 e o serviço do Windows
Write-Host "📦 Instalando PM2 e pm2-windows-service globalmente..."
npm install -g pm2 pm2-windows-service

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Falha ao instalar PM2 e o serviço PM2."
    exit 1
}

# Instala o serviço PM2 no Windows
Write-Host "🔧 Instalando serviço do PM2 no Windows..."
pm2-service-install

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erro ao instalar o serviço do PM2."
    exit 1
}

# Salva os processos atuais
Write-Host "💾 Salvando a lista de processos PM2..."
pm2 save

# Verifica se o serviço foi instalado
Write-Host "`n✅ Serviço PM2 instalado. Verificando estado do serviço:"
sc.exe query PM2

Write-Host "`n🎉 Instalação concluída com sucesso!" -ForegroundColor Green
Write-Host "➡️ Os processos 'locar-frontend' e 'locar-backend' rodarão em segundo plano sem abrir janelas."
