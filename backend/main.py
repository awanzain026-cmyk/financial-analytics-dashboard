"""AI Expense Tracker — Backend (REST API + LLM + SQLite/Postgres + auth)."""

import os
from datetime import date
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth import create_token, get_current_user, hash_password, verify_password
from categorizer import classify
from db import Base, engine, get_db
from models import Expense, User

# Create tables if they don't exist (idempotent). In production we'd use migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# CORS: allow the local dev frontend, any *.vercel.app deployment, plus whatever
# origins are in CORS_ORIGINS (comma-separated).
cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"] + [
    o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic models: what the API accepts / returns ───
class ExpenseIn(BaseModel):
    amount: float = Field(gt=0, description="Expense amount in dollars")
    description: str = Field(min_length=1, max_length=200)
    date: date


class CategorizeIn(BaseModel):
    description: str = Field(min_length=1, max_length=200)


class CategorizeOut(BaseModel):
    category: str
    confidence: float


class ExpenseOut(ExpenseIn):
    id: int
    category: str
    confidence: float

    # Lets FastAPI build ExpenseOut straight from an SQLAlchemy Expense object
    model_config = ConfigDict(from_attributes=True)


class AuthIn(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class MeOut(BaseModel):
    user_id: int
    email: str
    monthly_budget: float = 0.0


class BudgetIn(BaseModel):
    monthly_budget: float = Field(ge=0, le=1_000_000)


# ─── Demo data (instant, no LLM needed — reliability for visitors) ───
DEMO_EXPENSES = [
    (62.38, "Trader Joe's groceries", "groceries", 0.97),
    (54.20, "Shell gas station", "transport", 0.93),
    (14.20, "Lunch at Chipotle", "dining", 0.98),
    (129.99, "Amazon order", "shopping", 0.86),
    (142.60, "PG&E electric bill", "bills", 0.94),
    (11.99, "Netflix subscription", "subscriptions", 0.99),
    (27.84, "CVS pharmacy", "health", 0.91),
    (32.00, "AMC movie tickets", "entertainment", 0.88),
]


# ─── Routes ───
@app.get("/")
def root():
    return {"app": "Expense Tracker API", "docs": "/docs"}


# ─── Auth ───
@app.post("/auth/signup", response_model=AuthOut, status_code=201)
def signup(payload: AuthIn, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user.id), "token_type": "bearer",
            "user_id": user.id, "email": user.email}


@app.post("/auth/login", response_model=AuthOut)
def login(payload: AuthIn, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_token(user.id), "token_type": "bearer",
            "user_id": user.id, "email": user.email}


@app.get("/auth/me", response_model=MeOut)
def me(current: User = Depends(get_current_user)):
    return {"user_id": current.id, "email": current.email, "monthly_budget": current.monthly_budget}


@app.put("/budget", response_model=MeOut)
def update_budget(
    payload: BudgetIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    current.monthly_budget = payload.monthly_budget
    db.commit()
    return {"user_id": current.id, "email": current.email, "monthly_budget": current.monthly_budget}


# ─── Expenses (PROTECTED: require a valid token) ───
@app.post("/categorize", response_model=CategorizeOut)
def categorize_expense(payload: CategorizeIn):
    """Pure LLM call: description -> {category, confidence}. Used by the frontend
    to show a live AI suggestion as you type (and great for testing the prompt)."""
    return classify(payload.description)


@app.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return (
        db.query(Expense)
        .filter(Expense.user_id == current.id)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .all()
    )


@app.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(
    expense: ExpenseIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    result = classify(expense.description)
    # Demo rows are placeholders for empty accounts — your first real expense
    # replaces them, so the dashboard never mixes demo and real data.
    db.query(Expense).filter(Expense.user_id == current.id, Expense.is_demo == True).delete()
    record = Expense(
        user_id=current.id,
        amount=expense.amount,
        description=expense.description,
        date=expense.date,
        category=result["category"],
        confidence=result["confidence"],
    )
    db.add(record)
    db.commit()  # save to the database
    db.refresh(record)  # load the auto-generated id
    return record


@app.post("/expenses/demo", response_model=List[ExpenseOut], status_code=201)
def load_demo_expenses(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Seed a handful of realistic demo expenses (categorized, no LLM call) —
    only available while the user has no expenses yet."""
    existing = db.query(Expense).filter(Expense.user_id == current.id).count()
    if existing > 0:
        raise HTTPException(status_code=409, detail="You already have expenses")

    today = date.today()
    created = []
    for i, (amount, description, category, confidence) in enumerate(DEMO_EXPENSES):
        day = max(1, min(today.day, 1 + i * 2))
        record = Expense(
            user_id=current.id,
            amount=amount,
            description=description,
            date=today.replace(day=day),
            category=category,
            confidence=confidence,
            is_demo=True,
        )
        db.add(record)
        created.append(record)
    db.commit()
    for record in created:
        db.refresh(record)
    return created


@app.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    record = db.get(Expense, expense_id)
    # 404 hides the existence of other users' records
    if record is None or record.user_id != current.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    return record