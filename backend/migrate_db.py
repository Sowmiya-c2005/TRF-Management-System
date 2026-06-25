"""
One-time migration: add missing columns to pre-existing tables.
Run with: python backend/migrate_db.py
"""
from backend.database.database import engine
from sqlalchemy import text

MIGRATIONS = [
    # Add created_at to users table (pre-existing table, missed by create_all)
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
]

def main():
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            print(f"Running: {stmt[:70]}...")
            conn.execute(text(stmt))
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    main()
