
from collections import defaultdict
from sqlalchemy.orm import Session
from models import Transaction


def get_financial_summary(db: Session):
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

    # Keep currencies separate; do not mix USD, EUR, GBP.
    currency_totals = defaultdict(float)

    for transaction in completed:
        currency = (transaction.currency or "USD").upper()
        currency_totals[currency] += float(transaction.amount or 0)

    highest = max(
        transactions,
        key=lambda t: float(t.amount or 0),
        default=None
    )

    return {
        "total_transactions": len(transactions),
        "completed_count": len(completed),
        "failed_count": len(failed),
        "pending_count": len(pending),
        "currency_totals": dict(currency_totals),
        "highest_transaction": (
            {
                "description": highest.description,
                "amount": float(highest.amount or 0),
                "currency": highest.currency
            }
            if highest else None
        ),
        "recent_transactions": transactions[:5]
    }


def get_transaction_insights(db: Session):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.id.desc())
        .all()
    )

    category_totals = defaultdict(float)
    currency_totals = defaultdict(float)

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

    for transaction in completed:
        category = transaction.category or "Uncategorized"
        currency = (transaction.currency or "USD").upper()
        amount = float(transaction.amount or 0)

        # Group category totals by currency.
        key = f"{category} ({currency})"
        category_totals[key] += amount

        currency_totals[currency] += amount

    highest = max(
        transactions,
        key=lambda t: float(t.amount or 0),
        default=None
    )

    alerts = []

    for transaction in failed:
        alerts.append({
            "type": "failed",
            "message": (
                f"Transaction #{transaction.id} failed: "
                f"{transaction.description}"
            ),
            "amount": float(transaction.amount or 0),
            "currency": transaction.currency
        })

    for transaction in pending:
        alerts.append({
            "type": "pending",
            "message": (
                f"Transaction #{transaction.id} is still pending: "
                f"{transaction.description}"
            ),
            "amount": float(transaction.amount or 0),
            "currency": transaction.currency
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


def ask_finance_assistant(question: str, db: Session):
    data = get_financial_summary(db)
    q = question.lower().strip()

    if not q:
        return "Please enter a question."

    if any(word in q for word in [
        "total transaction", "how many transaction",
        "transaction count"
    ]):
        return (
            f"You have {data['total_transactions']} transactions "
            f"in your account."
        )

    if any(word in q for word in ["completed", "successful"]):
        return (
            f"You have {data['completed_count']} completed transactions."
        )

    if any(word in q for word in ["failed", "failure"]):
        return f"You have {data['failed_count']} failed transactions."

    if any(word in q for word in ["pending"]):
        return f"You have {data['pending_count']} pending transactions."

    if any(word in q for word in [
        "total amount", "total payment", "revenue", "volume"
    ]):
        if not data["currency_totals"]:
            return "No completed transaction amounts are available."

        return "Completed transaction totals by currency:\n" + "\n".join(
            f"{currency}: {amount:.2f}"
            for currency, amount in data["currency_totals"].items()
        )

    if any(word in q for word in ["highest", "largest", "biggest"]):
        highest = data["highest_transaction"]

        if highest:
            return (
                f"Your highest transaction is "
                f"{highest['amount']:.2f} {highest['currency']} "
                f"for {highest['description']} "
                f"(status: {highest['status']})."
            )

        return "No transactions found."

    if any(word in q for word in ["recent", "latest", "last transaction"]):
        if not data["recent_transactions"]:
            return "No transactions found."

        result = "Here are your 5 recent transactions:\n"

        for index, transaction in enumerate(
            data["recent_transactions"], start=1
        ):
            result += (
                f"\n{index}. {transaction.description} - "
                f"{float(transaction.amount or 0):.2f} "
                f"{transaction.currency} - "
                f"{transaction.status}"
            )

        return result

    if any(word in q for word in ["category", "categories"]):
        insights = get_transaction_insights(db)
        totals = insights["category_totals"]

        if not totals:
            return "No completed category data is available."

        return "Completed transaction totals by category:\n" + "\n".join(
            f"{category}: {amount:.2f}"
            for category, amount in totals.items()
        )

    if any(word in q for word in [
        "alert", "alerts", "unusual", "attention"
    ]):
        insights = get_transaction_insights(db)
        alerts = insights["alerts"]

        if not alerts:
            return "No failed or pending transaction alerts found."

        return "Transaction alerts:\n" + "\n".join(
            f"- {alert['message']}"
            for alert in alerts
        )

    if any(word in q for word in ["summary", "summarize", "overview"]):
        totals = "\n".join(
            f"{currency}: {amount:.2f}"
            for currency, amount in data["currency_totals"].items()
        )

        return (
            f"Financial Summary:\n"
            f"Total Transactions: {data['total_transactions']}\n"
            f"Completed: {data['completed_count']}\n"
            f"Failed: {data['failed_count']}\n"
            f"Pending: {data['pending_count']}\n"
            f"Completed Amounts:\n{totals or 'No completed amounts'}"
        )

    return (
        "I can help with transaction count, completed payments, "
        "failed payments, pending payments, transaction totals, "
        "highest transaction, recent transactions, category totals "
        "and transaction alerts."
    )
