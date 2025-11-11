# -*- coding: utf-8 -*-
r"""
Backup automático (3 fases) — Grupo Locar

• Fase 1: copiar somente novos arquivos
    C:\Users\contr\Dropbox\uploads  ->  G:\BACKUP\DropBox\uploads

• Fase 2: copiar somente novos arquivos
    C:\Locar\data\export            ->  G:\BACKUP\DropBox\data_atlas

• Fase 3: exportar coleções do MongoDB (MONGO_URI) criando pasta com timestamp em:
    G:\BACKUP\DropBox\data_local\backup_YYYY-MM-DD_HH-mm-ss\
  e gravar cada coleção em um arquivo JSON separado (ex: funcionarios.json, users.json, ...)

• Agendador: opcional --register-task cria/atualiza a tarefa "Backup" (08:00, 12:30, 18:30)
"""

import os
import sys
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# =========================
# CONFIG PADRÃO (ajuste se precisar)
# =========================
SRC1 = Path(r"C:\Users\contr\Dropbox\uploads")
DST1 = Path(r"G:\BACKUP\DropBox\uploads")

SRC2 = Path(r"C:\Locar\data\export")
DST2 = Path(r"G:\BACKUP\DropBox\data_atlas")

DATA_LOCAL_DIR = Path(r"G:\BACKUP\DropBox\data_local")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/grupolocar")

PYTHON_EXE = sys.executable
SCRIPT_PATH = Path(__file__).resolve()


# =========================
# Utilidades
# =========================
def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def file_sig(p: Path) -> tuple[int, int]:
    st = p.stat()
    return (st.st_size, int(st.st_mtime))


def is_same(src: Path, dst: Path) -> bool:
    if not dst.exists():
        return False
    return file_sig(src) == file_sig(dst)


def copy_new_files(src_root: Path, dst_root: Path) -> int:
    """
    Copia apenas arquivos que não existam no destino ou que diferem por tamanho/mtime.
    Mantém a estrutura de subpastas. Retorna quantidade copiada.
    """
    if not src_root.exists():
        print(f"[AVISO] Pasta de origem não existe: {src_root}")
        return 0

    ensure_dir(dst_root)
    n = 0
    for root, _, files in os.walk(src_root):
        rel = Path(root).relative_to(src_root)
        out_dir = dst_root / rel
        ensure_dir(out_dir)
        for f in files:
            s = Path(root) / f
            d = out_dir / f
            if not is_same(s, d):
                shutil.copy2(s, d)
                n += 1
    return n


# =========================
# Fase 3 – Exportar MongoDB (coleções separadas)
# =========================
def export_mongo_collections(uri: str, out_dir: Path):
    """
    Exporta TODAS as coleções do DB indicado no URI para JSONs separados em out_dir.
    Requer pymongo e bson (json_util).
    """
    try:
        from pymongo import MongoClient
        from bson import json_util
    except Exception as e:
        raise RuntimeError(
            "Dependências ausentes. Instale com:  pip install pymongo"
        ) from e

    # Nome do DB é a parte após a última "/"
    dbname = uri.rsplit("/", 1)[-1] or "test"
    print(f"[Fase 3] Conectando ao MongoDB em '{uri}' (db: {dbname})...")
    client = MongoClient(uri)
    db = client[dbname]

    ensure_dir(out_dir)
    cols = db.list_collection_names()
    if not cols:
        print("[Fase 3] Nenhuma coleção encontrada. Criando pasta mesmo assim.")
    else:
        print(f"[Fase 3] Coleções: {', '.join(cols)}")

    for col in cols:
        print(f"  - Exportando '{col}' ...")
        docs = list(db[col].find({}))
        # json_util para ObjectId/Date
        payload = json.loads(json_util.dumps(docs))
        out_file = out_dir / f"{col}.json"
        with out_file.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)


def run_phase3(uri: str, base_dir: Path):
    ensure_dir(base_dir)
    ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_dir = base_dir / f"backup_{ts}"
    ensure_dir(backup_dir)
    export_mongo_collections(uri, backup_dir)
    print(f"[Fase 3] Backup de coleções concluído em: {backup_dir}")


# =========================
# Agendador (Windows Task Scheduler)
# =========================
def register_scheduled_task(task_name: str = "Backup"):
    """
    Cria/atualiza a Tarefa Agendada 'Backup' para rodar:
      08:00, 12:30, 18:30 — diariamente
    Executa como SYSTEM, nível mais alto, chamando ESTE script com ESTE Python.
    Requer PowerShell elevado (Administrador).
    """
    ps = rf'''
$ErrorActionPreference = "Stop"
$taskName = "{task_name}"
$action   = New-ScheduledTaskAction -Execute "{PYTHON_EXE}" -Argument '"{SCRIPT_PATH}"'
$triggers = @(
    New-ScheduledTaskTrigger -Daily -At 08:00AM
    New-ScheduledTaskTrigger -Daily -At 12:30PM
    New-ScheduledTaskTrigger -Daily -At 06:30PM
)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

$exists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($exists) {{
    # Atualiza (recria para garantir principal/descrição)
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}}
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Principal $principal -Settings $settings -Description "Backup diário (08:00, 12:30, 18:30)"
Write-Host "Tarefa '$taskName' criada/atualizada com sucesso."
'''
    print("[Agendador] Registrando tarefa 'Backup'...")
    res = subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
        capture_output=True,
        text=True
    )
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr)
        raise RuntimeError("Falha ao registrar a tarefa agendada (execute como Administrador).")
    print(res.stdout.strip())
    print("[Agendador] OK.")


# =========================
# Main
# =========================
def main():
    # Uso:
    #   python backup_automatico.py           -> executa as Fases 1, 2 e 3 agora
    #   python backup_automatico.py --register-task  -> cria/atualiza tarefa "Backup"
    if "--register-task" in sys.argv:
        register_scheduled_task("Backup")
        return

    print("=== BACKUP AUTOMÁTICO — Início ===")

    # Fase 1
    print(f"[Fase 1] Sincronizando:\n  Origem : {SRC1}\n  Destino: {DST1}")
    c1 = copy_new_files(SRC1, DST1)
    if c1 == 0:
        print("[Fase 1] Pastas já sincronizadas. Próxima fase.")
    else:
        print(f"[Fase 1] {c1} arquivo(s) copiado(s).")

    # Fase 2
    print(f"[Fase 2] Sincronizando:\n  Origem : {SRC2}\n  Destino: {DST2}")
    c2 = copy_new_files(SRC2, DST2)
    if c2 == 0:
        print("[Fase 2] Pastas já sincronizadas. Próxima fase.")
    else:
        print(f"[Fase 2] {c2} arquivo(s) copiado(s).")

    # Fase 3
    print("[Fase 3] Exportando coleções do MongoDB...")
    run_phase3(MONGO_URI, DATA_LOCAL_DIR)

    print("=== BACKUP AUTOMÁTICO — Fim ===")


if __name__ == "__main__":
    main()
