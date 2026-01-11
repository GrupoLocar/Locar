# === CONFIG ===
$LocarPath      = 'C:\Locar'
$NewLocarPath   = 'C:\Locar_ATUAL'
$LogDir         = 'C:\Locar\logs'
$MaxRetries     = 6
$RetryDelaySec  = 3

Write-Host "==> Preparando ambiente..." -ForegroundColor Cyan
# Evitar que o console atual esteja dentro de C:\Locar
try {
  if ($PWD.Path -like "$LocarPath*") { Set-Location C:\ }
} catch { }

# 1) Listar o que está segurando/relacionado ao C:\Locar (para diagnóstico)
Write-Host "==> Checando processos com referência a $LocarPath ..." -ForegroundColor Cyan
$procs = Get-CimInstance Win32_Process |
  Where-Object { ($_.ExecutablePath -and $_.ExecutablePath -like "$LocarPath*") -or ($_.CommandLine -match [regex]::Escape($LocarPath)) }

$procs | Select-Object ProcessId, Name, ExecutablePath, CommandLine | Format-Table -AutoSize

# 2) Parar serviços que apontem para C:\Locar
Write-Host "==> Parando serviços vinculados a $LocarPath ..." -ForegroundColor Cyan
$services = Get-CimInstance Win32_Service | Where-Object { $_.PathName -match [regex]::Escape($LocarPath) }
foreach ($svc in $services) {
  Write-Host " - Serviço: $($svc.Name) ($($svc.DisplayName)) - $($svc.State)"
  try {
    if ($svc.State -eq 'Running') { Stop-Service -Name $svc.Name -Force -ErrorAction SilentlyContinue }
    Set-Service -Name $svc.Name -StartupType Disabled -ErrorAction SilentlyContinue
  } catch { Write-Warning "   Falha ao parar/desabilitar serviço $($svc.Name): $($_.Exception.Message)" }
}

# 3) Desabilitar tarefas agendadas que chamem algo de C:\Locar
Write-Host "==> Desabilitando tarefas agendadas que referenciam $LocarPath ..." -ForegroundColor Cyan
try {
  $tasks = Get-ScheduledTask | Where-Object {
    ($_.Actions | ForEach-Object { ($_.Execute + ' ' + $_.Arguments) }) -match [regex]::Escape($LocarPath)
  }
  foreach ($t in $tasks) {
    Write-Host " - Tarefa: $($t.TaskPath)$($t.TaskName)"
    try { Disable-ScheduledTask -TaskName $t.TaskName -TaskPath $t.TaskPath -ErrorAction SilentlyContinue } catch { }
  }
} catch {
  Write-Warning "   Não foi possível enumerar/desabilitar tarefas (módulo ScheduledTasks indisponível?). Tentando via schtasks..."
  $null = schtasks /query /fo LIST /v | Out-String
  # (Se necessário, podemos orientar manualmente com schtasks /Change /TN <nome> /DISABLE)
}

# 4) Encerrar Explorers abertos na pasta para evitar lock de GUI (opcional, menos agressivo)
Write-Host "==> Fechando janelas do Explorer que estejam dentro de $LocarPath (não mata o Explorer inteiro)..." -ForegroundColor Cyan
try {
  $shell = New-Object -ComObject Shell.Application
  $wins = @($shell.Windows())
  foreach ($w in $wins) {
    $loc = try { $w.Document.Folder.Self.Path } catch { $null }
    if ($loc -and $loc -like "$LocarPath*") {
      Write-Host " - Fechando janela do Explorer em: $loc"
      $w.Quit()
    }
  }
} catch { }

# 5) Tentar derrubar qualquer Powershell/CMD que esteja rodando scripts do Locar
Write-Host "==> Encerrando consoles/scripts relacionados a $LocarPath ..." -ForegroundColor Cyan
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match 'powershell|pwsh|cmd|conhost' -and $_.CommandLine -match [regex]::Escape($LocarPath) } |
  ForEach-Object {
    Write-Host " - Matando PID $($_.ProcessId): $($_.Name)"
    try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
  }

