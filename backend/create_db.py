"""
Run this once to create all database tables:
  python -m backend.create_db
"""
from backend.database.init_db import init_db


def main():
    init_db()


if __name__ == "__main__":
    main()
