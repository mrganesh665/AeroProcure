"""
Elexon BMRS API client for live data retrieval and database synchronization.
Accesses official BMRS datasets: FUELHH (Actual Generation) and WINDFOR (Forecast Generation).
"""
import urllib.request
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.db_loader import get_db_connection

logger = logging.getLogger(__name__)

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

class ElexonClient:
    def __init__(self, base_url: str = ELEXON_BASE_URL, timeout: int = 15):
        self.base_url = base_url
        self.timeout = timeout

    def fetch_stream(self, dataset: str, from_dt: datetime, to_dt: datetime) -> List[Dict[str, Any]]:
        """
        Fetches stream records from Elexon BMRS API for a given dataset and datetime range.
        """
        from_str = from_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = to_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = f"{self.base_url}/datasets/{dataset}/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        
        req = urllib.request.Request(url, headers={
            "User-Agent": "UK-Wind-Procurement-Platform/1.0",
            "Accept": "application/json"
        })

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data
                else:
                    logger.error(f"Elexon API returned status {resp.status} for {url}")
                    return []
        except Exception as e:
            logger.warning(f"Error fetching from Elexon API ({url}): {e}")
            return []

    def sync_range(self, from_dt: datetime, to_dt: datetime) -> Dict[str, int]:
        """
        Synchronizes both FUELHH (wind only) and WINDFOR data into the SQLite database.
        """
        logger.info(f"Syncing Elexon data from {from_dt} to {to_dt}...")
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Fetch FUELHH
        fuel_records = self.fetch_stream("FUELHH", from_dt, to_dt)
        wind_fuel = [f for f in fuel_records if f.get("fuelType") == "WIND" and f.get("generation") is not None]

        fuel_rows = [(
            f["startTime"],
            f.get("settlementDate", f["startTime"][:10]),
            f.get("settlementPeriod"),
            float(f["generation"]),
            f.get("publishTime")
        ) for f in wind_fuel]

        cursor.executemany("""
        INSERT OR IGNORE INTO actual_generation (start_time, settlement_date, settlement_period, generation, publish_time)
        VALUES (?, ?, ?, ?, ?)
        """, fuel_rows)

        # 2. Fetch WINDFOR
        windfor_records = self.fetch_stream("WINDFOR", from_dt, to_dt)
        fc_rows = [(
            w["publishTime"],
            w["startTime"],
            float(w["generation"])
        ) for w in windfor_records if w.get("generation") is not None and w.get("publishTime") and w.get("startTime")]

        cursor.executemany("""
        INSERT OR IGNORE INTO forecast_generation (publish_time, start_time, generation)
        VALUES (?, ?, ?)
        """, fc_rows)

        conn.commit()
        conn.close()

        logger.info(f"Sync complete. Added/verified {len(fuel_rows)} FUELHH and {len(fc_rows)} WINDFOR items.")
        return {
            "actualsCount": len(fuel_rows),
            "forecastsCount": len(fc_rows)
        }
