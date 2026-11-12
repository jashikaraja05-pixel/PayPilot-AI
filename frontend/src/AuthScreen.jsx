import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "./firebase";

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No account found. Please register.",
        "auth/wrong-password": "Incorrect password."
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "14px",
    marginTop: "8px",
    border: "1px solid #334155",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box"
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg,#07111f,#101d35)",
      color: "#fff",
      fontFamily: "Inter,Arial,sans-serif",
      padding: "20px"
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: "420px",
        padding: "36px",
        border: "1px solid #26364f",
        borderRadius: "20px",
        background: "#111e32",
        boxSizing: "border-box",
        boxShadow: "0 25px 70px #0008"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "34px", fontWeight: 800 }}>
            PayPilot <span style={{ color: "#38bdf8" }}>AI</span>
          </div>
          <p style={{ color: "#94a3b8" }}>
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <label>Email address</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={{ display: "block", marginTop: "18px" }}>
          Password
        </label>
        <input
          style={inputStyle}
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && (
          <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "24px",
            border: 0,
            borderRadius: "10px",
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            cursor: loading ? "wait" : "pointer"
          }}
        >
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
        </button>

        <p style={{
          textAlign: "center",
          color: "#94a3b8",
          marginTop: "22px",
          fontSize: "14px"
        }}>
          {isRegister ? "Already have an account?" : "New to PayPilot?"}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            style={{
              background: "none",
              border: 0,
              color: "#38bdf8",
              cursor: "pointer",
              marginLeft: "6px",
              fontWeight: 700
            }}
          >
            {isRegister ? "Sign In" : "Create account"}
          </button>
        </p>
      </form>
    </div>
  );
}
