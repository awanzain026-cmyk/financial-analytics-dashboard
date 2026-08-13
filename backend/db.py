"""AI Expense Tracker — database setup (Stage 4: SQLite, swap to Postgres by env var).

DATABASE_URL is read from the environment, defaulting to a local SQLite file.
To switch to Neon Postgres (Stage 7), set:
  DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
A plain postgresql:// URL is auto-upgraded to the psycopg (v3) driver.
"""

import os

from sqlalchemy import create_engine, text
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


def ensure_schema():
    """Create tables and apply any tiny column migrations.

    create_all only creates *missing* tables — it never alters existing ones,
    so we explicitly add the `reviewed` column when it doesn't exist yet.
    Idempotent across SQLite and Postgres (SQLite has no IF NOT EXISTS on
    ADD COLUMN, hence the duplicate-column exception being swallowed).
    """
    Base.metadata.create_all(bind=engine)
    dialect = engine.dialect.name
    try:
        with engine.begin() as conn:
            if dialect == "postgresql":
                conn.execute(
                    text(
                        "ALTER TABLE expenses "
                        "ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE"
                    )
                )
            else:
                # SQLite: check pragma first (cheap) and skip the ALTER
                # if the column already exists.
                cols = conn.execute(text("PRAGMA table_info(expenses)")).fetchall()
                if not any(row[1] == "reviewed" for row in cols):
                    conn.execute(
                        text("ALTER TABLE expenses ADD COLUMN reviewed BOOLEAN NOT NULL DEFAULT FALSE")
                    )
    except Exception:
        # Duplicate-column / already-migrated races are harmless; a genuinely
        # broken schema will surface loudly at request time, not here.
        pass


def get_db():
    """FastAPI dependency: one database session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()