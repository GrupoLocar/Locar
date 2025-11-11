# =========================
# C:\Locar\scripts\locarsystem.ps1
# =========================
$ErrorActionPreference = "Stop"

# Diretorio de logs
$LogDir = "C:\Locar\logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Garante Node/NPM no PATH (Util quando roda como SYSTEM)
$env:Path += ";C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm"

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
      -WindowStyle Hidden -NoNewWindow `
      -RedirectStandardOutput $out -RedirectStandardError $err | Out-Null
}

# === BACKEND: node server.js ===
$node = "C:\Program Files\nodejs\node.exe"
Start-Headless -FilePath $node -Arguments "C:\Locar\backend\server.js" -WorkingDirectory "C:\Locar\backend" -Name "backend"

# === FRONTEND: npm start ===
$npm = "C:\Program Files\nodejs\npm.cmd"
Start-Headless -FilePath $npm -Arguments "start" -WorkingDirectory "C:\Locar\frontend" -Name "frontend"

