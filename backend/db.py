"""AI Expense Tracker — database setup (Stage 4: SQLite, swap to Postgres by env var).

DATABASE_URL is read from the environment, defaulting to a local SQLite file.
To switch to Neon Postgres (Stage 7), set:
  DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
A plain postgresql:// URL is auto-upgraded to the psycopg (v3) driver.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")

# SQLAlchemy maps plain postgresql:// to psycopg2 by default; we use psycopg v3.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite + FastAPI can serve requests from different threads -> allow same-thread=false.
# Postgres does not need this, hence the condition.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: one database session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()