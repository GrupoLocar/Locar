# ============================================================
# C:\Locar\scripts\locarsystem.ps1
# Inicialização automática - LOCAR + PONTO MOBILE
# ============================================================

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# Logs
# ------------------------------------------------------------
$LogDir = "C:\Locar\logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Log {
    param(
        [string]$Service,
        [string]$Message
    )
    "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Service, $Message |
        Out-File (Join-Path $LogDir "startup.log") -Append -Encoding UTF8
}

function Wait-Port {
    param(
        [int]$Port,
        [int]$Timeout = 60
    )
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $Timeout) {
        try {
            if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop) {
                return $true
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

# ============================================================
# LOCAR
# ============================================================

# --------
# FRONTEND (3000)
# --------
Log "LOCAR-FRONTEND" "Iniciando (npm start -- --port 3000)"

$pLocarFront = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "start -- --port 3000" `
    -WorkingDirectory "C:\Locar\frontend" `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir "locar_frontend.out.log") `
    -RedirectStandardError  (Join-Path $LogDir "locar_frontend.err.log") `
    -PassThru

if (Wait-Port 3000) {
    Log "LOCAR-FRONTEND" "OK - Porta 3000 ativa"
} else {
    Log "LOCAR-FRONTEND" "FALHA - Porta 3000 não abriu"
}

Start-Sleep -Seconds 3

# --------
# BACKEND
# --------
Log "LOCAR-BACKEND" "Iniciando (node.exe server.js)"

$pLocarBack = Start-Process `
    -FilePath "node.exe" `
    -ArgumentList "server.js" `
    -WorkingDirectory "C:\Locar\backend" `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir "locar_backend.out.log") `
    -RedirectStandardError  (Join-Path $LogDir "locar_backend.err.log") `
    -PassThru

Log "LOCAR-BACKEND" "PID=$($pLocarBack.Id)"

Start-Sleep -Seconds 3

# ============================================================
# PONTO MOBILE
# ============================================================

# --------
# BACKEND (3001)
# --------
Log "PONTO-BACKEND" "Iniciando (npm run dev -- --port 3001)"

$pMobileBack = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "run dev -- --port 3001" `
    -WorkingDirectory "C:\controle-de-ponto-mobile-servidor-local\server" `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir "ponto_backend.out.log") `
    -RedirectStandardError  (Join-Path $LogDir "ponto_backend.err.log") `
    -PassThru

if (Wait-Port 3001) {
    Log "PONTO-BACKEND" "OK - Porta 3001 ativa"
} else {
    Log "PONTO-BACKEND" "FALHA - Porta 3001 não abriu"
}

Start-Sleep -Seconds 3

# --------
# FRONTEND (8081)
# --------
Log "PONTO-FRONTEND" "Iniciando (npm run dev -- --port 8081 --host 0.0.0.0)"

$pMobileFront = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "run dev -- --port 8081 --host 0.0.0.0" `
    -WorkingDirectory "C:\controle-de-ponto-mobile-servidor-local" `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir "ponto_frontend.out.log") `
    -RedirectStandardError  (Join-Path $LogDir "ponto_frontend.err.log") `
    -PassThru

if (Wait-Port 8081) {
    Log "PONTO-FRONTEND" "OK - Porta 8081 ativa"
} else {
    Log "PONTO-FRONTEND" "FALHA - Porta 8081 não abriu"
}

Log "SYSTEM" "Inicializacao concluida"
