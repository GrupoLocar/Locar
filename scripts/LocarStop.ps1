# LocarStop.ps1
# Script para listar e matar todos os processos node.exe

# Lista todos os processos "node.exe"
Write-Host "Listando todos os processos 'node.exe'..."

$nodeProcesses = Get-WmiObject Win32_Process | Where-Object { $_.Name -eq "node.exe" }

if ($nodeProcesses) {
    Write-Host "Processos node.exe encontrados:"
    $nodeProcesses | ForEach-Object {
        Write-Host ("Processo ID: " + $_.ProcessId + " - Comando: " + $_.CommandLine)
    }
} else {
    Write-Host "Nenhum processo node.exe encontrado."
}

# Pergunta ao usuário se deseja matar todos os processos node.exe
$confirm = Read-Host "Deseja matar todos os processos 'node.exe'? (S/N)"
if ($confirm -eq "S" -or $confirm -eq "s") {
    # Mata todos os processos node.exe
    Write-Host "Matando todos os processos 'node.exe'..."

    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.ProcessId -Force
            Write-Host ("Processo " + $_.ProcessId + " (ID) foi finalizado com sucesso.")
        } catch {
            Write-Host ("Erro ao tentar matar o processo " + $_.ProcessId + ": " + $_.Exception.Message)
        }
    }
} else {
    Write-Host "Operação cancelada. Nenhum processo foi finalizado."
}

Write-Host "Script concluído."
