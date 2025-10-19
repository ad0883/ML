// filepath: /Users/akbroc/Desktop/ML/frontend/src/pages/Landing.jsx
import React, { useState, useEffect } from 'react';
import Plasma from '../components/Plasma';
import PillNav from '../components/PillNav';
import logo from '../assets/logo.svg';
import './Landing.css';
import CardSwap, { Card } from '../components/CardSwap';
import ScrambledText from '../components/ScrambledText';
import Celebration from '../components/Celebration';

export default function Landing() {
  const [username, setUsername] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [inputName, setInputName] = useState('');
  const [activeCard, setActiveCard] = useState(0);

  // Titles and copy for Explore Features
  const featureTitles = ['HealthNexus', 'Hydration', 'Supplements', 'Profile'];
  const featureDescriptions = [
    'Chat with AI for nutrition guidance, insights, and personalized tips.',
    'Track water intake, hit goals, and visualize fasting windows.',
    'Plan your routine, set reminders, and track adherence.',
    'View streaks, points, goals, and unlock achievements.'
  ];

  const getStoredName = () => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile_v1') || '{}');
      const raw = (profile?.name || localStorage.getItem('username') || '').trim();
      if (raw && raw.toLowerCase() === 'alok') return '';
      return raw;
    } catch {
      const raw = (localStorage.getItem('username') || '').trim();
      if (raw && raw.toLowerCase() === 'alok') return '';
      return raw;
    }
  };

  useEffect(() => {
    const name = getStoredName();
    const loggedOut = localStorage.getItem('logged_out_v1') === '1';
    if (name) {
      setUsername(name);
      setShowModal(false);
      try { localStorage.removeItem('logged_out_v1'); } catch {}
    } else {
      setShowModal(!loggedOut);
    }

    const onStorage = (e) => {
      if (e.key === 'user_profile_v1' || e.key === 'username' || e.key === 'logged_out_v1') {
        const n = getStoredName();
        const lo = localStorage.getItem('logged_out_v1') === '1';
        setUsername(n || '');
        setShowModal(!n && !lo);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSaveName = () => {
    if (inputName.trim()) {
      const trimmed = inputName.trim();
      const profile = JSON.parse(localStorage.getItem('user_profile_v1') || '{}');
      const next = { ...profile, name: trimmed };
      try { localStorage.setItem('user_profile_v1', JSON.stringify(next)); } catch {}
      localStorage.setItem('username', trimmed);

      // Initialize per-user buckets
      try {
        const uid = trimmed.toLowerCase();
        const mealKey = `meal_history:${uid}`;
        const achKey = `achievements_v1:${uid}`;
        if (!localStorage.getItem(mealKey)) localStorage.setItem(mealKey, '[]');
        if (!localStorage.getItem(achKey)) localStorage.setItem(achKey, '{}');
      } catch {}

      try { localStorage.removeItem('logged_out_v1'); } catch {}
      setUsername(trimmed);
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user_profile_v1');
      localStorage.removeItem('username');
      localStorage.setItem('logged_out_v1', '1');
    } catch {}
    setUsername('');
    setInputName('');
    setShowModal(false);
    // Redirect to login page
    setTimeout(() => {
      try { window.location.assign('/login'); }
      catch { window.location.href = '/login'; }
    }, 50);
  };

  return (
    <div style={{ position:'relative', minHeight:'100dvh', overflow:'hidden' }}>
      <Celebration />
      {/* Fixed Logout button */}
      <button
        onClick={handleLogout}
        aria-label="Logout"
        style={{ position:'fixed', top:12, right:12, zIndex: 10000, padding:'8px 12px', borderRadius:999, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.95)', color:'#111', fontWeight:700, cursor:'pointer' }}
      >
        Logout
      </button>
      {/* Full-viewport animated background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <Plasma color="#9aa4ff" opacity={0.8} speed={0.8} />
      </div>
      

      {/* Foreground content */}
      <div style={{ position:'relative', zIndex:1 }}>
        {/* Removed old absolute logout button here */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <br />
              <br />
              <h2>Welcome!</h2>
              <p>What should we call you?</p>
              <input
                type="text"
                placeholder="Your name"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button onClick={handleSaveName} className="modal-btn">Continue</button>
            </div>
          </div>
        )}

        <PillNav
          logo={logo}
          items={[
            { label:'Home', href:'/landing' },
            { label:'Scan', href:'/scan' },
            { label:'Chat', href:'/chat' },
            { label:'Hydration', href:'/hydration' },
            { label:'Supplements', href:'/supplements' },
            { label:'Profile', href:'/profile' }
          ]}
          activeHref="/landing"
          baseColor="#000000"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#000000"
        />

        {/* Hero */}
        <section style={{ position:'relative', height: 420 }}>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 16px', gap:12 }}>
            {username && <h2 style={{ color:'#eaf0ff', margin:0, fontSize:28, fontWeight:700 }}>Welcome back, {username}! at</h2>}
            <h1 style={{ color:'#eaf0ff', margin:0, fontSize:48, fontWeight:800 }}>HealthNexus</h1>
            <p style={{ margin:0, fontSize: 18, color:'rgba(234,240,255,0.85)' }}>
              Snap a meal · Get detections · See macros · Own your health
            </p>
          </div>
        </section>

        {/* Main content */}
        <section style={{ width:'min(1100px,92vw)', margin:'32px auto', color:'#eaf0ff' }}>
          <h2>How it works</h2>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Upload or capture your meal. Our model detects food items and estimates calories, protein, carbs and fat. Adjust servings and export results.
          </p>
        </section>

        <section style={{ width:'min(1100px,92vw)', margin:'32px auto', color:'#eaf0ff', display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))' }}>
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
            <h3>Fast</h3>
            <p>GPU-accelerated inference with responsive WebGL visuals.</p>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
            <h3>Accurate</h3>
            <p>Trained on diverse cuisines with nutrition mapping.</p>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:16 }}>
            <h3>Private</h3>
            <p>Data stays on your device; only images you upload are processed.</p>
          </div>
        </section>

        <section style={{ width:'min(1100px,92vw)', margin:'56px auto 72px', minHeight: 620, display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 40, alignItems:'center' }}>
          <div>
            <h2 style={{ color:'#eaf0ff', margin:'0 0 12px', letterSpacing: '.2px' }}>Explore Features</h2>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', border:'1px solid rgba(255,255,255,0.28)', background:'rgba(255,255,255,0.08)', borderRadius:999, marginBottom:12, color:'#eaf0ff' }}>
              <span style={{ fontWeight:800 }}>{featureTitles[activeCard]}</span>
            </div>
            <ScrambledText
              key={activeCard}
              radius={120}
              duration={1.0}
              speed={0.6}
              scrambleChars='.:;!?'
              style={{ color:'#eaf0ff', fontSize:'clamp(16px,2.1vw,22px)', lineHeight:1.6, maxWidth:620, textAlign:'left' }}
            >
              {featureDescriptions[activeCard]}
            </ScrambledText>
          </div>
          <div style={{ position:'relative', height: 600 }}>
            <CardSwap cardDistance={60} verticalDistance={70} delay={5000} pauseOnHover={false} onActiveChange={setActiveCard}>
              <Card>
                <h3>HealthNexus Chatbot</h3>
                <p>Ask AI for nutrition tips, meal plans, and insights.</p>
              </Card>
              <Card>
                <h3>Hydration Tracking</h3>
                <p>Daily goals, reminders, and streaks to keep you hydrated.</p>
              </Card>
              <Card>
                <h3>Supplements</h3>
                <p>Plan, log, and track supplement adherence.</p>
              </Card>
              <Card>
                <h3>Profile & Achievements</h3>
                <p>Personal stats, goals, and unlockable badges.</p>
              </Card>
            </CardSwap>
          </div>
        </section>
      </div>
    </div>
  );
}