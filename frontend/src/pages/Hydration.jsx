// filepath: /Users/akbroc/Desktop/ML/frontend/src/pages/Hydration.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PillNav from '../components/PillNav';
import LightRays from '../components/LightRays';
import logo from '../assets/logo.svg';
import './Hydration.css';

const LC_KEY = 'hydration_fasting_state_v1';
const todayKey = () => new Date().toISOString().slice(0,10);

const loadState = () => {
  try { return JSON.parse(localStorage.getItem(LC_KEY) || '{}'); } catch { return {}; }
};
const saveState = (s) => { try { localStorage.setItem(LC_KEY, JSON.stringify(s)); } catch {} };

const notify = (title, body) => {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') new Notification(title, { body });
      else if (Notification.permission !== 'denied') Notification.requestPermission();
    }
  } catch {}
};

const Ring = ({ value=0, max=100, label }) => {
  const r=36,c=2*Math.PI*r, pct=Math.max(0,Math.min(1,(max? value/max:0))); const off=c - pct*c;
  return (
    <div className="ring-card">
      <svg width="96" height="96" viewBox="0 0 96 96" className="ring">
        <circle cx="48" cy="48" r={r} className="ring-track" />
        <circle cx="48" cy="48" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={off} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">{Math.round(value)}</text>
      </svg>
      <div className="ring-label">{label}</div>
    </div>
  );
};

export default function Hydration(){
  const stored = loadState();
  const [dateKey, setDateKey] = useState(todayKey());
  const [goalMl, setGoalMl] = useState(stored.goalMl ?? 2000);
  const [waterMl, setWaterMl] = useState((stored.daily?.[todayKey()]?.waterMl) ?? 0);
  const [intervalMin, setIntervalMin] = useState(stored.intervalMin ?? 90);
  const [remindersOn, setRemindersOn] = useState(stored.remindersOn ?? false);

  // fasting
  const [fastStart, setFastStart] = useState(stored.fastStart ?? null); // epoch ms
  const [fastHistory, setFastHistory] = useState(stored.fastHistory ?? []); // [{date:'YYYY-MM-DD', hours: n}]
  const [minFastHrs, setMinFastHrs] = useState(stored.minFastHrs ?? 14);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  // persist
  useEffect(()=>{
    const next = {
      goalMl, intervalMin, remindersOn, fastStart, fastHistory,
      daily: { ...(stored.daily||{}), [todayKey()]: { waterMl } },
      minFastHrs
    };
    saveState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalMl, intervalMin, remindersOn, waterMl, fastStart, fastHistory, minFastHrs]);

  // change of day rollover
  useEffect(()=>{
    const t = setInterval(()=>{
      const k = todayKey(); if (k !== dateKey){ setDateKey(k); setWaterMl(loadState().daily?.[k]?.waterMl || 0); }
      setTick(x=>x+1);
    }, 1000*30);
    return ()=>clearInterval(t);
  }, [dateKey]);

  // reminders
  useEffect(()=>{
    if (!remindersOn) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current=null; return; }
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = Math.max(5, Number(intervalMin)||0) * 60 * 1000;
    intervalRef.current = setInterval(()=> notify('Hydrate', 'Time to drink some water 💧'), ms);
    return ()=>{ if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [remindersOn, intervalMin]);

  const addWater = (ml) => setWaterMl(v=>Math.max(0,(v||0)+ml));
  const resetWater = () => setWaterMl(0);

  const fastingActive = !!fastStart;
  const fastElapsedHrs = useMemo(()=> fastStart ? (Date.now()-fastStart)/36e5 : 0, [fastStart, tick]);

  const stopFast = () => {
    if (!fastStart) return;
    const hours = (Date.now()-fastStart)/36e5;
    const entry = { date: todayKey(), hours: Number(hours.toFixed(2)) };
    setFastHistory((h)=>[entry, ...h].slice(0,200));
    setFastStart(null);
  };

  const streak = useMemo(()=>{
    const set = new Map(); (fastHistory||[]).forEach(e=>set.set(e.date, e.hours));
    let s=0; let d=new Date();
    while(true){ const key=d.toISOString().slice(0,10); const hrs=set.get(key)||0; if(hrs>=minFastHrs) { s++; d.setDate(d.getDate()-1);} else break; }
    return s;
  }, [fastHistory, minFastHrs, dateKey]);

  return (
    <div className="hydration-page">
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
        activeHref="/hydration"
        baseColor="#000000"
        pillColor="#ffffff"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#000000"
      />

      <div className="hydration-bg">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>

      <div className="glass hero">
        <div className="head">
          <h1>Hydration & Fasting</h1>
          <p>Track water, set reminders, and build healthy fasting streaks.</p>
        </div>
        <div className="rings">
          <Ring value={waterMl} max={goalMl} label="ml" />
          <Ring value={Math.min(fastElapsedHrs, minFastHrs)} max={minFastHrs} label="fast hrs" />
          <Ring value={streak} max={30} label="streak" />
        </div>
      </div>

      <div className="grid">
        <section className="glass card">
          <h2>Water</h2>
          <div className="row">
            <button className="btn primary" onClick={()=>addWater(250)}>+250 ml</button>
            <button className="btn primary" onClick={()=>addWater(500)}>+500 ml</button>
            <button className="btn ghost" onClick={resetWater}>Reset</button>
          </div>
          <div className="row">
            <label>Daily goal (ml)</label>
            <input type="number" value={goalMl} onChange={e=>setGoalMl(Math.max(250, Number(e.target.value)||0))} />
          </div>
        </section>

        <section className="glass card">
          <h2>Reminders</h2>
          <div className="row">
            <label>Every (minutes)</label>
            <input type="number" min="5" value={intervalMin} onChange={e=>setIntervalMin(Math.max(5, Number(e.target.value)||0))} />
          </div>
          <div className="row">
            <button className="btn primary" onClick={()=>{ if ('Notification' in window) Notification.requestPermission(); setRemindersOn(true); }}>Enable</button>
            <button className="btn ghost" onClick={()=>setRemindersOn(false)}>Disable</button>
          </div>
          <small>Uses browser notifications. Keep the tab open.</small>
        </section>

        <section className="glass card">
          <h2>Fasting</h2>
          {!fastingActive ? (
            <div className="row">
              <button className="btn primary" onClick={()=>setFastStart(Date.now())}>Start fast</button>
              <label>Goal (hrs)</label>
              <input type="number" min="10" value={minFastHrs} onChange={e=>setMinFastHrs(Math.max(8, Number(e.target.value)||0))} />
            </div>
          ) : (
            <div className="row">
              <div>Elapsed: <strong>{fastElapsedHrs.toFixed(2)} h</strong></div>
              <button className="btn ghost" onClick={stopFast}>End fast</button>
            </div>
          )}

          <div className="history">
            <h3>History</h3>
            <ul>
              {(fastHistory||[]).slice(0,10).map((e,i)=>(<li key={i}><span>{e.date}</span><strong>{e.hours} h</strong></li>))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
