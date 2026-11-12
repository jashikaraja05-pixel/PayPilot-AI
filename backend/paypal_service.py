
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "").strip()

BASE_URL = os.getenv(
    "PAYPAL_BASE_URL",
    "https://api-m.sandbox.paypal.com"
).rstrip("/")


def get_access_token():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError(
            "PayPal Sandbox credentials are not configured."
        )

    response = httpx.post(
        f"{BASE_URL}/v1/oauth2/token",
        auth=(CLIENT_ID, CLIENT_SECRET),
        data={"grant_type": "client_credentials"},
        headers={"Accept": "application/json"},
        timeout=30
    )

    response.raise_for_status()
    return response.json()["access_token"]


def create_paypal_order(amount, currency, transaction_id):
    token = get_access_token()

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "custom_id": str(transaction_id),
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}"
                }
            }
        ],
        "application_context": {
            "return_url": "http://localhost:5173/",
            "cancel_url": "http://localhost:5173/"
        }
    }

    response = httpx.post(
        f"{BASE_URL}/v2/checkout/orders",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        timeout=30
    )

    response.raise_for_status()
    return response.json()


def capture_paypal_order(order_id):
    token = get_access_token()

    response = httpx.post(
        f"{BASE_URL}/v2/checkout/orders/{order_id}/capture",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        timeout=30
    )

    response.raise_for_status()
    return response.json()
