@echo off
echo Starting Ailexity POS Backend Server (MongoDB)...
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
pause
