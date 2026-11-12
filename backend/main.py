
from decimal import Decimal
from typing import Optional, Literal

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import httpx

from database import Base, engine, get_db
from models import Transaction
from paypal_service import create_paypal_order, capture_paypal_order

from ai_service import (
    ask_finance_assistant,
    get_transaction_insights,
    get_monthly_financial_analytics
)


# Create tables and safely add the new column
Base.metadata.create_all(bind=engine)

inspector = inspect(engine)

if "paypal_order_id" not in [
    column["name"]
    for column in inspector.get_columns("transactions")
]:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE transactions "
                "ADD COLUMN paypal_order_id VARCHAR(100)"
            )
        )


app = FastAPI(
    title="PayPilot AI API",
    description="Intelligent Payment and Finance Copilot",
    version="1.3.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# PYDANTIC MODELS
# -------------------------

class TransactionCreate(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )
    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3
    )
    category: Optional[str] = None
    status: Literal[
        "pending",
        "completed",
        "failed"
    ] = "completed"


class TransactionResponse(BaseModel):
    id: int
    description: str
    amount: Decimal
    currency: str
    category: Optional[str]
    status: str

    model_config = {"from_attributes": True}


class PaymentOrderRequest(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )
    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3
    )
    category: Optional[str] = "Payment"


class AIQuestion(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=500
    )


# -------------------------
# HOME AND HEALTH
# -------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to PayPilot AI",
        "status": "Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PayPilot AI Backend"
    }


# -------------------------
# TRANSACTIONS
# -------------------------

# Manual transaction endpoint for development/testing only.
# This does NOT represent a verified PayPal payment.

@app.post(
    "/transactions",
    response_model=TransactionResponse
)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    new_transaction = Transaction(
        description=transaction.description,
        amount=transaction.amount,
        currency=transaction.currency.upper(),
        category=transaction.category,
        status=transaction.status
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@app.get(
    "/transactions",
    response_model=list[TransactionResponse]
)
def get_transactions(
    db: Session = Depends(get_db)
):
    return db.query(Transaction).order_by(
        Transaction.id.desc()
    ).all()


@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


# -------------------------
# AI FINANCE ASSISTANT
# -------------------------

@app.post("/ai/ask")
def finance_assistant(
    request: AIQuestion,
    db: Session = Depends(get_db)
):
    try:
        answer = ask_finance_assistant(
            question=request.question,
            db=db
        )

        return {
            "question": request.question,
            "answer": answer,
            "assistant": "PayPilot Finance Assistant",
            "mode": "database_rule_based"
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to process your finance question."
        )


# -------------------------
# TRANSACTION INSIGHTS
# -------------------------

@app.get("/ai/insights")
def transaction_insights(
    db: Session = Depends(get_db)
):
    try:
        insights = get_transaction_insights(db)

        return {
            "assistant": "PayPilot Finance Insights",
            "mode": "database_analytics",
            "insights": insights
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate transaction insights."
        )


# -------------------------
# MONTHLY FINANCIAL ANALYTICS
# -------------------------

@app.get("/ai/monthly-analytics")
def monthly_financial_analytics(
    db: Session = Depends(get_db)
):
    try:
        analytics = get_monthly_financial_analytics(db)

        return {
            "assistant": "PayPilot Monthly Analytics",
            "mode": "database_monthly_analytics",
            "analytics": analytics
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate monthly analytics."
        )


# -------------------------
# PAYPAL CREATE ORDER
# -------------------------

@app.post("/payments/create-order")
def create_payment_order(
    request: PaymentOrderRequest,
    db: Session = Depends(get_db)
):
    transaction = Transaction(
        description=request.description,
        amount=request.amount,
        currency=request.currency.upper(),
        category=request.category,
        status="pending"
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    try:
        paypal_order = create_paypal_order(
            amount=transaction.amount,
            currency=transaction.currency,
            transaction_id=transaction.id
        )

        transaction.paypal_order_id = paypal_order["id"]
        db.commit()

        approval_url = next(
            (
                link["href"]
                for link in paypal_order.get("links", [])
                if link.get("rel") == "approve"
            ),
            None
        )

        return {
            "message": "PayPal order created",
            "transaction_id": transaction.id,
            "paypal_order_id": paypal_order["id"],
            "paypal_status": paypal_order.get("status"),
            "approval_url": approval_url
        }

    except RuntimeError as exc:
        transaction.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=503,
            detail=str(exc)
        )

    except httpx.HTTPError:
        transaction.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not create PayPal order. "
                "Check Sandbox credentials and API response."
            )
        )


# -------------------------
# PAYPAL CAPTURE PAYMENT
# -------------------------

@app.post("/payments/capture/{order_id}")
def capture_payment(
    order_id: str,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.paypal_order_id == order_id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="PayPal order not found in PayPilot database"
        )

    if transaction.status == "completed":
        raise HTTPException(
            status_code=409,
            detail="This transaction has already been completed"
        )

    if transaction.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This transaction is not pending"
        )

    try:
        result = capture_paypal_order(order_id)

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc)
        )

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"PayPal capture request failed with "
                f"HTTP {exc.response.status_code}"
            )
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Unable to communicate with PayPal"
        )

    # Verify PayPal's actual capture response
    purchase_units = result.get("purchase_units", [])

    if not purchase_units:
        raise HTTPException(
            status_code=502,
            detail="PayPal response did not contain purchase details"
        )

    captures = purchase_units[0].get(
        "payments", {}
    ).get("captures", [])

    if not captures:
        raise HTTPException(
            status_code=409,
            detail="No capture found in PayPal response"
        )

    capture = captures[0]
    captured_amount = capture.get("amount", {})

    amount_matches = (
        Decimal(captured_amount.get("value", "0"))
        == transaction.amount
    )

    currency_matches = (
        captured_amount.get("currency_code")
        == transaction.currency
    )

    if (
        result.get("status") != "COMPLETED"
        or capture.get("status") != "COMPLETED"
        or not amount_matches
        or not currency_matches
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "PayPal capture status, amount, "
                "or currency verification failed"
            )
        )

    transaction.status = "completed"

    db.commit()
    db.refresh(transaction)

    return {
        "message": "PayPal payment verified and saved",
        "transaction_id": transaction.id,
        "paypal_order_id": order_id,
        "capture_id": capture.get("id"),
        "status": transaction.status,
        "amount": str(transaction.amount),
        "currency": transaction.currency
    }
