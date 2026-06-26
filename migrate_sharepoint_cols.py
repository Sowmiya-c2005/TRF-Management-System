"""
One-time migration: add sharepoint_status and sharepoint_message to trf_records.
Run from the project root:
    python migrate_sharepoint_cols.py
"""
import sys
sys.path.insert(0, ".")

from backend.database.database import engine
from sqlalchemy import text

SQL = [
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS sharepoint_status VARCHAR NOT NULL DEFAULT 'success'",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS sharepoint_message VARCHAR",
]

with engine.connect() as conn:
    for stmt in SQL:
        try:
            conn.execute(text(stmt))
            print(f"OK: {stmt[:60]}...")
        except Exception as e:
            print(f"NOTE: {e}")
    conn.commit()

print("Migration complete.")
