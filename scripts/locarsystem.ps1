# =========================
# C:\Locar\scripts\locarsystem.ps1
# =========================
$ErrorActionPreference = "Stop"

# Diretório de logs (sempre garantido)
$LogDir = "C:\Locar\logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Garante Node/NPM no PATH (útil quando roda como SYSTEM)
$env:Path += ";C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm"

# Evita que CRA (npm start) tente abrir navegador
$env:BROWSER = "none"

function Start-Headless {
    param(
        [Parameter(Mandatory=$true)] [string]$FilePath,
        [Parameter(Mandatory=$true)] [string]$Arguments,
        [Parameter(Mandatory=$true)] [string]$WorkingDirectory,
        [Parameter(Mandatory=$true)] [string]$Name
    )
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $out   = Join-Path $LogDir "$Name-$stamp.out.log"
    $err   = Join-Path $LogDir "$Name-$stamp.err.log"

    Start-Process -FilePath $FilePath -ArgumentList $Arguments `
      -WorkingDirectory $WorkingDirectory `
      -WindowStyle Hidden `
      -RedirectStandardOutput $out -RedirectStandardError $err `
      -PassThru | Out-Null
}

# === BACKEND: node server.js ===
$node = "C:\Program Files\nodejs\node.exe"
Start-Headless -FilePath $node -Arguments "server.js" -WorkingDirectory "C:\Locar\backend" -Name "backend"

# === FRONTEND: npm run start ===
$npm = "C:\Program Files\nodejs\npm.cmd"
Start-Headless -FilePath $npm -Arguments "run start" -WorkingDirectory "C:\Locar\frontend" -Name "frontend"

# === LISTAGEM DE PROCESSOS ===
Start-Sleep -Seconds 4
$ts = Get-Date -Format yyyyMMdd_HHmmss
$procs = Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -in @('node.exe','npm.exe')) -and ($_.CommandLine -match 'C:\\Locar\\(backend|frontend)')
  } |
  Select-Object ProcessId, Name, CommandLine

Write-Host "`n==> Processos Locar ativos (backend / frontend):"
$procs | Format-Table -AutoSize

# Salva em log com timestamp
$procLog = Join-Path $LogDir "processos-$ts.log"
$procs | Format-Table -AutoSize | Out-String | Out-File $procLog -Encoding UTF8
Write-Host "==> Listagem de processos salva em $procLog"
