import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { theme, toggle } = useTheme();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const isDark = theme === "dark";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      setLocation("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #002452 0%, #00696d 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      {/* Dark mode toggle */}
      <button onClick={toggle} style={{
        position: "absolute", top: 20, right: 20,
        padding: 8, borderRadius: 10, border: "none", cursor: "pointer",
        background: "rgba(255,255,255,0.15)", color: "white",
      }}>
        <Icon name={isDark ? "light_mode" : "dark_mode"} size={20} color="white" />
      </button>

      <div style={{
        background: isDark ? "rgba(22,28,42,0.95)" : "white", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 420,
        boxShadow: isDark
          ? "0 24px 60px rgba(0,0,0,0.4)"
          : "0 24px 60px rgba(0,36,82,0.28)",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={"/blue-logo.png"}
            alt="31st File"
            style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 14 }}
          />
          <p style={{ fontSize: 13, color: isDark ? "#8b8f9e" : "#747780", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, background: isDark ? "rgba(186,26,26,0.15)" : "rgba(255,218,214,0.7)",
            borderLeft: "4px solid #ba1a1a", display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
          }}>
            <Icon name="error" size={16} color="#ba1a1a" />
            <p style={{ fontSize: 13, color: "#ba1a1a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#a0a4b2" : "#44474f", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required autoComplete="email"
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1.5px solid var(--input-border)", borderRadius: 10, fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", color: "var(--text-body)", background: "var(--bg-input)" }}
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#a0a4b2" : "#44474f", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} required autoComplete="current-password"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 44px 11px 14px", border: "1.5px solid var(--input-border)", borderRadius: 10, fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", color: "var(--text-body)", background: "var(--bg-input)" }}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                <Icon name={showPw ? "visibility_off" : "visibility"} size={18} color="var(--text-muted)" />
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            padding: "13px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#002452,#00696d)", color: "white",
            fontSize: 15, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.8 : 1, transition: "opacity 0.15s",
          }}>
            {loading ? <><Icon name="autorenew" size={18} color="white" /> Signing in…</> : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 24, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Contact your administrator for access
        </p>
      </div>
    </div>
  );
}
