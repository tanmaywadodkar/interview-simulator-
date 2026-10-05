@echo off
echo ==========================================
echo   Starting AI Interview Simulator
echo ==========================================

if not exist ".venv\Scripts\python.exe" (
    echo Error: Python virtual environment not found in .venv folder.
    pause
    exit /b 1
)

echo.
echo Launching services...
start "AI Interview Simulator" .venv\Scripts\python.exe run.py

echo.
echo Check the new terminal window for logs.
echo Press any key to close this launcher...
pause >nul
