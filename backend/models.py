from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class TRFRecord(Base):
    __tablename__ = "trf_records"

    id = Column(Integer, primary_key=True)
    trf_number = Column(String, unique=True)
    project_name = Column(String)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))