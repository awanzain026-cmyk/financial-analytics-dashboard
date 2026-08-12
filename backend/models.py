"""AI Expense Tracker — database tables (the SCHEMA).

Each class = one table, attributes = columns. SQLAlchemy generates the
CREATE TABLE statements and keeps them compatible with SQLite and Postgres.
"""

from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    monthly_budget: Mapped[float] = mapped_column(Float, default=0.0)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String(200))
    date: Mapped[date] = mapped_column(Date)
    category: Mapped[str] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)