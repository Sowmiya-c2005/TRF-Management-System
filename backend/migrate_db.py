"""
One-time migration: add missing columns to pre-existing tables.
Run with: python backend/migrate_db.py
"""
from backend.database.database import engine
from sqlalchemy import text

MIGRATIONS = [
    # Add created_at to users table (pre-existing table, missed by create_all)
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    
    # Add refresh_token to users table
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255)",
    
    # Add email to users table
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
    
    # Create file_versions table
    """
    CREATE TABLE IF NOT EXISTS file_versions (
        id SERIAL PRIMARY KEY,
        file_record_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        size_bytes INTEGER NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        sharepoint_id VARCHAR(255)
    )
    """,
    
    # Create index on file_record_id in file_versions table
    "CREATE INDEX IF NOT EXISTS idx_file_versions_file_record_id ON file_versions(file_record_id)"
]

def main():
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            print(f"Running: {stmt.strip()[:70]}...")
            conn.execute(text(stmt))
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    main()
