\# PayPilot AI – Intelligent Payment \& Finance Copilot



PayPilot AI is a full-stack payment and finance dashboard designed to help users monitor transactions, identify payment issues and understand their financial activity.



\## Features



\- Transaction management and payment status tracking

\- Database-driven transaction insights

\- Smart alerts for failed and pending transactions

\- Monthly financial analytics

\- Rule-based finance assistant

\- PayPal Sandbox payment order creation



\## Technology Stack



| Layer | Technologies |

|---|---|

| Frontend | React, Vite, JavaScript |

| Backend | Python, FastAPI |

| Database | SQLite, SQLAlchemy |

| Payment Gateway | PayPal Sandbox REST API |



\## Architecture



React Frontend → FastAPI Backend → SQLite Database



PayPal Sandbox is integrated through backend REST API endpoints for authentication and payment order creation.



\## Project Structure



```text

PayPilot-AI/

├── backend/

│   ├── main.py

│   ├── ai\_service.py

│   ├── database.py

│   ├── models.py

│   └── paypal\_service.py

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── main.jsx

│   ├── package.json

│   └── vite.config.js

└── README.md

```



\## Local Setup



\### Backend



```powershell

cd backend

python -m venv .venv

.\\.venv\\Scripts\\Activate.ps1

pip install fastapi uvicorn sqlalchemy pydantic-settings python-dotenv httpx python-multipart

```



Configure PayPal Sandbox credentials in `backend/.env`:



```env

PAYPAL\_CLIENT\_ID=your\_sandbox\_client\_id

PAYPAL\_CLIENT\_SECRET=your\_sandbox\_client\_secret

PAYPAL\_BASE\_URL=https://api-m.sandbox.paypal.com

```



Start the backend:



```powershell

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

```



API documentation: `http://127.0.0.1:8000/docs`



\### Frontend



Open another PowerShell window:



```powershell

cd frontend

npm install

npm run dev

```



Open `http://localhost:5173/`.



\## Payment Integration Status



PayPal Sandbox OAuth authentication and payment order creation have been tested. Buyer approval and end-to-end payment capture validation remain pending due to a Sandbox seller currency-acceptance issue.



\## Finance Assistant



The finance assistant currently uses database-grounded, rule-based logic to answer questions about stored transaction records. It does not depend on an external LLM API.



\## Security



\- Keep `.env` files private.

\- Never commit PayPal credentials or database files.

\- Use Sandbox credentials for testing.



\## Future Improvements



\- Complete end-to-end PayPal payment validation.

\- Expand financial analytics.

\- Add more payment provider integrations.

\- Enhance finance assistant capabilities.



\---



\*\*PayPilot AI – Making payment activity easier to understand.\*\*

