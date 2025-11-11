#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Helper to prepare and start Locar with PM2 ecosystem.config.js

Steps:
- Ensure pm2 and serve are installed
- npm ci (or npm install) in backend and frontend
- optional backend build if "npm run build" exists
- frontend "npm run build"
- pm2 start ecosystem.config.js (only the two apps)
"""

import os, json, shutil, subprocess, sys
from pathlib import Path

BACKEND = r"C:\Locar\backend"
FRONTEND= r"C:\Locar\frontend"
ECOFILE = r"C:\Locar\ecosystem.config.js"  # place it at C:\Locar\
LOGDIR  = r"C:\Locar\logs\pm2"

NODE_PATHS = [
    r"C:\Program Files\nodejs",
    r"C:\Program Files (x86)\nodejs",
    os.path.join(os.environ.get("USERPROFILE",""), r"AppData\Roaming\npm"),
    r"C:\Users\Administrator\AppData\Roaming\npm",
]

def add_paths():
    path = os.environ.get("PATH","")
    extra = [p for p in NODE_PATHS if p and p not in path]
    if extra:
        os.environ["PATH"] = path + ";" + ";".join(extra)

def run(cmd, cwd=None, check=False):
    if isinstance(cmd,(list,tuple)): cmd = " ".join(cmd)
    print(f"RUN: {cmd} (cwd={cwd or os.getcwd()})", flush=True)
    r = subprocess.run(["cmd.exe","/c",cmd], cwd=cwd, text=True, capture_output=True, encoding="utf-8", errors="replace")
    if r.stdout: print(r.stdout)
    if r.stderr: print(r.stderr, file=sys.stderr)
    if check and r.returncode!=0: raise subprocess.CalledProcessError(r.returncode, cmd)
    return r.returncode

def ensure_pm2_and_serve():
    ok = True
    if not shutil.which("pm2"): ok &= (run("npm install -g pm2")==0)
    if not shutil.which("serve"): ok &= (run("npm install -g serve")==0)
    return ok

def npm_ci_or_install(cwd):
    if Path(cwd, "package-lock.json").exists():
        return run("npm ci", cwd=cwd)
    return run("npm install", cwd=cwd)

def has_script(pkg, name):
    try:
        data = json.loads(Path(pkg).read_text(encoding="utf-8"))
        return "scripts" in data and name in data["scripts"]
    except Exception:
        return False

def main():
    add_paths()
    os.makedirs(LOGDIR, exist_ok=True)
    if not ensure_pm2_and_serve():
        print("Failed ensuring pm2/serve"); sys.exit(1)

    # deps
    if npm_ci_or_install(BACKEND)!=0: sys.exit(1)
    if npm_ci_or_install(FRONTEND)!=0: sys.exit(1)

    # builds
    if has_script(Path(BACKEND,"package.json"), "build"):
        if run("npm run build", cwd=BACKEND)!=0: sys.exit(1)
    if run("npm run build", cwd=FRONTEND)!=0: sys.exit(1)

    # pm2 start via ecosystem
    run('pm2 delete "locar-backend"', check=False)
    run('pm2 delete "locar-frontend"', check=False)
    if run(f'pm2 start "{ECOFILE}" --only "locar-backend,locar-frontend"')!=0: sys.exit(1)
    run("pm2 save", check=False)
    run("pm2 status", check=False)
    print("Done. Check: pm2 logs locar-backend | pm2 logs locar-frontend")

if __name__=="__main__":
    main()
