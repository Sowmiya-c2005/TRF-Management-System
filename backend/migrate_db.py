"""
Incremental schema migration — idempotent, safe to run multiple times.
Run with: python backend/migrate_db.py
"""
from backend.database.database import engine
from sqlalchemy import text

MIGRATIONS = [
    # ── users table ──────────────────────────────────────────────────────────
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(512)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email         VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name  VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone         VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url    VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT TRUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP",
    "CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)",

    # ── trf_records table (v2.x additions) ───────────────────────────────────
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS status              VARCHAR(50)  NOT NULL DEFAULT 'Draft'",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS status_updated_at   TIMESTAMP",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS assigned_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS created_by_id        INTEGER REFERENCES users(id) ON DELETE SET NULL",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS priority             VARCHAR(20)  NOT NULL DEFAULT 'Medium'",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS due_date             TIMESTAMP",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS remarks              TEXT",
    "ALTER TABLE trf_records ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP",
    "CREATE INDEX IF NOT EXISTS idx_trf_records_status   ON trf_records(status)",
    "CREATE INDEX IF NOT EXISTS idx_trf_records_priority ON trf_records(priority)",

    # ── trf_engineer_assignments table ────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS trf_engineer_assignments (
        id             SERIAL PRIMARY KEY,
        trf_id         INTEGER NOT NULL REFERENCES trf_records(id) ON DELETE CASCADE,
        engineer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (trf_id, engineer_id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_tea_trf_id      ON trf_engineer_assignments(trf_id)",
    "CREATE INDEX IF NOT EXISTS idx_tea_engineer_id ON trf_engineer_assignments(engineer_id)",

    # ── activities table ──────────────────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS activities (
        id          SERIAL PRIMARY KEY,
        trf_id      INTEGER REFERENCES trf_records(id) ON DELETE CASCADE,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_activities_trf_id  ON activities(trf_id)",
    "CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)",

    # ── comments table ────────────────────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS comments (
        id         SERIAL PRIMARY KEY,
        trf_id     INTEGER NOT NULL REFERENCES trf_records(id) ON DELETE CASCADE,
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_comments_trf_id ON comments(trf_id)",

    # ── activities table (v2.x additions) ────────────────────────────────────
    "ALTER TABLE activities ADD COLUMN IF NOT EXISTS extra_data TEXT",

    # ── audit_logs table (v2.x additions) ────────────────────────────────────
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value TEXT",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT",

    # ── file_versions table ───────────────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS file_versions (
        id             SERIAL PRIMARY KEY,
        file_record_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        filename       VARCHAR(255) NOT NULL,
        file_path      VARCHAR(255) NOT NULL,
        size_bytes     INTEGER NOT NULL,
        uploaded_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        sharepoint_id  VARCHAR(255)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_file_versions_file_record_id ON file_versions(file_record_id)",
]


def main():
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            label = stmt.strip()[:70].replace("\n", " ")
            try:
                conn.execute(text(stmt))
                print(f"  OK: {label}")
            except Exception as e:
                conn.rollback()
                print(f"  ERR [{label}]: {e}")
        conn.commit()
    print("Migration complete.")


if __name__ == "__main__":
    main()
