# 🚀 PayPilot AI – Intelligent Payment & Finance Copilot

<p align="center">
  <strong>Smarter Payments. Clearer Insights. Better Financial Decisions.</strong>
</p>

<p align="center">
  A full-stack payment and finance dashboard designed to monitor transactions, identify payment issues, and understand financial activity through a unified platform.
</p>

<p align="center">
  <a href="https://paypilot-ai-frontend.onrender.com">🌐 Live Demo</a> •
  <a href="https://github.com/jashikaraja05-pixel/PayPilot-AI">💻 GitHub Repository</a> •
  <a href="https://paypilot-ai-backend-yh47.onrender.com/docs">📚 API Documentation</a>
</p>

---

## 📌 1. Project Overview

PayPilot AI is an intelligent payment and finance dashboard that simplifies financial transaction monitoring and payment management.

It combines a modern React frontend, FastAPI backend, SQLite database, Firebase Authentication, and PayPal Sandbox integration.

The platform helps users monitor transactions, identify failed and pending payments, explore monthly financial analytics, and interact with a finance assistant.

## ✨ 2. Key Features

- 📊 **Financial Dashboard** – Centralized financial overview.
- 💳 **Transaction Management** – Monitor payment records and statuses.
- 🔐 **Firebase Authentication** – Email/password registration, login, and logout.
- 🤖 **Finance Assistant** – Rule-based answers using stored transaction information.
- 📈 **Monthly Analytics** – Explore financial activity over time.
- 🚨 **Smart Insights** – Identify failed and pending transaction patterns.
- 💰 **PayPal Integration** – Create payment orders using PayPal Sandbox.
- 🔎 **Transaction Search** – Search and filter transaction records.

## 🛠️ 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| UI & Charts | CSS, Lucide React, Recharts |
| Backend | Python, FastAPI |
| Database | SQLite, SQLAlchemy |
| Authentication | Firebase Authentication |
| Payment Gateway | PayPal Sandbox REST API |
| Deployment | Render |
| Version Control | Git, GitHub |

---

## 🏗️ 4. System Architecture

The following diagram represents the overall architecture of PayPilot AI.

```mermaid
flowchart TB
    USER(["👤 User"])

    subgraph FRONTEND["FRONTEND LAYER"]
        UI["React + Vite Dashboard"]
        AUTH["Firebase Authentication"]
        DASH["Dashboard & Transactions"]
        ANALYTICS["Financial Analytics"]
        ASSISTANT["Finance Assistant Interface"]
    end

    subgraph BACKEND["BACKEND LAYER"]
        API["FastAPI REST API"]
        TRANS["Transaction Management"]
        INSIGHTS["Insights & Analytics"]
        AI["Rule-Based Finance Assistant"]
        PAY["PayPal Service"]
    end

    subgraph DATABASE["DATA LAYER"]
        ORM["SQLAlchemy ORM"]
        DB[("SQLite Database")]
    end

    PP["PayPal Sandbox API"]

    USER --> UI
    UI --> AUTH
    UI --> DASH
    UI --> ANALYTICS
    UI --> ASSISTANT

    DASH --> API
    ANALYTICS --> API
    ASSISTANT --> API

    API --> TRANS
    API --> INSIGHTS
    API --> AI
    API --> PAY

    TRANS --> ORM
    INSIGHTS --> ORM
    AI --> ORM
    ORM --> DB

    PAY <--> PP

    style FRONTEND fill:#075985,color:#fff
    style BACKEND fill:#166534,color:#fff
    style DATABASE fill:#4c1d95,color:#fff
```

## 🔄 5. Complete System Workflow

This workflow explains how users interact with the different modules of PayPilot AI.

```mermaid
flowchart TD
    START(["Start"])
    OPEN["Open PayPilot AI"]
    AUTH{"User Authenticated?"}

    LOGIN["Register / Sign In"]
    FIREBASE["Firebase Authentication"]
    DASH["Load Dashboard"]

    CHOICE{"Choose a Feature"}

    TRANS["View Transactions"]
    INSIGHT["View Smart Insights"]
    ANALYTICS["Monthly Analytics"]
    AI["Ask Finance Assistant"]
    PAYMENT["Create Payment"]

    API["FastAPI Backend"]
    DB[("SQLite Database")]
    RESULT["Process and Return Results"]
    DISPLAY["Display Results to User"]

    START --> OPEN
    OPEN --> AUTH

    AUTH -- No --> LOGIN
    LOGIN --> FIREBASE
    FIREBASE --> DASH

    AUTH -- Yes --> DASH

    DASH --> CHOICE

    CHOICE --> TRANS
    CHOICE --> INSIGHT
    CHOICE --> ANALYTICS
    CHOICE --> AI
    CHOICE --> PAYMENT

    TRANS --> API
    INSIGHT --> API
    ANALYTICS --> API
    AI --> API
    PAYMENT --> API

    API --> DB
    DB --> RESULT
    RESULT --> DISPLAY
    DISPLAY --> DASH

    style START fill:#166534,color:#fff
    style AUTH fill:#92400e,color:#fff
    style API fill:#075985,color:#fff
    style DB fill:#4c1d95,color:#fff
```

