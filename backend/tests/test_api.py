"""
Integration tests for FastAPI endpoints.
Tests Day-Ahead cut-off, forecast vs actual, month evaluation, and simulation.
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Elexon BMRS FUELHH" in data["datasets"]

def test_get_dates():
    response = client.get("/api/dates")
    assert response.status_code == 200
    data = response.json()
    assert "dates" in data
    assert len(data["dates"]) == 31
    assert "2026-01-01" in data["dates"]
    assert "2026-01-31" in data["dates"]

def test_forecast_vs_actual():
    response = client.get("/api/forecast-vs-actual?date=2026-01-15&gate_closure=11")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert "timeline" in data
    assert len(data["timeline"]) == 24
    assert "kpis" in data
    assert data["kpis"]["mae"] > 0
    assert data["kpis"]["rmse"] > 0
    assert data["kpis"]["dataPointsCount"] == 24

def test_forecast_evolution():
    response = client.get("/api/forecast-evolution?date=2026-01-15&target_hour=12")
    assert response.status_code == 200
    data = response.json()
    assert data["targetHour"] == 12
    assert "runs" in data
    assert len(data["runs"]) > 0
    assert data["actualGenerationMW"] is not None

def test_month_evaluation():
    response = client.get("/api/month-evaluation?year=2026&month=1&gate_closure=11")
    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "2026-01"
    assert data["totalHoursAnalyzed"] == 744 # 31 days * 24 hours
    kpis = data["overallKpis"]
    assert kpis["mae"] > 0
    assert kpis["rmse"] >= kpis["mae"]
    assert "quantiles" in kpis
    assert kpis["quantiles"]["p90"] > kpis["quantiles"]["p10"]
    assert len(data["diurnalProfile"]) == 24
    assert len(data["errorHistogram"]) > 0
    assert len(data["dailyScorecards"]) == 31

def test_procurement_simulation():
    payload = {
        "deliveryDate": "2026-01-15",
        "customerDemandMW": 2500.0,
        "windPortfolioSharePct": 10.0,
        "gateClosureHour": 11,
        "riskStrategy": "conservative_p90"
    }
    response = client.post("/api/procurement-simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "schedule" in data
    assert len(data["schedule"]) == 24
    assert "summary" in data
    assert data["summary"]["totalDemandMWh"] == 60000.0

