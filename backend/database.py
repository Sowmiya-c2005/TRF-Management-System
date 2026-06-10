from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:postgre123@localhost:5432/trf_management"

engine = create_engine(DATABASE_URL)