## 💳 6. PayPal Payment Workflow

PayPilot AI integrates PayPal Sandbox REST APIs to create payment orders and provide an approval URL.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant PP as PayPal Sandbox

    User->>UI: Enter payment details
    UI->>API: Request payment order

    API->>PP: Request OAuth access token
    PP-->>API: Return access token

    API->>PP: Create payment order
    PP-->>API: Return Order ID and Approval URL

    API-->>UI: Return payment details
    UI-->>User: Open PayPal approval URL

    User->>PP: Review and approve payment

    Note over User,PP: End-to-end buyer approval and capture validation pending
```

**Current Integration Status:**
- PayPal Sandbox OAuth authentication implemented and tested.
- Payment order creation implemented and tested.
- End-to-end payment capture validation is pending due to a Sandbox seller currency-acceptance issue.

## 🔐 7. Authentication Workflow

Firebase Authentication manages email/password registration and sign-in.

```mermaid
flowchart TD
    A(["User Opens Application"])
    B{"Authenticated?"}
    C["Enter Email and Password"]
    D["Firebase Authentication"]
    E{"Credentials Valid?"}
    F["Display Authentication Error"]
    G["Open Dashboard"]
    H["Click Logout"]
    I["Firebase Sign Out"]
    J(["Return to Login Screen"])

    A --> B
    B -- Yes --> G
    B -- No --> C
    C --> D
    D --> E

    E -- No --> F
    F --> C
    E -- Yes --> G

    G --> H
    H --> I
    I --> J

    style A fill:#166534,color:#fff
    style D fill:#4338ca,color:#fff
    style G fill:#075985,color:#fff
    style J fill:#92400e,color:#fff
```

## 🧠 8. Finance Assistant Workflow

The current Finance Assistant uses rule-based logic and stored transaction information.

```mermaid
flowchart TD
    USER["User Enters a Finance Question"]
    FRONT["React Assistant Interface"]
    API["FastAPI AI Endpoint"]
    SERVICE["Rule-Based Finance Service"]
    DB[("SQLite Transaction Records")]
    PROCESS["Analyze Transaction Information"]
    ANSWER["Generate Response"]
    RESULT["Display Answer to User"]

    USER --> FRONT
    FRONT --> API
    API --> SERVICE
    SERVICE --> DB
    DB --> PROCESS
    PROCESS --> ANSWER
    ANSWER --> RESULT

    style FRONT fill:#075985,color:#fff
    style SERVICE fill:#6d28d9,color:#fff
    style DB fill:#475569,color:#fff
    style RESULT fill:#166534,color:#fff
```

**Note:** This is a database-grounded, rule-based assistant. An external LLM API is not currently integrated.

---

## 📁 9. Project Structure

```text
PayPilot-AI/
│
├── backend/
│   ├── main.py
│   ├── ai_service.py
│   ├── database.py
│   ├── models.py
│   └── paypal_service.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── AuthScreen.jsx
│   │   ├── firebase.js
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml
└── README.md
```

## ⚙️ 10. Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- Git
- Firebase Project
- PayPal Developer Sandbox Account

### Step 1: Clone Repository

```bash
git clone https://github.com/jashikaraja05-pixel/PayPilot-AI.git

cd PayPilot-AI
```

### Step 2: Backend Setup

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install fastapi uvicorn sqlalchemy pydantic-settings python-dotenv httpx python-multipart
```

Configure PayPal Sandbox credentials in `backend/.env`:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Start the backend:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend API:

`http://127.0.0.1:8000`

API Documentation:

`http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup

Open another terminal:

```powershell
cd frontend

npm install
```

Create `frontend/.env` and configure:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Enable Email/Password authentication in Firebase Console.

Start the frontend:

```powershell
npm run dev
```

Open:

`http://localhost:5173`

---

## 🌐 11. Live Deployment

| Component | URL |
|---|---|
| Frontend | https://paypilot-ai-frontend.onrender.com |
| Backend | https://paypilot-ai-backend-yh47.onrender.com |
| API Documentation | https://paypilot-ai-backend-yh47.onrender.com/docs |
| GitHub Repository | https://github.com/jashikaraja05-pixel/PayPilot-AI |

## 🔒 12. Security Notes

- Keep `.env` files private.
- Never commit PayPal client secrets.
- Use PayPal Sandbox credentials for testing.
- Configure Firebase authorized domains for deployed authentication.
- Backend Firebase token verification and user-level API authorization are future improvements.

## 🚀 13. Future Enhancements

- Complete end-to-end PayPal payment capture validation.
- Add backend Firebase token verification.
- Introduce user-specific transaction access.
- Integrate an external AI model for advanced financial assistance.
- Expand financial analytics and reporting.
- Improve notification and settings management.

---

<p align="center">
  <strong>PayPilot AI</strong>
  <br/>
  Making payment activity easier to understand.
  <br/><br/>
  Built with ❤️ using React, FastAPI, Firebase and PayPal Sandbox.
</p>
