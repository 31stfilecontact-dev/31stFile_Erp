"use client";
import { useEffect, useState } from "react";
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
  { href:"/dashboard",    icon:"home",        label:"Home"    },
  { href:"/transactions", icon:"menu_book",   label:"Ledger"  },
  { href:"/upi-capture",  icon:"phone_iphone",label:"UPI"     },
  { href:"/pl-statement", icon:"assessment",  label:"Reports" },
  { href:"/settings",     icon:"person",      label:"Profile" },
];

interface AppUser { name: string; company: string | null; initials: string; }

function Icon({ name, filled=false, size=20 }: { name:string; filled?:boolean; size?:number }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontVariationSettings: filled?"'FILL' 1":"'FILL' 0", fontSize: size, lineHeight:1 }}>
      {name}
    </span>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path   = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then((u: { name: string; company: string | null } | null) => {
        if (!u) { router.push("/login"); return; }
        const initials = u.name.split(" ").map((w:string) => w[0]).join("").slice(0, 2).toUpperCase();
        setUser({ name: u.name, company: u.company, initials });
      });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const active = (href: string) =>
    path == null ? false : href === "/dashboard" ? path === href : path.startsWith(href);

  return (
    <div className="flex min-h-screen">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 py-6"
        style={{ width:280, background:"#1b3a6b", boxShadow:"4px 0 24px rgba(0,36,82,0.15)" }}>
        {/* Logo */}
        <div className="px-6 mb-6">
          <img src={LOGO_WHITE} alt="31st File" style={{ width:148 }} />
          <p style={{ fontSize:9, letterSpacing:"2px", color:"rgba(137,165,221,0.6)", marginTop:6,
            fontWeight:700, textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            31ST FILE ERP
          </p>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {[
            { label:"OVERVIEW",   items: NAV.slice(0,1) },
            { label:"CAPTURE",    items: NAV.slice(1,3) },
            { label:"ACCOUNTING", items: NAV.slice(3,5) },
            { label:"REPORTS",    items: NAV.slice(5,9) },
            { label:"SETTINGS",   items: NAV.slice(9)   },
          ].map(({ label, items }) => (
            <div key={label}>
              <p style={{ fontSize:9, letterSpacing:"1.8px", color:"rgba(137,165,221,0.5)",
                fontWeight:700, textTransform:"uppercase", padding:"14px 12px 4px",
                fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {label}
              </p>
              {items.map(item => (
                <Link key={item.href} href={item.href}
                  className={active(item.href) ? "nav-item-active" : "nav-item"}>
                  <Icon name={item.icon} filled={active(item.href)} size={20} />
                  <span style={{ fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontWeight: active(item.href) ? 600 : 500 }}>
                    {item.label}
                  </span>
                  {(item.href === "/upi-capture" || item.href === "/journal-entry") && (
                    <span style={{ marginLeft:"auto", fontSize:9, background:"#00696d",
                      color:"white", padding:"1px 6px", borderRadius:9999, fontWeight:700 }}>
                      NEW
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User strip */}
        <div className="px-4 pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.10)" }}>
          <div className="flex items-center gap-3">
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#00696d", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontSize:13, fontWeight:700 }}>
              {user?.initials ?? "…"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#fff", lineHeight:1.2,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.name ?? "Loading…"}
              </p>
              <p style={{ fontSize:11, color:"rgba(137,165,221,0.65)", marginTop:2,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.company ?? ""}
              </p>
            </div>
            <button onClick={logout} title="Sign out"
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:8,
                color:"rgba(137,165,221,0.7)", transition:"all 0.15s", flexShrink:0 }}
              onMouseEnter={e=>(e.currentTarget.style.color="white")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(137,165,221,0.7)")}>
              <Icon name="logout" size={18}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOPBAR ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-topbar flex items-center justify-between px-4"
        style={{ height:64 }}>
        <button className="p-2 rounded-full hover:bg-primary/5 active:scale-95 transition-all">
          <Icon name="menu" size={24} />
        </button>
        <img src={LOGO_BLUE} alt="31st File" style={{ width:96 }} />
        <button onClick={logout} className="p-2 rounded-full hover:bg-primary/5 active:scale-95 transition-all">
          <Icon name="logout" size={22} />
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-[280px] pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {/* Desktop sticky topbar */}
        <div className="hidden md:flex sticky top-0 z-30 glass-topbar items-center justify-between px-8"
          style={{ height:64 }}>
          <div />
          <div className="flex items-center gap-3">
            <span className="chip-success">FY 2025-26</span>
            <Link href="/journal-entry" className="btn-primary text-[13px] px-4 py-2">
              <Icon name="add" size={16} /> New Entry
            </Link>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#1b3a6b",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}
              title={user?.name ?? ""}>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center rounded-t-2xl"
        style={{ height:64, background:"rgba(249,249,255,0.92)", backdropFilter:"blur(20px)",
          boxShadow:"0 -4px 24px rgba(27,58,107,0.10)" }}>
        {BOTTOM_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center justify-center w-14 active:scale-90 transition-all"
            style={{ color: active(item.href) ? "#00696d" : "#747780" }}>
            <Icon name={item.icon} filled={active(item.href)} size={22} />
            <span style={{ fontSize:10, fontWeight:700, marginTop:2,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              color: active(item.href) ? "#00696d" : "#747780" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
