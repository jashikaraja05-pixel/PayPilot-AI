import { useEffect, useMemo, useState } from "react";
import { updateProfile, signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  User, Settings, Bell, Moon, Sun, Save, LogOut,
  X, Check, Trash2, Shield, Globe, DollarSign
} from "lucide-react";

const defaults = {
  name: "",
  phone: "",
  currency: "USD",
  language: "English",
  theme: "dark",
  emailAlerts: true,
  paymentAlerts: true,
  failedAlerts: true
};

export default function AccountPanel({ activePanel, setActivePanel, user, transactions = [] }) {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [readIds, setReadIds] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("paypilot_preferences") || "{}");
      setSettings({ ...defaults, ...stored, name: stored.name || user?.displayName || "" });
      setReadIds(JSON.parse(localStorage.getItem("paypilot_read_notifications") || "[]"));
    } catch {
      setSettings({ ...defaults, name: user?.displayName || "" });
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.paypilotTheme = settings.theme;
    document.body.style.background = settings.theme === "light" ? "#f1f5f9" : "#0b1020";
    return () => {
      document.documentElement.dataset.paypilotTheme = "";
      document.body.style.background = "";
    };
  }, [settings.theme]);

  const notifications = useMemo(() => {
    return transactions
      .filter(t => ["failed", "pending"].includes(String(t.status || "").toLowerCase()))
      .map(t => ({
        id: String(t.id),
        title: String(t.status).toLowerCase() === "failed" ? "Failed transaction" : "Pending transaction",
        detail: `${t.description || "Transaction"} · ${t.amount ?? ""} ${t.currency || ""}`,
        status: String(t.status).toLowerCase()
      }));
  }, [transactions]);

  const unread = notifications.filter(n => !readIds.includes(n.id)).length;

  function change(key, value) {
    setSettings(previous => ({ ...previous, [key]: value }));
    setSaved(false);
    setMessage("");
  }

  async function save() {
    try {
      localStorage.setItem("paypilot_preferences", JSON.stringify(settings));
      if (user && settings.name.trim() && settings.name !== user.displayName) {
        await updateProfile(user, { displayName: settings.name.trim() });
      }
      setSaved(true);
      setMessage("Your preferences have been saved.");
    } catch (error) {
      setMessage(error.message || "Could not save profile.");
    }
  }

  function markRead(id) {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    localStorage.setItem("paypilot_read_notifications", JSON.stringify(next));
  }

  function clearNotifications() {
    const next = notifications.map(n => n.id);
    setReadIds(previous => [...new Set([...previous, ...next])]);
    localStorage.setItem("paypilot_read_notifications", JSON.stringify([...new Set([...readIds, ...next])]));
  }

  if (!activePanel) return null;

  const panelStyle = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(2,6,23,.72)", display: "flex",
    justifyContent: "flex-end", fontFamily: "Arial,sans-serif"
  };
  const cardStyle = {
    width: "min(480px,100%)", height: "100%", overflowY: "auto",
    background: settings.theme === "light" ? "#fff" : "#111827",
    color: settings.theme === "light" ? "#172033" : "#f8fafc",
    padding: "25px", boxSizing: "border-box",
    boxShadow: "-15px 0 50px #0005"
  };
  const fieldStyle = {
    width: "100%", padding: "12px", borderRadius: "9px",
    border: "1px solid #64748b55", marginTop: "7px",
    background: settings.theme === "light" ? "#f8fafc" : "#1e293b",
    color: "inherit", boxSizing: "border-box"
  };
  const buttonStyle = {
    padding: "11px 14px", borderRadius: "9px", border: 0,
    background: "#0284c7", color: "white", cursor: "pointer",
    fontWeight: 600
  };
  const muted = { color: settings.theme === "light" ? "#64748b" : "#94a3b8" };

  function heading(title, description) {
    return <div style={{ margin: "22px 0 14px" }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ ...muted, fontSize: 13, marginTop: 5 }}>{description}</p>
    </div>;
  }

  function field(label, key, type = "text") {
    return <label style={{ display: "block", marginBottom: 15, fontSize: 13 }}>
      {label}
      <input style={fieldStyle} type={type} value={settings[key]}
        onChange={e => change(key, e.target.value)} />
    </label>;
  }

  function toggle(label, key) {
    return <label style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "13px 0",
      borderBottom: "1px solid #64748b33", cursor: "pointer"
    }}>
      <span>{label}</span>
      <input type="checkbox" checked={!!settings[key]}
        onChange={e => change(key, e.target.checked)} />
    </label>;
  }

  return (
    <div style={panelStyle} onMouseDown={e => {
      if (e.target === e.currentTarget) setActivePanel(null);
    }}>
      <section style={cardStyle}>
        <header style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: "1px solid #64748b44",
          paddingBottom: 16
        }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {activePanel === "settings" ? "Settings" :
               activePanel === "profile" ? "My Profile" : "Notifications"}
            </h2>
            <small style={muted}>Manage your PayPilot AI account</small>
          </div>
          <button onClick={() => setActivePanel(null)} style={{
            ...buttonStyle, background: "transparent", color: "inherit"
          }}><X size={21}/></button>
        </header>

        {activePanel === "settings" && <>
          {heading("Preferences", "Customize your application experience")}
          <label style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
            Currency
            <select style={fieldStyle} value={settings.currency}
              onChange={e => change("currency", e.target.value)}>
              <option value="USD">USD – US Dollar</option>
              <option value="INR">INR – Indian Rupee</option>
              <option value="EUR">EUR – Euro</option>
              <option value="GBP">GBP – British Pound</option>
            </select>
          </label>
          <label style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
            Language
            <select style={fieldStyle} value={settings.language}
              onChange={e => change("language", e.target.value)}>
              <option>English</option>
              <option>Tamil</option>
              <option>Hindi</option>
            </select>
          </label>
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 13 }}>Appearance</span>
            <div style={{ display: "flex", gap: 10, marginTop: 9 }}>
              <button style={{ ...buttonStyle, background: settings.theme === "dark" ? "#0284c7" : "#334155" }}
                onClick={() => change("theme", "dark")}><Moon size={15}/> Dark</button>
              <button style={{ ...buttonStyle, background: settings.theme === "light" ? "#0284c7" : "#334155" }}
                onClick={() => change("theme", "light")}><Sun size={15}/> Light</button>
            </div>
          </div>
          {heading("Notification Preferences", "Choose which alerts you want to receive")}
          {toggle("Email notifications", "emailAlerts")}
          {toggle("Payment notifications", "paymentAlerts")}
          {toggle("Failed payment alerts", "failedAlerts")}
          {heading("Security", "Your account authentication")}
          <p style={muted}>Signed in as {user?.email || "Unknown user"}</p>
          <p style={{ fontSize: 13, ...muted }}>Authentication is managed by Firebase.</p>
          <button style={{ ...buttonStyle, background: "#dc2626" }}
            onClick={() => signOut(auth)}><LogOut size={15}/> Sign out</button>
        </>}

        {activePanel === "profile" && <>
          {heading("Personal Information", "Update your account display information")}
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: "#0284c7", color: "white", display: "grid",
              placeItems: "center", fontSize: 28, fontWeight: 700, margin: "auto"
            }}>{(settings.name || user?.email || "P").slice(0, 1).toUpperCase()}</div>
          </div>
          {field("Full name", "name")}
          <label style={{ display: "block", marginBottom: 15, fontSize: 13 }}>
            Email address
            <input style={{ ...fieldStyle, opacity: .7 }} value={user?.email || ""} readOnly />
          </label>
          {field("Phone number", "phone", "tel")}
          <p style={{ ...muted, fontSize: 12 }}>Email changes and password reset are managed through Firebase account flows.</p>
        </>}

        {activePanel === "notifications" && <>
          {heading("Recent Transaction Alerts", `${unread} unread · Based on your loaded transaction records`)}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 15 }}>
            <button onClick={clearNotifications} style={{ ...buttonStyle, background: "#475569" }}>
              <Check size={15}/> Mark all read
            </button>
          </div>
          {notifications.length === 0 ?
            <p style={muted}>No failed or pending transactions in the currently loaded records.</p> :
            notifications.map(n => <article key={n.id} style={{
              padding: 15, marginBottom: 12, borderRadius: 12,
              border: "1px solid #64748b55",
              background: readIds.includes(n.id) ? "transparent" : "#0284c71a"
            }}>
              <strong style={{ color: n.status === "failed" ? "#f87171" : "#fbbf24" }}>{n.title}</strong>
              <p style={{ ...muted, fontSize: 13 }}>{n.detail}</p>
              {!readIds.includes(n.id) ?
                <button onClick={() => markRead(n.id)} style={{ ...buttonStyle, padding: "7px 10px" }}>Mark as read</button> :
                <small style={muted}>Read</small>}
            </article>)}
        </>}

        {message && <p style={{ color: saved ? "#22c55e" : "#f87171", fontSize: 13 }}>{message}</p>}

        {activePanel !== "notifications" && <button onClick={save}
          style={{ ...buttonStyle, width: "100%", marginTop: 20 }}>
          <Save size={16}/> {saved ? "Saved" : "Save Changes"}
        </button>}
      </section>
    </div>
  );
}
