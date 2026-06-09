"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const LOGO_WHITE = "https://lottie.host/7e9f0f76-045f-4084-9d34-b576660d1848/vgHf4GtXbQ.png";
const LOGO_BLUE  = "https://lottie.host/30ce7548-9cdd-4e66-a656-6f3ffc24ea1f/7Qw5Z1Ef6B.png";

const NAV = [
  { href:"/dashboard",      icon:"home",            label:"Dashboard"     },
  { href:"/upi-capture",    icon:"phone_iphone",    label:"UPI Capture"   },
  { href:"/journal-entry",  icon:"edit_note",       label:"New Entry"     },
  { href:"/transactions",   icon:"receipt_long",    label:"Transactions"  },
  { href:"/accounts",       icon:"account_tree",    label:"Accounts"      },
  { href:"/trial-balance",  icon:"balance",         label:"Trial Balance" },
  { href:"/pl-statement",   icon:"trending_up",     label:"P&L"           },
  { href:"/balance-sheet",  icon:"account_balance", label:"Balance Sheet" },
  { href:"/notes",          icon:"description",     label:"Notes"         },
  { href:"/settings",       icon:"settings",        label:"Settings"      },
];

const BOTTOM_NAV = [
  { href:"/dashboard",    icon:"home",         label:"Home"    },
  { href:"/transactions", icon:"menu_book",    label:"Ledger"  },
  { href:"/upi-capture",  icon:"phone_iphone", label:"UPI"     },
  { href:"/pl-statement", icon:"assessment",   label:"Reports" },
  { href:"/settings",     icon:"person",       label:"Profile" },
];

const NAV_GROUPS = [
  { label:"OVERVIEW",   items: NAV.slice(0,1) },
  { label:"CAPTURE",    items: NAV.slice(1,3) },
  { label:"ACCOUNTING", items: NAV.slice(3,5) },
  { label:"REPORTS",    items: NAV.slice(5,9) },
  { label:"SETTINGS",   items: NAV.slice(9)   },
];

interface AppUser { name: string; company: string | null; initials: string; }

function Icon({ name, filled=false, size=20 }: { name:string; filled?:boolean; size?:number }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", fontSize: size, lineHeight:1 }}>
      {name}
    </span>
  );
}

function SidebarContent({
  user, path, active, logout, onNavigate,
}: {
  user: AppUser | null;
  path: string | null;
  active: (href: string) => boolean;
  logout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex-shrink-0">
        <img src={LOGO_WHITE} alt="31st File" style={{ width: 148 }} />
        <p style={{
          fontSize: 9, letterSpacing: "2px", color: "rgba(137,165,221,0.6)",
          marginTop: 6, fontWeight: 700, textTransform: "uppercase",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}>
          31ST FILE ERP
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p style={{
              fontSize: 9, letterSpacing: "1.8px", color: "rgba(137,165,221,0.45)",
              fontWeight: 700, textTransform: "uppercase",
              padding: "14px 10px 4px",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>
              {label}
            </p>
            {items.map(item => {
              const isActive = active(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 12,
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    borderLeft: isActive ? "3px solid #00696d" : "3px solid transparent",
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }
                  }}
                >
                  <Icon name={item.icon} filled={isActive} size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {(item.href === "/upi-capture" || item.href === "/journal-entry") && (
                    <span style={{
                      fontSize: 9, background: "#00696d", color: "white",
                      padding: "2px 7px", borderRadius: 9999, fontWeight: 700,
                      letterSpacing: "0.5px",
                    }}>
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User strip */}
      <div className="flex-shrink-0 mx-3 mb-4 mt-2 p-3 rounded-xl"
        style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#00696d", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 13, fontWeight: 700,
          }}>
            {user?.initials ?? "…"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.name ?? "Loading…"}
            </p>
            <p style={{
              fontSize: 11, color: "rgba(137,165,221,0.65)", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.company ?? ""}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 6,
              borderRadius: 8, color: "rgba(137,165,221,0.7)", transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(137,165,221,0.7)")}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path   = usePathname();
  const router = useRouter();
  const [user, setUser]         = useState<AppUser | null>(null);
  const [drawerOpen, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then((u: { name: string; company: string | null } | null) => {
        if (!u) { router.push("/login"); return; }
        const initials = u.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        setUser({ name: u.name, company: u.company, initials });
      });
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawer(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => { setDrawer(false); }, [path]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const active = (href: string) =>
    path == null ? false : href === "/dashboard" ? path === href : path.startsWith(href);

  return (
    <div className="flex min-h-screen">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40"
        style={{ width: 264, background: "#1b3a6b", boxShadow: "4px 0 24px rgba(0,36,82,0.15)" }}
      >
        <SidebarContent user={user} path={path} active={active} logout={logout} />
      </aside>

      {/* ── MOBILE TOPBAR ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 glass-topbar flex items-center justify-between px-4"
        style={{ height: 60 }}
      >
        <button
          onClick={() => setDrawer(true)}
          className="p-2 rounded-xl transition-all active:scale-90"
          style={{ color: "#1b3a6b" }}
          aria-label="Open menu"
        >
          <Icon name="menu" size={24} />
        </button>
        <img src={LOGO_BLUE} alt="31st File" style={{ width: 88 }} />
        <button
          onClick={logout}
          className="p-2 rounded-xl transition-all active:scale-90"
          style={{ color: "#1b3a6b" }}
          aria-label="Sign out"
        >
          <Icon name="logout" size={22} />
        </button>
      </header>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            ref={drawerRef}
            className="flex flex-col h-full"
            style={{
              width: 280, background: "#1b3a6b",
              boxShadow: "8px 0 40px rgba(0,0,0,0.35)",
              animation: "slideInLeft 0.22s ease",
            }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <img src={LOGO_WHITE} alt="31st File" style={{ width: 120 }} />
              <button
                onClick={() => setDrawer(false)}
                style={{
                  background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                  padding: 6, borderRadius: 8, color: "rgba(255,255,255,0.7)",
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <SidebarContent
              user={user} path={path} active={active} logout={logout}
              onNavigate={() => setDrawer(false)}
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-[264px] pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen">
        {/* Desktop sticky topbar */}
        <div
          className="hidden md:flex sticky top-0 z-30 glass-topbar items-center justify-between px-8"
          style={{ height: 60 }}
        >
          <div />
          <div className="flex items-center gap-3">
            <span className="chip-success">FY 2025-26</span>
            <Link href="/journal-entry" className="btn-primary text-[13px] px-4 py-2">
              <Icon name="add" size={16} /> New Entry
            </Link>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%", background: "#1b3a6b",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
              title={user?.name ?? ""}
            >
              {user?.initials ?? "…"}
            </div>
          </div>
        </div>

        {/* Page */}
        <div className="px-4 md:px-8 py-6 max-w-2xl md:max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center rounded-t-2xl"
        style={{
          height: 64, background: "rgba(249,249,255,0.94)",
          backdropFilter: "blur(20px)", boxShadow: "0 -4px 24px rgba(27,58,107,0.10)",
        }}
      >
        {BOTTOM_NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center w-14 active:scale-90 transition-all"
            style={{ color: active(item.href) ? "#00696d" : "#747780" }}
          >
            <Icon name={item.icon} filled={active(item.href)} size={22} />
            <span style={{
              fontSize: 10, fontWeight: 700, marginTop: 2,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              color: active(item.href) ? "#00696d" : "#747780",
            }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
