#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build & run Locar (Node.js backend + React frontend) with PM2 on Windows.
- Builds using the provided batch files:
    C:\Locar\backend\start-backend.bat
    C:\Locar\frontend\start-frontend.bat
- Then starts services under PM2 as:
    locar-backend, locar-frontend

Run from PowerShell (as Administrator recommended):
    py -X utf8 C:\Locar\scripts\build_and_start_pm2.py
or  python -X utf8 C:\Locar\scripts\build_and_start_pm2.py

If you place this file elsewhere, adjust the path accordingly.
"""

import os
import sys
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

# === Configuration ===
BACKEND_DIR   = r"C:\Locar\backend"
FRONTEND_DIR  = r"C:\Locar\frontend"
BACKEND_BAT   = r"C:\Locar\backend\start-backend.bat"
FRONTEND_BAT  = r"C:\Locar\frontend\start-frontend.bat"
PM2_NAME_BACK = "locar-backend"
PM2_NAME_FRONT= "locar-frontend"

# Optional: log file path (local machine)
LOG_DIR       = r"C:\Locar\logs"
LOG_FILE      = os.path.join(LOG_DIR, f"build_pm2_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

# Common Node/NPM paths (adjust if needed)
NODE_PATHS = [
    r"C:\Program Files\nodejs",
    r"C:\Program Files (x86)\nodejs",
    os.path.join(os.environ.get("USERPROFILE", ""), r"AppData\Roaming\npm"),
    r"C:\Users\Administrator\AppData\Roaming\npm",
]

def ensure_dirs():
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
    except Exception:
        # If log dir can't be created, continue without failing
        pass

def log_write(text: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {text}"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass
    print(line, flush=True)

def add_paths_to_env():
    # Ensure Node & NPM & PM2 are reachable
    path = os.environ.get("PATH", "")
    extras = [p for p in NODE_PATHS if p and p not in path]
    if extras:
        os.environ["PATH"] = path + ";" + ";".join(extras)

def run_cmd(cmd, cwd=None, check=False):
    """Run command via cmd.exe on Windows, stream output to console and log."""
    # If cmd is a list, join it to a string
    if isinstance(cmd, (list, tuple)):
        cmd_str = " ".join(cmd)
    else:
        cmd_str = cmd

    full_cmd = ["cmd.exe", "/c", cmd_str]
    log_write(f"RUN: {cmd_str} (cwd={cwd or os.getcwd()})")
    try:
        proc = subprocess.run(
            full_cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        if proc.stdout:
            for line in proc.stdout.splitlines():
                log_write(f"OUT: {line}")
        if proc.stderr:
            for line in proc.stderr.splitlines():
                log_write(f"ERR: {line}")
        if check and proc.returncode != 0:
            raise subprocess.CalledProcessError(proc.returncode, full_cmd, output=proc.stdout, stderr=proc.stderr)
        return proc.returncode
    except FileNotFoundError as e:
        log_write(f"ERROR: {e}")
        if check:
            raise
        return 1

def ensure_pm2():
    """Ensure PM2 is installed; install globally if missing."""
    add_paths_to_env()
    pm2_path = shutil.which("pm2")
    if pm2_path:
        log_write(f"PM2 found at: {pm2_path}")
        return True

    log_write("PM2 not found. Installing globally with npm...")
    code = run_cmd("npm install -g pm2", check=False)
    if code != 0:
        log_write("Failed to install PM2 with npm. Please check Node/npm installation.")
        return False

    pm2_path = shutil.which("pm2")
    if pm2_path:
        log_write(f"PM2 installed at: {pm2_path}")
        return True
    else:
        log_write("PM2 installation did not complete successfully.")
        return False

def build_projects():
    """Run the provided batch files to build backend and frontend."""
    # Backend build
    if not os.path.isfile(BACKEND_BAT):
        log_write(f"ERROR: Backend batch file not found: {BACKEND_BAT}")
        return 1
    code_b = run_cmd(f'"{BACKEND_BAT}"', cwd=BACKEND_DIR, check=False)
    if code_b != 0:
        log_write(f"ERROR: Backend build failed with exit code {code_b}")
        return code_b

    # Frontend build
    if not os.path.isfile(FRONTEND_BAT):
        log_write(f"ERROR: Frontend batch file not found: {FRONTEND_BAT}")
        return 1
    code_f = run_cmd(f'"{FRONTEND_BAT}"', cwd=FRONTEND_DIR, check=False)
    if code_f != 0:
        log_write(f"ERROR: Frontend build failed with exit code {code_f}")
        return code_f

    log_write("Build steps completed successfully.")
    return 0

def start_with_pm2():
    """Start backend and frontend under PM2 using the batch files."""
    # Clean old processes (ignore errors)
    run_cmd(f'pm2 delete "{PM2_NAME_BACK}"', check=False)
    run_cmd(f'pm2 delete "{PM2_NAME_FRONT}"', check=False)

    # Start services under PM2 using the batch files
    # Note: If your batch files only build and do not start the apps,
    # replace the commands below with your actual start scripts/commands.
    code1 = run_cmd(f'pm2 start "{BACKEND_BAT}" --name "{PM2_NAME_BACK}"', cwd=BACKEND_DIR, check=False)
    code2 = run_cmd(f'pm2 start "{FRONTEND_BAT}" --name "{PM2_NAME_FRONT}"', cwd=FRONTEND_DIR, check=False)

    # Persist the PM2 process list
    run_cmd("pm2 save", check=False)
    run_cmd("pm2 status", check=False)

    return 0 if code1 == 0 and code2 == 0 else 1

def main():
    ensure_dirs()
    log_write("=== Build & PM2 start for Locar ===")
    add_paths_to_env()

    # Node/npm presence sanity check
    node = shutil.which("node")
    npm  = shutil.which("npm")
    log_write(f"node: {node or 'NOT FOUND'}")
    log_write(f"npm : {npm or 'NOT FOUND'}")
    if not node or not npm:
        log_write("ERROR: Node.js/NPM not found in PATH. Please install Node.js or adjust NODE_PATHS.")
        sys.exit(1)

    # Ensure PM2 available
    if not ensure_pm2():
        sys.exit(1)

    # Build
    if build_projects() != 0:
        log_write("Build failed. Aborting PM2 start.")
        sys.exit(1)

    # Start services with PM2
    ret = start_with_pm2()
    if ret == 0:
        log_write("PM2 services started successfully.")
    else:
        log_write("One or more PM2 start commands failed.")
    sys.exit(ret)

if __name__ == "__main__":
    main()
