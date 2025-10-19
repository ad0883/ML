// filepath: /Users/akbroc/Desktop/ML/frontend/src/pages/Supplements.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PillNav from '../components/PillNav';
import logo from '../assets/logo.svg';
import './Supplements.css';
import DarkVeil from '../components/DarkVeil';

const KEY='supplements_v1';
const today=()=>new Date().toISOString().slice(0,10);
const load=()=>{ try { return JSON.parse(localStorage.getItem(KEY)||'{}'); } catch { return {}; } };
const save=(s)=>{ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

const INTERACTIONS = {
  'vitamin C': ['iron: boosts absorption'],
  'calcium': ['iron: reduces absorption (separate by 2h)'],
  'magnesium': ['zinc: compete at high doses'],
  'fish oil': ['blood thinners: consult your doctor']
};

export default function Supplements(){
  const stored = load();
  const [items, setItems] = useState(stored.items || [
    { id: 1, name:'Vitamin D3', dose:'2000 IU', times:['08:00'], notes:'' },
    { id: 2, name:'Magnesium', dose:'200 mg', times:['20:00'], notes:'before bed' }
  ]);
  const [checks, setChecks] = useState(stored.checks || {}); // { 'YYYY-MM-DD': { itemId: [timeIndex,...] } }
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:00');

  useEffect(()=>{ save({ items, checks }); }, [items, checks]);

  const addItem = () => {
    if (!name.trim()) return;
    const id = Date.now();
    const it = { id, name: name.trim(), dose: dose.trim(), times:[time], notes:'' };
    setItems(prev=>[...prev, it]); setName(''); setDose(''); setTime('08:00');
  };

  const toggleCheck = (itemId, tIndex) => {
    const k = today();
    setChecks(prev=>{
      const day = { ...(prev[k]||{}) };
      const arr = new Set(day[itemId] || []);
      if (arr.has(tIndex)) arr.delete(tIndex); else arr.add(tIndex);
      day[itemId] = Array.from(arr);
      return { ...prev, [k]: day };
    });
  };

  const hints = useMemo(()=>{
    const out = new Set();
    items.forEach(it=>{
      const arr = INTERACTIONS[it.name.toLowerCase()];
      if (arr) arr.forEach(m => out.add(`${it.name}: ${m}`));
    });
    return Array.from(out);
  }, [items]);

  return (
    <div className="supp-page">
      {/* DarkVeil full-screen background */}
      <div className="dv-bg">
        <DarkVeil hueShift={180} noiseIntensity={0.06} scanlineIntensity={0.02} speed={1.2} scanlineFrequency={0.02} warpAmount={0.08} />
      </div>

      {/* Wrap navbar for positioning */}
      <div className="supp-nav">
        {/* Existing PillNav preserved */}
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
          activeHref="/supplements"
          baseColor="#000000"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#000000"
        />
      </div>

      <div className="glass head">
        <h1>Supplements</h1>
        <p>Plan doses, check off intakes, and avoid common interactions.</p>
      </div>

      <div className="glass add-form">
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Dose" value={dose} onChange={e=>setDose(e.target.value)} />
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
        <button className="btn primary" onClick={addItem}>Add</button>
      </div>

      <div className="grid">
        {items.map(it=> (
          <div className="glass card" key={it.id}>
            <div className="row">
              <div>
                <h3>{it.name}</h3>
                <small>{it.dose}</small>
              </div>
            </div>
            <div className="times">
              {it.times.map((t,idx)=>{
                const done = (checks[today()]?.[it.id]||[]).includes(idx);
                return (
                  <button key={idx} className={"pill "+(done?'done':'')} onClick={()=>toggleCheck(it.id, idx)}>{t}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hints.length>0 && (
        <div className="glass hints">
          <h3>Hints</h3>
          <ul>{hints.map((h,i)=>(<li key={i}>{h}</li>))}</ul>
        </div>
      )}
    </div>
  );
}
