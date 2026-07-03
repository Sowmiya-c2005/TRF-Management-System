"""
Phase 3 DB migration — run once:  python migrate_phase3.py
Adds: users.display_name column (safe IF NOT EXISTS)
"""
import sys; sys.path.insert(0, ".")
from backend.database.database import engine
from sqlalchemy import text

STMTS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR",
    # Backfill display_name from username for existing rows
    "UPDATE users SET display_name = username WHERE display_name IS NULL",
]

with engine.connect() as conn:
    for s in STMTS:
        try:
            conn.execute(text(s))
            print(f"  OK: {s[:70]}")
        except Exception as e:
            print(f"  NOTE: {e}")
    conn.commit()

print("Phase 3 migration complete.")
