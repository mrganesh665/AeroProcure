"""
FastAPI application for UK Wind Power Day-Ahead Procurement & Forecast Evaluation Platform.
Serves analytical endpoints for UK electricity traders and procurement desks.
"""
from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager
import os

from app.forecast_engine import ForecastEngine
from app.elexon_client import ElexonClient
from app.db_loader import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="UK Wind Power Day-Ahead Procurement API",
    description="Elexon BMRS-based Day-Ahead Wind Generation Forecasting & Accuracy Evaluation Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ForecastEngine()
client = ElexonClient()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "market": "UK Wholesale Electricity (GB)",
        "datasets": ["Elexon BMRS FUELHH", "Elexon BMRS WINDFOR"]
    }

@app.get("/api/dates")
def get_dates():
    dates = engine.get_available_dates()
    return {
        "dates": dates,
        "defaultDate": "2026-01-15" if "2026-01-15" in dates else (dates[0] if dates else None)
    }

@app.get("/api/forecast-vs-actual")
def get_forecast_vs_actual(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    gate_closure: int = Query(11, description="Day-Ahead Gate Closure hour on D-1 (e.g. 11 for 11:00 UTC)"),
    resolution: str = Query("hourly", description="Resolution ('hourly' or 'half-hourly')")
):
    try:
        return engine.get_day_ahead_forecast(
            delivery_date=date,
            gate_closure_hour=gate_closure,
            resolution=resolution
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/forecast-evolution")
def get_forecast_evolution(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    target_hour: int = Query(12, description="Target delivery hour (0-23)")
):
    try:
        return engine.get_forecast_evolution(
            delivery_date=date,
            target_hour=target_hour
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/month-evaluation")
def get_month_evaluation(
    year: int = Query(2026, description="Evaluation Year"),
    month: int = Query(1, description="Evaluation Month"),
    gate_closure: int = Query(11, description="Day-Ahead Gate Closure hour on D-1")
):
    try:
        return engine.get_month_evaluation(
            year=year,
            month=month,
            gate_closure_hour=gate_closure
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ProcurementSimRequest(BaseModel):
    deliveryDate: str = "2026-01-15"
    customerDemandMW: float = 2500.0
    windPortfolioSharePct: float = 10.0
    gateClosureHour: int = 11
    riskStrategy: str = "conservative_p90" # "conservative_p90", "debiased_p50", "aggressive_p10", "naive"

@app.post("/api/procurement-simulate")
def simulate_procurement(req: ProcurementSimRequest):
    try:
        return engine.simulate_procurement_hedging(
            delivery_date=req.deliveryDate,
            customer_demand_mw=req.customerDemandMW,
            wind_portfolio_share_pct=req.windPortfolioSharePct,
            gate_closure_hour=req.gateClosureHour,
            risk_strategy=req.riskStrategy
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class SyncRequest(BaseModel):
    fromDate: str = "2026-01-01"
    toDate: str = "2026-01-05"

@app.post("/api/sync-elexon")
def sync_elexon(req: SyncRequest, background_tasks: BackgroundTasks):
    try:
        from_dt = datetime.strptime(req.fromDate, "%Y-%m-%d")
        to_dt = datetime.strptime(req.toDate, "%Y-%m-%d")
        # Run sync in background or immediately
        result = client.sync_range(from_dt, to_dt)
        return {
            "message": f"Successfully synced Elexon data from {req.fromDate} to {req.toDate}",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
