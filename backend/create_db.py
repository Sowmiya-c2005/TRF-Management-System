"""
Run this once to create all database tables:
  python -m backend.create_db
"""
from backend.database.database import engine, Base

# Import all models to register them with Base before calling create_all
import backend.models  # noqa: F401


def main():
    print("Creating all normalized database tables...")
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: All tables created successfully.")


if __name__ == "__main__":
    main()