# 6) Matar node/npm/react-scripts vinculados ao Locar
Write-Host "==> Encerrando node/npm ligados ao $LocarPath ..." -ForegroundColor Cyan
Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -match 'node|npm') -and (
      ($_.ExecutablePath -and $_.ExecutablePath -like "$LocarPath*") -or
      ($_.CommandLine -match [regex]::Escape($LocarPath))
    )
  } |
  ForEach-Object {
    Write-Host " - Matando PID $($_.ProcessId): $($_.Name)"
    try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
  }

# 7) PM2 (por segurança, mesmo vazio não atrapalha): mata o daemon do PM2 se existir
Write-Host "==> Tentando encerrar PM2 (se existir)..." -ForegroundColor Cyan
try { pm2 kill | Out-Null } catch { }

# 8) (Opcional) Se você tiver o Sysinternals 'handle.exe', use-o para matar travas teimosas
# Caminhos comuns: C:\Sysinternals\handle.exe ou %SystemRoot%\System32\handle.exe
$handleExe = @(
  "$env:SystemRoot\System32\handle.exe",
  "C:\Sysinternals\handle.exe",
  "C:\Tools\Sysinternals\handle.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($handleExe) {
  Write-Host "==> Usando handle.exe para localizar travas em $LocarPath ..." -ForegroundColor Cyan
  & $handleExe -accepteula $LocarPath 2>$null | ForEach-Object {
    $_
    if ($_ -match 'pid:\s*(\d+)\s') {
      $pid = [int]$Matches[1]
      try {
        Write-Host " - Matando por handle PID $pid"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      } catch { }
    }
  }
} else {
  Write-Host "==> handle.exe não encontrado; pulando etapa Sysinternals." -ForegroundColor Yellow
}

# 9) Tentativa de renomear com retries
Write-Host "==> Tentando renomear $LocarPath -> $NewLocarPath ..." -ForegroundColor Cyan
$renamed = $false
for ($i=1; $i -le $MaxRetries; $i++) {
  try {
    if (-not (Test-Path $LocarPath)) { throw "Caminho $LocarPath não existe." }
    if (Test-Path $NewLocarPath) {
      Write-Host "   Destino já existe. Ajustando para $NewLocarPath-$i ..."
      $NewLocarPath = "$NewLocarPath-$i"
    }
    Rename-Item -Path $LocarPath -NewName (Split-Path -Leaf $NewLocarPath) -ErrorAction Stop
    $renamed = $true
    break
  } catch {
    Write-Warning "   Tentativa $i falhou: $($_.Exception.Message)"
    Start-Sleep -Seconds $RetryDelaySec
  }
}

if ($renamed) {
  Write-Host "==> Renomeado com sucesso para: $NewLocarPath" -ForegroundColor Green
} else {
  Write-Host "==> Não foi possível renomear. Há algo ainda travando o diretório." -ForegroundColor Red
  Write-Host "    Dicas: feche editores (VSCode), terminals, antivirus/Defender e janelas do Explorer nesse caminho."
}

# 10) (Opcional) Registrar log da lista final de processos ainda presos no caminho
try {
  if (-not (Test-Path $LogDir)) { New-Item -Path $LogDir -ItemType Directory -Force | Out-Null }
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $lockLog = Join-Path $LogDir "locks-$stamp.log"
  Get-CimInstance Win32_Process |
    Where-Object { ($_.ExecutablePath -and $_.ExecutablePath -like "$LocarPath*") -or ($_.CommandLine -match [regex]::Escape($LocarPath)) } |
    Select-Object ProcessId, Name, ExecutablePath, CommandLine |
    Out-File -FilePath $lockLog -Encoding UTF8
  Write-Host "==> Diagnóstico salvo em $lockLog"
} catch { }
