
from collections import defaultdict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Transaction


def get_transaction_insights(db: Session):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.id.desc())
        .all()
    )

    completed = [
        t for t in transactions
        if str(t.status).lower() == "completed"
    ]

    failed = [
        t for t in transactions
        if str(t.status).lower() == "failed"
    ]

    pending = [
        t for t in transactions
        if str(t.status).lower() == "pending"
    ]

    category_totals = defaultdict(float)
    currency_totals = defaultdict(float)

    for t in completed:
        category = t.category or "Uncategorized"
        currency = (t.currency or "USD").upper()
        amount = float(t.amount or 0)

        category_totals[f"{category} ({currency})"] += amount
        currency_totals[currency] += amount

    highest = max(
        transactions,
        key=lambda t: float(t.amount or 0),
        default=None
    )

    alerts = []

    for t in failed:
        alerts.append({
            "type": "failed",
            "transaction_id": t.id,
            "message": f"Failed transaction: {t.description}",
            "amount": float(t.amount or 0),
            "currency": t.currency
        })

    for t in pending:
        alerts.append({
            "type": "pending",
            "transaction_id": t.id,
            "message": f"Pending transaction: {t.description}",
            "amount": float(t.amount or 0),
            "currency": t.currency
        })

    return {
        "total_transactions": len(transactions),
        "completed_count": len(completed),
        "failed_count": len(failed),
        "pending_count": len(pending),
        "category_totals": dict(category_totals),
        "currency_totals": dict(currency_totals),
        "highest_transaction": (
            {
                "description": highest.description,
                "amount": float(highest.amount or 0),
                "currency": highest.currency,
                "status": highest.status
            }
            if highest else None
        ),
        "alerts": alerts
    }


def get_monthly_financial_analytics(db: Session):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.created_at.asc())
        .all()
    )

    monthly_data = defaultdict(lambda: {
        "total_transactions": 0,
        "completed_count": 0,
        "failed_count": 0,
        "pending_count": 0,
        "completed_totals": defaultdict(float)
    })

    for t in transactions:
        if not t.created_at:
            continue

        month_key = t.created_at.strftime("%Y-%m")
        month = monthly_data[month_key]

        month["total_transactions"] += 1

        status = str(t.status).lower()

        if status == "completed":
            month["completed_count"] += 1
            currency = (t.currency or "USD").upper()
            month["completed_totals"][currency] += float(t.amount or 0)

        elif status == "failed":
            month["failed_count"] += 1

        elif status == "pending":
            month["pending_count"] += 1

    monthly_results = []

    for month_key in sorted(monthly_data):
        data = monthly_data[month_key]

        monthly_results.append({
            "month": month_key,
            "total_transactions": data["total_transactions"],
            "completed_count": data["completed_count"],
            "failed_count": data["failed_count"],
            "pending_count": data["pending_count"],
            "completed_totals": dict(data["completed_totals"])
        })

    return {
        "months_available": len(monthly_results),
        "monthly_data": monthly_results
    }


def ask_finance_assistant(question: str, db: Session):
    data = get_transaction_insights(db)
    q = question.lower().strip()

    if not q:
        return "Please enter a question."

    if "category" in q:
        if not data["category_totals"]:
            return "No completed category data available."

        return "Category totals:\n" + "\n".join(
            f"{category}: {amount:.2f}"
            for category, amount in data["category_totals"].items()
        )

    if any(word in q for word in ["alert", "unusual", "attention"]):
        if not data["alerts"]:
            return "No failed or pending transaction alerts found."

        return "Transaction alerts:\n" + "\n".join(
            f"- {alert['message']}"
            for alert in data["alerts"]
        )

    if "highest" in q or "largest" in q or "biggest" in q:
        highest = data["highest_transaction"]

        if highest:
            return (
                f"Highest transaction: {highest['description']} - "
                f"{highest['amount']:.2f} {highest['currency']} "
                f"({highest['status']})"
            )

        return "No transactions found."

    if "failed" in q or "failure" in q:
        return f"You have {data['failed_count']} failed transactions."

    if "pending" in q:
        return f"You have {data['pending_count']} pending transactions."

    if "completed" in q or "successful" in q:
        return f"You have {data['completed_count']} completed transactions."

    if "recent" in q or "latest" in q:
        transactions = (
            db.query(Transaction)
            .order_by(Transaction.id.desc())
            .limit(5)
            .all()
        )

        if not transactions:
            return "No transactions found."

        return "Recent transactions:\n" + "\n".join(
            f"{t.description} - {float(t.amount or 0):.2f} "
            f"{t.currency} - {t.status}"
            for t in transactions
        )

    if "total" in q or "summary" in q or "overview" in q:
        totals = "\n".join(
            f"{currency}: {amount:.2f}"
            for currency, amount in data["currency_totals"].items()
        )

        return (
            f"Financial Summary:\n"
            f"Total transactions: {data['total_transactions']}\n"
            f"Completed: {data['completed_count']}\n"
            f"Failed: {data['failed_count']}\n"
            f"Pending: {data['pending_count']}\n"
            f"Completed amounts:\n{totals or 'No completed amounts'}"
        )

    return (
        "Ask about transaction summary, completed payments, "
        "failed payments, pending payments, category totals, "
        "highest transaction, recent transactions or alerts."
    )


async def ask_finance_assistant_with_openai(question: str, db: Session):
    import json
    import os
    from pathlib import Path
    from dotenv import load_dotenv
    from openai import AsyncOpenAI

    load_dotenv(Path(__file__).resolve().parent / ".env")
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return ask_finance_assistant(question, db), "database_rule_based_fallback"

    data = get_transaction_insights(db)
    safe_context = {
        "total_transactions": data["total_transactions"],
        "completed_count": data["completed_count"],
        "failed_count": data["failed_count"],
        "pending_count": data["pending_count"],
        "category_totals": data["category_totals"],
        "currency_totals": data["currency_totals"],
        "highest_transaction": (
            {
                "amount": data["highest_transaction"]["amount"],
                "currency": data["highest_transaction"]["currency"],
                "status": data["highest_transaction"]["status"]
            } if data["highest_transaction"] else None
        )
    }

    model = os.getenv("OPENAI_MODEL", "gpt-5.5")

    async with AsyncOpenAI(api_key=api_key) as client:
        response = await client.responses.create(
            model=model,
            instructions=(
                "You are PayPilot AI, a careful personal finance assistant. "
                "Answer using the supplied transaction data. "
                "Never invent balances, transactions, or financial facts. "
                "Clearly state when data is insufficient. "
                "Give practical, concise explanations. "
                "Do not claim to execute payments or financial actions. "
                "You are not a licensed financial advisor."
            ),
            input=(
                "Transaction summary (JSON): "
                + json.dumps(safe_context, ensure_ascii=False)
                + "\n\nUser question: "
                + question
            ),
            max_output_tokens=500
        )

    answer = response.output_text.strip()
    if not answer:
        raise RuntimeError("OpenAI returned an empty response.")

    return answer, "openai_responses_api"
