#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting AeroProcure UK Wind Procurement Platform"
echo "=========================================================="

# Check and populate DB if needed
if [ ! -f "data/wind_procurement.db" ]; then
    echo "Initializing database from pre-fetched Elexon datasets..."
    ./backend/venv/bin/python backend/app/db_loader.py
fi

echo "1. Starting FastAPI Backend on http://localhost:8000..."
./backend/venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "2. Starting Vite React Frontend on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM

echo ""
echo "✅ Both services running!"
echo "   - Web App UI: http://localhost:5173"
echo "   - Backend API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

wait

