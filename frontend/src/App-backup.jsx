
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Bot, Settings,
  Bell, Search, Plus, RefreshCw, ArrowUpRight,
  Wallet, TrendingUp, Clock3, CheckCircle2,
  XCircle, Menu, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Overview");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // AI Assistant states
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [payment, setPayment] = useState({
    description: "",
    amount: "",
    currency: "USD",
    category: "Payment"
  });

  // Load transactions from backend
  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/transactions`);

      if (!response.ok) {
        throw new Error("Could not load transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError("Backend connection failed. Check Window 1.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  // AI Finance Assistant API connection
  async function askAI(question) {
    const userQuestion = question.trim();

    if (!userQuestion || aiLoading) return;

    setAiMessages((previous) => [
      ...previous,
      { role: "user", text: userQuestion }
    ]);

    setAiQuestion("");
    setAiLoading(true);

    try {
      const response = await fetch(`${API}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: userQuestion
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to get AI response"
        );
      }

      setAiMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer
        }
      ]);

    } catch (err) {
      setAiMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: err.message ||
            "Unable to connect to PayPilot backend."
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  // Transaction status calculations
  const completed = transactions.filter(
    (item) => item.status === "completed"
  );

  const pending = transactions.filter(
    (item) => item.status === "pending"
  );

  const failed = transactions.filter(
    (item) => item.status === "failed"
  );

  const totalVolume = completed.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  // Search functionality
  const filteredTransactions = transactions.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      (item.description || "").toLowerCase().includes(search) ||
      (item.category || "").toLowerCase().includes(search) ||
      (item.status || "").toLowerCase().includes(search) ||
      String(item.id).includes(search)
    );
  });

  // Last 7 days chart data
  const chartData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const key = date.toLocaleDateString("en-CA");

      const amount = completed
        .filter((item) => {
          if (!item.created_at) return false;

          const itemDate = new Date(item.created_at)
            .toLocaleDateString("en-CA");

          return itemDate === key;
        })
        .reduce((sum, item) => sum + Number(item.amount), 0);

      days.push({
        day: date.toLocaleDateString("en-US", {
          weekday: "short"
        }),
        amount
      });
    }

    return days;
  }, [transactions]);

  // PayPal Sandbox order creation
  async function createPaymentOrder(event) {
    event.preventDefault();

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      const response = await fetch(`${API}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payment,
          amount: Number(payment.amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to create payment"
        );
      }

      setPaymentMessage(
        "Order created. Continue with PayPal approval."
      );

      if (data.approval_url) {
        window.open(
          data.approval_url,
          "_blank",
          "noopener,noreferrer"
        );
      }

      await loadTransactions();

    } catch (err) {
      setPaymentMessage(err.message);
      await loadTransactions();
    } finally {
      setPaymentLoading(false);
    }
  }

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Transactions", icon: ArrowLeftRight },
    { name: "Payments", icon: CreditCard },
    { name: "AI Assistant", icon: Bot }
  ];

  function navigate(name) {
    setActivePage(name);
    setMobileMenu(false);

    if (name === "Payments") {
      setShowPayment(true);
    } else {
      setShowPayment(false);
    }
  }

  const currency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(Number(amount || 0));

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <Wallet size={23} />
          </div>

          <div>
            <h2>PayPilot<span> AI</span></h2>
            <small>FINANCE COPILOT</small>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>

              {name === "AI Assistant" && (
                <span className="new-tag">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="upgrade-card">
            <Sparkles size={20} />
            <strong>Smart finance</strong>
            <p>Your financial overview, all in one place.</p>
          </div>

          <button className="nav-item">
            <Settings size={19} /> Settings
          </button>

          <div className="profile">
            <div className="avatar">PP</div>

            <div>
              <strong>PayPilot User</strong>
              <small>Personal account</small>
            </div>
          </div>

        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="mobile-toggle"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="breadcrumb">
                Workspace / <span>{activePage}</span>
              </div>

              <h1>
                {activePage === "Overview"
                  ? "Dashboard overview"
                  : activePage}
              </h1>
            </div>

          </div>

          <div className="top-actions">

            <div className="search-box">
              <Search size={17} />

              <input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="icon-button"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="avatar top-avatar">PP</div>

          </div>
        </header>

        {/* AI Assistant */}
        {activePage === "AI Assistant" ? (

          <section className="assistant-panel">

            <div className="assistant-icon">
              <Bot size={34} />
            </div>

            <h2>Your PayPilot Finance Assistant</h2>

            <p>
              Ask questions about your finances and transactions.
            </p>

            <div className="coming-soon">
              <Sparkles size={18} />
              Database-connected Finance Assistant
            </div>

            {/* Suggested questions */}
            {aiMessages.length === 0 && (
              <div style={{ marginTop: "25px" }}>
                <p>Try asking:</p>

                {[
                  "Give me a financial summary",
                  "How many completed transactions do I have?",
                  "How many failed transactions?",
                  "What is my highest transaction?",
                  "Show my recent transactions"
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="secondary-button"
                    disabled={aiLoading}
                    onClick={() => askAI(question)}
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: "10px",
                      textAlign: "left"
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            <div
              aria-live="polite"
              style={{
                minHeight: "180px",
                maxHeight: "380px",
                overflowY: "auto",
                margin: "25px 0",
                textAlign: "left"
              }}
            >
              {aiMessages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      message.role === "user"
                        ? "flex-end"
                        : "flex-start",
                    marginBottom: "15px"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "14px 17px",
                      borderRadius: "12px",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      lineHeight: "1.6",
                      color: "#f4f4ff",
                      background:
                        message.role === "user"
                          ? "#6755d9"
                          : "#242b40"
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <p style={{ color: "#a99aff" }}>
                  PayPilot is analyzing your transactions...
                </p>
              )}
            </div>

            {/* Question input */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                askAI(aiQuestion);
              }}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(event) =>
                  setAiQuestion(event.target.value)
                }
                placeholder="Ask about your finances..."
                maxLength={500}
                disabled={aiLoading}
                style={{
                  flex: 1,
                  minWidth: 0
                }}
              />

              <button
                type="submit"
                className="primary-button"
                disabled={aiLoading || !aiQuestion.trim()}
              >
                {aiLoading ? "Asking..." : "Ask"}
              </button>
            </form>

            <p
              style={{
                color: "#77829d",
                fontSize: "12px",
                marginTop: "15px"
              }}
            >
              Answers are generated using your stored transaction
              data. This is a database-based rule-driven assistant.
            </p>

          </section>

        ) : (

          <>

            {/* Welcome section */}
            <section className="welcome-row">

              <div>
                <h2>Welcome back 👋</h2>
                <p>
                  Here is what's happening with your finances.
                </p>
              </div>

              <div className="welcome-actions">

                <button
                  className="secondary-button"
                  onClick={loadTransactions}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

                <button
                  className="primary-button"
                  onClick={() => setShowPayment(true)}
                >
                  <Plus size={17} />
                  Create payment
                </button>

              </div>
            </section>

            {error && (
              <div className="error-banner">{error}</div>
            )}

            {/* Dashboard statistics */}
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-top">
                  <span>Total completed volume</span>
                  <div className="stat-icon purple">
                    <Wallet size={19} />
                  </div>
                </div>

                <h2>{currency(totalVolume)}</h2>

                <div className="stat-note">
                  <TrendingUp size={14} />
                  From completed records
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Completed payments</span>
                  <div className="stat-icon green">
                    <CheckCircle2 size={19} />
                  </div>
                </div>

                <h2>{completed.length}</h2>

                <div className="stat-note">
                  Verified status not implied for manual records
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Pending payments</span>
                  <div className="stat-icon orange">
                    <Clock3 size={19} />
                  </div>
                </div>

                <h2>{pending.length}</h2>

                <div className="stat-note">
                  Awaiting payment completion
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Failed payments</span>
                  <div className="stat-icon red">
                    <XCircle size={19} />
                  </div>
                </div>

                <h2>{failed.length}</h2>

                <div className="stat-note">
                  Requires attention
                </div>
              </div>

            </section>

            {/* Charts and summary */}
            <section className="dashboard-grid">

              <div className="panel chart-panel">

                <div className="panel-heading">

                  <div>
                    <h3>Payment activity</h3>
                    <p>
                      Completed transaction volume · Last 7 days
                    </p>
                  </div>

                  <span className="period-label">7 days</span>

                </div>

                <div className="chart-area">

                  <ResponsiveContainer width="100%" height="100%">

                    <AreaChart data={chartData}>

                      <defs>
                        <linearGradient
                          id="volumeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8b7cff"
                            stopOpacity={0.35}
                          />

                          <stop
                            offset="95%"
                            stopColor="#8b7cff"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#252a3b"
                        strokeDasharray="4 4"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        stroke="#777f96"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#777f96"
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#171c2b",
                          border: "1px solid #343b52",
                          borderRadius: 10
                        }}
                        formatter={(value) => [
                          currency(value),
                          "Volume"
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#9b8cff"
                        strokeWidth={3}
                        fill="url(#volumeGradient)"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>
              </div>

              <div className="panel breakdown-panel">

                <div className="panel-heading">
                  <div>
                    <h3>Payment summary</h3>
                    <p>Current database records</p>
                  </div>
                </div>

                <div className="summary-row">
                  <span>
                    <i className="dot green-dot" />
                    Completed
                  </span>
                  <strong>{completed.length}</strong>
                </div>

                <div className="summary-row">
                  <span>
                    <i className="dot orange-dot" />
                    Pending
                  </span>
                  <strong>{pending.length}</strong>
                </div>

                <div className="summary-row">
                  <span>
                    <i className="dot red-dot" />
                    Failed
                  </span>
                  <strong>{failed.length}</strong>
                </div>

                <div className="summary-total">
                  <span>Total records</span>
                  <strong>{transactions.length}</strong>
                </div>

                <div className="summary-footnote">
                  Amounts shown in USD-equivalent display.
                  Mixed currencies should be separated before
                  financial reporting.
                </div>

              </div>
            </section>

            {/* Transactions table */}
            <section className="panel transactions-panel">

              <div className="panel-heading">

                <div>
                  <h3>
                    {activePage === "Transactions"
                      ? "All transactions"
                      : "Recent transactions"}
                  </h3>

                  <p>
                    {searchTerm
                      ? `Search results for "${searchTerm}"`
                      : "Your latest payment activity from the backend"}
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigate("Transactions")}
                >
                  View all <ArrowUpRight size={15} />
                </button>

              </div>

              {loading ? (

                <div className="empty-state">
                  Loading transactions...
                </div>

              ) : filteredTransactions.length === 0 ? (

                <div className="empty-state">
                  {searchTerm
                    ? "No matching transactions found."
                    : "No transactions yet. Create your first payment."}
                </div>

              ) : (

                <div className="table-scroll">

                  <table>

                    <thead>
                      <tr>
                        <th>DESCRIPTION</th>
                        <th>CATEGORY</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>

                    <tbody>

                      {(activePage === "Transactions"
                        ? filteredTransactions
                        : filteredTransactions.slice(0, 8)
                      ).map((item) => (

                        <tr key={item.id}>

                          <td>
                            <div className="transaction-name">

                              <div className="transaction-symbol">
                                <CreditCard size={17} />
                              </div>

                              <div>
                                <strong>{item.description}</strong>
                                <small>
                                  Transaction #{item.id}
                                </small>
                              </div>

                            </div>
                          </td>

                          <td>
                            {item.category || "Uncategorized"}
                          </td>

                          <td className="amount-cell">
                            {currency(item.amount)}
                            {" "}
                            <small>{item.currency}</small>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${item.status}`}
                            >
                              {item.status}
                            </span>
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            {activePage === "Transactions" && (
              <div className="info-banner">
                Showing transactions from your backend database.
              </div>
            )}

          </>

        )}

      </main>

      {/* Payment modal */}
      {showPayment && (

        <div
          className="modal-backdrop"
          onClick={() => setShowPayment(false)}
        >

          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="modal-heading">

              <div>
                <h2>Create a payment</h2>
                <p>Start a PayPal Sandbox order</p>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowPayment(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={createPaymentOrder}>

              <label>Description</label>

              <input
                required
                maxLength="200"
                placeholder="e.g. Client invoice payment"
                value={payment.description}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    description: e.target.value
                  })
                }
              />

              <label>Amount</label>

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="10.00"
                value={payment.amount}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    amount: e.target.value
                  })
                }
              />

              <label>Currency</label>

              <select
                value={payment.currency}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    currency: e.target.value
                  })
                }
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — Pound Sterling</option>
              </select>

              <label>Category</label>

              <input
                value={payment.category}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    category: e.target.value
                  })
                }
              />

              <button
                className="primary-button submit-payment"
                disabled={paymentLoading}
              >
                {paymentLoading
                  ? "Creating..."
                  : "Create PayPal order"}
              </button>

            </form>

            {paymentMessage && (
              <div className="payment-message">
                {paymentMessage}
              </div>
            )}

            <p className="modal-note">
              Sandbox credentials are required to create a real
              PayPal order. No real payment is processed here.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
