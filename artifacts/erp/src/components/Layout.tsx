import { useLocation, Link } from "wouter";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

function Icon({ name, size = 22, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const NAV_ITEMS = [
  { path: "/dashboard",     icon: "home",           label: "Dashboard" },
  { path: "/accounts",      icon: "account_tree",   label: "Accounts" },
  { path: "/vendors",       icon: "group",          label: "Vendors" },
  { path: "/transactions",  icon: "receipt_long",   label: "Transactions" },
  { path: "/journal-entry", icon: "edit_note",      label: "New Entry" },
  { path: "/upi-capture",   icon: "phone_iphone",   label: "UPI Capture" },
  { path: "/import",        icon: "upload_file",    label: "Import CSV" },
  { path: "/trial-balance", icon: "balance",        label: "Trial Balance" },
  { path: "/pl-statement",  icon: "trending_up",    label: "P&L" },
  { path: "/balance-sheet", icon: "account_balance",label: "Balance Sheet" },
  { path: "/masters",       icon: "library_books",  label: "Masters" },
  { path: "/gst-returns",   icon: "receipt_long",   label: "GST Returns" },
  { path: "/tds-returns",   icon: "assignment",     label: "TDS Returns" },
  { path: "/notes",         icon: "description",    label: "Notes" },
  { path: "/settings",      icon: "settings",       label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-body)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: "var(--bg-sidebar)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        transform: mobileOpen ? "translateX(0)" : undefined,
        transition: "transform 0.25s, background 0.3s",
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid var(--bg-sidebar-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={isDark ? "/white-logo.png" : "/blue-logo.png"}
              alt="31st File"
              style={{ width: 140, height: "auto", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <a style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, marginBottom: 2,
                  background: active ? "var(--bg-sidebar-nav)" : "transparent",
                  color: active ? "white" : "var(--bg-sidebar-nav-inactive)",
                  textDecoration: "none", transition: "all 0.15s",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: active ? 700 : 500,
                  borderLeft: active ? "3px solid var(--bg-sidebar-nav-border)" : "3px solid transparent",
                }}>
                  <Icon name={item.icon} size={19} color={active ? "white" : "var(--bg-sidebar-nav-inactive)"} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div style={{ padding: "12px 10px 20px", borderTop: "1px solid var(--bg-sidebar-border)" }}>
          <button onClick={toggle} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "var(--bg-sidebar-nav-inactive)",
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13,
            marginBottom: 2,
          }}>
            <Icon name={isDark ? "light_mode" : "dark_mode"} size={19} color="var(--bg-sidebar-nav-inactive)" />
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "var(--bg-sidebar-nav-inactive)",
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13,
          }}>
            <Icon name="logout" size={19} color="var(--bg-sidebar-nav-inactive)" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }} className="main-content">
        {/* Mobile top bar */}
        <div style={{
          display: "none", padding: "12px 16px", background: "var(--bg-sidebar-top)",
          alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50,
        }} className="mobile-topbar">
          <button onClick={() => setMobileOpen(true)} style={{
            padding: 6, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", cursor: "pointer"
          }}>
            <Icon name="menu" size={22} color="white" />
          </button>
          <img
            src={isDark ? "/white-logo.png" : "/blue-logo.png"}
            alt="31st File"
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
          <button onClick={toggle} style={{
            padding: 6, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", cursor: "pointer", marginLeft: "auto"
          }}>
            <Icon name={isDark ? "light_mode" : "dark_mode"} size={20} color="white" />
          </button>
        </div>

        <div style={{ padding: "28px 28px 40px" }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(-100%); }
          .main-content { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
