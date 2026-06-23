"""
TRF Management System — Single-command launcher
================================================
Starts both backend (FastAPI/uvicorn) and frontend (Vite dev server).

Usage:
    python app.py

Requirements:
    - Python >= 3.10 with venv active
    - Node.js >= 18 installed
    - pip install -r backend/requirements.txt
    - npm install  (inside frontend/)
"""

import subprocess
import sys
import os
import signal
import time
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def run_backend() -> subprocess.Popen:
    print("🚀  Starting FastAPI backend on http://127.0.0.1:8000 ...")
    return subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn",
            "backend.main:app",
            "--reload",
            "--host", "127.0.0.1",
            "--port", "8000",
        ],
        cwd=str(ROOT),
    )


def run_frontend() -> subprocess.Popen:
    print("⚡  Starting Vite frontend on http://localhost:5173 ...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    return subprocess.Popen(
        [npm, "run", "dev"],
        cwd=str(FRONTEND_DIR),
    )


def main():
    processes: list[subprocess.Popen] = []

    def shutdown(sig=None, frame=None):
        print("\n🛑  Shutting down all processes...")
        for p in processes:
            p.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    backend = run_backend()
    processes.append(backend)

    # Small delay so the backend is ready before the frontend starts
    time.sleep(2)

    frontend = run_frontend()
    processes.append(frontend)

    print("\n✅  Both servers are running.")
    print("   Backend  → http://127.0.0.1:8000")
    print("   Frontend → http://localhost:5173")
    print("   API Docs → http://127.0.0.1:8000/docs")
    print("\n   Press Ctrl+C to stop.\n")

    # Wait until either process exits
    while True:
        for p in processes:
            ret = p.poll()
            if ret is not None:
                print(f"⚠️  A process exited with code {ret}. Shutting down...")
                shutdown()
        time.sleep(1)


if __name__ == "__main__":
    main()
