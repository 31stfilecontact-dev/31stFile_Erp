"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LOGO_BLUE = "https://lottie.host/30ce7548-9cdd-4e66-a656-6f3ffc24ea1f/7Qw5Z1Ef6B.png";
const ICON_SQ   = "https://lottie.host/5946a287-9a8e-40b9-bae6-e948b9e33e8f/kbYxf8zkUw.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, background:"linear-gradient(135deg,#002452 0%,#1b3a6b 50%,#00696d 100%)",
      backgroundSize:"200% 200%", animation:"gshift 12s ease infinite",
    }}>
      <div style={{
        width:"100%", maxWidth:420,
        background:"rgba(255,255,255,0.93)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        border:"1px solid rgba(255,255,255,0.90)",
        borderRadius:24, padding:40,
        boxShadow:"0 16px 64px rgba(0,36,82,0.22)",
      }}>
        {/* Icon + title */}
        <div style={{textAlign:"center", marginBottom:32}}>
          <img src={ICON_SQ} alt="31st File" style={{width:56, height:56, margin:"0 auto 16px"}}/>
          <h1 style={{fontSize:24, fontWeight:800, color:"#131c2a",
            fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0}}>31st File</h1>
          <p style={{fontSize:13, color:"#747780", marginTop:6,
            fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Simple. Accurate. Always audit-ready.</p>
        </div>

        {error && (
          <div style={{marginBottom:16, padding:"10px 14px", borderRadius:10,
            background:"rgba(255,218,214,0.7)", borderLeft:"4px solid #ba1a1a",
            fontSize:13, color:"#ba1a1a", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{display:"flex", flexDirection:"column", gap:16}}>
          <div>
            <label style={{display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.05em",
              textTransform:"uppercase", color:"#44474f", marginBottom:6,
              fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Work Email</label>
            <input type="email" required className="input-field"
              placeholder="you@company.com"
              value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>

          <div>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
              <label style={{fontSize:11, fontWeight:700, letterSpacing:"0.05em",
                textTransform:"uppercase", color:"#44474f",
                fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Password</label>
            </div>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} required className="input-field"
                style={{paddingRight:44}} placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)}/>
              <button type="button" onClick={()=>setShowPass(!showPass)}
                style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", color:"#747780", padding:0}}>
                <span className="material-symbols-outlined" style={{fontSize:20}}>
                  {showPass?"visibility_off":"visibility"}
                </span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{height:48, borderRadius:9999, background:"#00696d", color:"white",
              border:"none", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center",
              justifyContent:"center", gap:8, marginTop:4,
              boxShadow:"0 4px 16px rgba(0,105,109,0.30)", opacity:loading?0.8:1,
              transition:"all 0.2s"}}>
            {loading ? (
              <><span className="material-symbols-outlined" style={{fontSize:20,animation:"spin 1s linear infinite"}}>autorenew</span> Signing in...</>
            ) : "Sign In"}
          </button>
        </form>

        <p style={{textAlign:"center", fontSize:11, color:"#747780", marginTop:24,
          fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          🔒 256-bit encryption · Data stored in India · No data sold
        </p>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
