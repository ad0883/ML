import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";
import LiquidEther from "../components/LiquidEther";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const fd = new URLSearchParams();
      fd.append("username", email);
      fd.append("password", password);
      const resp = await fetch("http://127.0.0.1:8000/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: fd });
      if (!resp.ok) throw new Error("Invalid email or password");
      const data = await resp.json();
      if (remember) localStorage.setItem("rememberedEmail", email); else localStorage.removeItem("rememberedEmail");
      login(data.access_token, { email });
      navigate('/landing', { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally { setLoading(false); }
  };

  const disabled = loading || !email || !password;

  return (
    <div style={{ position:'relative', minHeight:'100vh', display:'grid', placeItems:'center' }}>
      <LiquidEther
        colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
        style={{ position:'absolute', inset:0 }}
      />

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        .glass-input { width:100%; padding:12px 14px; height:46px; border-radius:12px; border:1px solid rgba(255,255,255,0.35); background:rgba(255,255,255,0.08); color:#f8fbff; outline:none; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); caret-color:#ffffff; }
        .glass-input::placeholder { color: rgba(236,245,255,.72); }
        .glass-input:focus { box-shadow: 0 0 0 4px rgba(120,140,255,.18), inset 0 0 0 1px rgba(255,255,255,0.1); border-color: rgba(160,180,255,.55); }
        .glass-label { display:block; font-size:13px; color: rgba(240,244,255,.94); margin-bottom:6px; }
        .pwd-wrap { display:flex; align-items:center; border-radius:12px; border:1px solid rgba(255,255,255,0.35); background:rgba(255,255,255,0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); overflow:hidden; }
        .pwd-input { flex:1; height:46px; padding:12px 14px; border:none; outline:none; background:transparent; color:#f2f6ff; }
        .pwd-input::placeholder { color: rgba(236,245,255,.72); }
        .show-btn { width:46px; height:46px; padding:0; border:none; background: transparent; background-color: transparent; color:#e6edff; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter: none; -webkit-backdrop-filter: none; border-radius:0; appearance:none; -webkit-appearance:none; transition: transform .12s ease, opacity .12s ease; }
        .show-btn:hover { background: transparent; opacity:.9; transform: scale(1.04); }
        .show-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(123,97,255,.35); border-radius: 8px; }
        .show-btn svg { pointer-events:none; }
        /* New email wrapper to match password size */
        .field-wrap { display:flex; align-items:center; border-radius:12px; border:1px solid rgba(255,255,255,0.35); background:rgba(255,255,255,0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); overflow:hidden; }
        .field-input { flex:1; height:46px; padding:12px 14px; border:none; outline:none; background:transparent; color:#f2f6ff; }
        .field-input::placeholder { color: rgba(236,245,255,.72); }
      `}</style>

      <div
        style={{
          position:'relative',
          width: 460,
          maxWidth:'94vw',
          background:'rgba(255,255,255,0.12)',
          border:'1px solid rgba(255,255,255,0.35)',
          borderRadius:18,
          padding:28,
          boxShadow:'0 30px 80px rgba(31,111,235,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
          backdropFilter:'blur(16px) saturate(120%)',
          WebkitBackdropFilter:'blur(16px) saturate(120%)',
        }}
      >
        {/* decorative layer should sit behind */}
        <div style={{ position:'absolute', inset:0, zIndex:0, borderRadius:18, pointerEvents:'none', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, left:-40, width:240, height:240, background:'radial-gradient(circle at 30% 30%, rgba(82,39,255,0.45), rgba(82,39,255,0) 60%)', filter:'blur(26px)' }} />
          <div style={{ position:'absolute', bottom:-50, right:-60, width:260, height:260, background:'radial-gradient(circle at 70% 70%, rgba(177,158,239,0.38), rgba(177,158,239,0) 60%)', filter:'blur(26px)' }} />
          <div style={{ position:'absolute', top:0, left:0, height:2, width:'40%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent)', animation:'shimmer 3s linear infinite' }} />
        </div>

        {/* content above the glass highlights */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#5227FF,#B19EEF)', color:'#fff', display:'grid', placeItems:'center', fontWeight:700, boxShadow:'0 6px 14px rgba(82,39,255,.35)' }}>⨁</div>
            <div>
              <h2 style={{ margin:0, fontSize:22, color:'#eaf0ff', textShadow:'0 1px 2px rgba(0,0,0,.25)' }}>Sign in</h2>
              <div style={{ marginTop:2, fontSize:13, color:'rgba(226,236,255,.72)' }}>Welcome back. Please enter your details.</div>
            </div>
          </div>

          {err && <div style={{ color:'#ffd6d6', background:'rgba(180,30,30,.25)', border:'1px solid rgba(255,120,120,.4)', padding:'8px 10px', borderRadius:10, marginBottom:12, backdropFilter:'blur(8px)' }}>{err}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div style={{ margin: "12px 0" }}>
              <label htmlFor="email" className="glass-label">Email</label>
              <div className="field-wrap">
                <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className="field-input" />
              </div>
            </div>

            <div style={{ margin: "12px 0" }}>
              <label htmlFor="password" className="glass-label">Password</label>
              <div className="pwd-wrap">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" className="pwd-input" />
                <button
                  type="button"
                  onClick={() => setShowPassword(v=>!v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="show-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 4.6-5.94" />
                      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.77 21.77 0 0 1-5.06 5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(230,236,255,.92)', userSelect:'none' }}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize:13, color:'#8bb1ff', textDecoration:'none', alignSelf:'center' }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={disabled} style={{ width:'100%', marginTop:14, padding:'12px 14px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6a7bff,#c18bff)', color:'#fff', fontWeight:600, letterSpacing:.2, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow:'0 14px 28px rgba(82,39,255,.28)' }}>
              {loading?"Signing in...":"Sign In"}
            </button>
          </form>

          <div style={{ marginTop:14, textAlign:'center', color:'rgba(226,236,255,.72)' }}>
            <span>New here? </span>
            <Link to="/register" style={{ color:'#8bb1ff', fontWeight:600, textDecoration:'none' }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}