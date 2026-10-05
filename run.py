import subprocess
import time
import os
import sys

print("==========================================")
print("  Starting AI Interview Simulator  ")
print("==========================================")

# Paths
backend_dir = os.path.join(os.getcwd(), "backend")
frontend_dir = os.path.join(os.getcwd(), "frontend")
venv_activate = os.path.join(os.getcwd(), ".venv", "Scripts", "python.exe")

if not os.path.exists(venv_activate):
    print("Virtual environment not found! Please ensure '.venv' exists.")
    sys.exit(1)

# Start backend
print("=> Starting FastAPI Backend (Port 8000)...")
backend_process = subprocess.Popen(
    [venv_activate, "-m", "uvicorn", "app.main:app", "--reload"],
    cwd=backend_dir
)

# Start frontend
print("=> Starting React Frontend (Port 5173)...")
frontend_process = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=frontend_dir,
    shell=True
)

print("\n[READY] Servers are spinning up!")
print("        Open your browser to: http://localhost:5173")
print("        Press Ctrl+C to stop the servers.")
print("==========================================\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n[INFO] Shutting down servers...")
    backend_process.terminate()
    frontend_process.terminate()
    print("Done.")
