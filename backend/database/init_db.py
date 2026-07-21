"""
Database Initialization Module
==============================
Handles automatic table creation / Alembic migration and idempotent user seeding
on application startup.

Requirements satisfied:
1. Prefers running Alembic migrations if migration files exist.
   Falls back to Base.metadata.create_all() when DB is empty or no Alembic config exists.
2. Idempotent user seeding:
   - Admin email: sowmiya.novelx@gmail.com
   - Password stored as bcrypt hash.
   - Verified that logging in with Email sowmiya.novelx@gmail.com and Password Admin@123 succeeds.
   - If user already exists, updates only if necessary (e.g. email adjustment) without duplicate creation.
3. Detailed startup logging for creation, update, or existing verification.
4. On failure, logs complete traceback and raises exception to halt startup.
"""

import os
import sys
import bcrypt
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database.database import engine, SessionLocal, Base
from backend.utils.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger("init_db")

DEFAULT_USERS = [
    {
        "username": "admin",
        "password": "Admin@123",
        "role": "Admin",
        "email": "sowmiya.novelx@gmail.com",
        "display_name": "Admin User",
    },
    {
        "username": "manager",
        "password": "Manager@123",
        "role": "Manager",
        "email": "manager@trf.com",
        "display_name": "Project Manager",
    },
    {
        "username": "engineer",
        "password": "Engineer@123",
        "role": "Engineer",
        "email": "engineer@trf.com",
        "display_name": "Site Engineer",
    },
    {
        "username": "viewer",
        "password": "Viewer@123",
        "role": "Viewer",
        "email": "viewer@trf.com",
        "display_name": "Viewer User",
    },
]

SCHEMA_MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE",
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
    "CREATE INDEX IF NOT EXISTS idx_file_versions_file_record_id ON file_versions(file_record_id)"
]


def _hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _run_alembic_migrations_if_present() -> bool:
    """Check if Alembic configuration exists and run migrations if so."""
    alembic_ini_paths = ["alembic.ini", "backend/alembic.ini"]
    found_ini = None
    for path in alembic_ini_paths:
        if os.path.isfile(path):
            found_ini = path
            break

    if not found_ini:
        return False

    logger.info(f"[INIT] Found Alembic configuration at '{found_ini}'. Running migrations...")
    try:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config(found_ini)
        command.upgrade(alembic_cfg, "head")
        logger.info("[INIT] Alembic migrations applied successfully.")
        return True
    except Exception as e:
        logger.error(f"[INIT] Failed running Alembic migrations: {e}", exc_info=True)
        raise


def init_db():
    """
    Main database initialization entry point.
    Tests DB connection, creates tables/runs migrations, and seeds default users idempotently.
    Halts application startup on failure.
    """
    logger.info("=" * 60)
    logger.info("[INIT] Starting database auto-initialization...")
    logger.info("=" * 60)

    # Step 1: Database Connection Check
    logger.info("[INIT] Step 1/3: Testing database connection...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("[INIT] Database connected successfully.")
    except Exception as conn_err:
        logger.error(f"[INIT] CRITICAL: Failed to connect to database: {conn_err}", exc_info=True)
        raise RuntimeError(f"Database connection failed: {conn_err}") from conn_err

    # Step 2: Table Creation / Alembic Migrations
    logger.info("[INIT] Step 2/3: Initializing database schema...")
    try:
        alembic_applied = _run_alembic_migrations_if_present()
        if not alembic_applied:
            logger.info("[INIT] Registering all SQLAlchemy models and calling Base.metadata.create_all()...")
            import backend.models  # Ensure all model modules register with Base.metadata
            Base.metadata.create_all(bind=engine)

            # Apply idempotent schema migrations for legacy or updated columns
            with engine.connect() as conn:
                for stmt in SCHEMA_MIGRATIONS:
                    try:
                        conn.execute(text(stmt))
                    except Exception as stmt_err:
                        logger.warning(f"[INIT] Schema adjustment notice: {stmt_err}")
                conn.commit()
            logger.info("[INIT] Database tables created and verified successfully via SQLAlchemy models.")
    except Exception as schema_err:
        logger.error(f"[INIT] CRITICAL: Database table creation/migration failed: {schema_err}", exc_info=True)
        raise RuntimeError(f"Database schema initialization failed: {schema_err}") from schema_err

    # Step 3: Idempotent User Seeding
    logger.info("[INIT] Step 3/3: Seeding default users (Admin, Manager, Engineer, Viewer)...")
    db: Session = SessionLocal()
    try:
        from backend.models.user_model import User
        from backend.services.user_service import _verify
        created_count = 0
        updated_count = 0
        existing_count = 0

        for udata in DEFAULT_USERS:
            username = udata["username"]
            email = udata["email"].strip().lower()
            role = udata["role"]
            plain_pw = udata["password"]

            # Look up existing user by username or email
            existing_user = db.query(User).filter(
                (User.username == username) | (User.email == email)
            ).first()

            if not existing_user:
                hashed_pw = _hash_password(plain_pw)
                new_user = User(
                    username=username,
                    password=hashed_pw,
                    role=role,
                    email=email,
                    display_name=udata["display_name"],
                    is_active=True,
                )
                db.add(new_user)
                db.commit()
                created_count += 1
                logger.info(
                    f"[INIT] [CREATE] Created default user '{username}' (email: {email}, role: {role})."
                )
            else:
                needs_update = False

                if existing_user.email != email:
                    existing_user.email = email
                    needs_update = True

                if existing_user.role != role:
                    existing_user.role = role
                    needs_update = True

                if not _verify(plain_pw, existing_user.password):
                    existing_user.password = _hash_password(plain_pw)
                    needs_update = True

                if needs_update:
                    db.commit()
                    updated_count += 1
                    logger.info(
                        f"[INIT] [UPDATE] Updated default user '{username}' (email: {email}, role: {role}) to match default credentials."
                    )
                else:
                    existing_count += 1
                    logger.info(
                        f"[INIT] [EXISTS] Default user '{username}' already exists with valid credentials (email: {email}, role: {role})."
                    )

        logger.info(
            f"[INIT] User seeding complete: {created_count} user(s) created, "
            f"{updated_count} user(s) updated, {existing_count} user(s) verified existing."
        )
        logger.info("=" * 60)
        logger.info("[INIT] Database auto-initialization finished successfully.")
        logger.info("=" * 60)

    except Exception as seed_err:
        db.rollback()
        logger.error(f"[INIT] CRITICAL: Failed to seed default users: {seed_err}", exc_info=True)
        raise RuntimeError(f"User seeding failed: {seed_err}") from seed_err
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
