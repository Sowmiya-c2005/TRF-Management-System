"""
Run this once to create all database tables:
  python -m backend.create_db
"""
from backend.database.database import engine, Base

# Import models so SQLAlchemy registers them before creating tables
from backend.models import trf_model, user_model  # noqa: F401

def main():
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully.")

if __name__ == "__main__":
    main()
