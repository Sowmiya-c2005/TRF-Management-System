"""
Enterprise migration — adds new columns to existing tables.
Run once: python -m backend.migrate_enterprise
"""
from sqlalchemy import text
from backend.database.database import engine

MIGRATIONS = [
    # User table additions
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;",
    # Make email unique (add unique constraint if not already there)
    """DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
      END IF;
    END $$;""",
    # TRF table additions
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT 'Medium';",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS remarks VARCHAR;",
]

def run():
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"OK: {sql[:60]}...")
            except Exception as e:
                conn.rollback()
                print(f"Skipped (already exists?): {e}")
    print("\nEnterprise migration complete.")

if __name__ == "__main__":
    run()
