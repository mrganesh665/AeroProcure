"""
Database initialization and data loading for Elexon BMRS datasets.
Loads FUELHH (actual wind generation) and WINDFOR (forecasted wind generation).
"""
import os
import sqlite3
import json
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "data", "wind_procurement.db"))

def get_db_connection():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Actual Generation table (FUELHH, fuelType = WIND)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS actual_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        settlement_date TEXT NOT NULL,
        settlement_period INTEGER,
        generation REAL NOT NULL,
        publish_time TEXT,
        UNIQUE(start_time)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actual_generation(start_time)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_date ON actual_generation(settlement_date)")

    # Forecast Generation table (WINDFOR)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS forecast_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publish_time TEXT NOT NULL,
        start_time TEXT NOT NULL,
        generation REAL NOT NULL,
        UNIQUE(publish_time, start_time)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fc_start ON forecast_generation(start_time)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fc_publish ON forecast_generation(publish_time)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fc_pub_start ON forecast_generation(publish_time, start_time)")

    conn.commit()
    conn.close()
    print("Database schema initialized.")

def populate_from_json(windfor_path: str, fuelhh_path: str):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Load FUELHH
    if os.path.exists(fuelhh_path):
        with open(fuelhh_path, "r") as f:
            fuelhh_data = json.load(f)
        
        fuel_rows = []
        for item in fuelhh_data:
            if item.get("fuelType") == "WIND" and item.get("generation") is not None:
                fuel_rows.append((
                    item["startTime"],
                    item.get("settlementDate", item["startTime"][:10]),
                    item.get("settlementPeriod"),
                    float(item["generation"]),
                    item.get("publishTime")
                ))
        
        cursor.executemany("""
        INSERT OR IGNORE INTO actual_generation (start_time, settlement_date, settlement_period, generation, publish_time)
        VALUES (?, ?, ?, ?, ?)
        """, fuel_rows)
        print(f"Loaded {len(fuel_rows)} actual generation records.")

    # Load WINDFOR
    if os.path.exists(windfor_path):
        with open(windfor_path, "r") as f:
            windfor_data = json.load(f)

        fc_rows = []
        for item in windfor_data:
            if item.get("generation") is not None and item.get("publishTime") and item.get("startTime"):
                fc_rows.append((
                    item["publishTime"],
                    item["startTime"],
                    float(item["generation"])
                ))

        cursor.executemany("""
        INSERT OR IGNORE INTO forecast_generation (publish_time, start_time, generation)
        VALUES (?, ?, ?)
        """, fc_rows)
        print(f"Loaded {len(fc_rows)} forecast generation records.")

    conn.commit()
    conn.close()
    print("Database population complete.")

if __name__ == "__main__":
    base_data = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    wf_path = os.path.join(base_data, "windfor_raw.json")
    fh_path = os.path.join(base_data, "fuelhh_raw.json")
    populate_from_json(wf_path, fh_path)
