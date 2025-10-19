// filepath: /Users/akbroc/Desktop/ML/frontend/src/pages/Scan.jsx
import React, { useRef, useState } from 'react';
import PrismaticBurst from '../components/PrismaticBurst';
import PillNav from '../components/PillNav';
import logo from '../assets/logo.svg';
import './Scan.css';
import Celebration from '../components/Celebration';
import { unlockAchievement } from '../utils/achievements';
import { API_BASE } from '../utils/config';

function getUserId() {
  try {
    const profile = JSON.parse(localStorage.getItem('user_profile_v1') || '{}');
    const raw = (profile?.name || localStorage.getItem('username') || 'guest').trim().toLowerCase();
    return raw || 'guest';
  } catch {
    const raw = (localStorage.getItem('username') || 'guest').trim().toLowerCase();
    return raw || 'guest';
  }
}

export default function Scan() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  // Camera
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = f => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const onDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = s;
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 0);
    } catch (e) {
      console.error('Camera error', e);
      setError('Cannot access camera. Check permissions.');
    }
  };

  const stopCamera = () => {
    try { streamRef.current?.getTracks?.().forEach(t => t.stop()); } catch {}
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current; if (!video) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      const f = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
      onFile(f);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const onScan = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name || 'meal.jpg');
      const resp = await fetch(`${API_BASE}/scan-meal`, { method: 'POST', body: fd });
      if (!resp.ok) {
        const msg = await resp.json().catch(() => ({ detail: 'Scan failed' }));
        throw new Error(msg.detail || 'Scan failed');
      }
      const data = await resp.json();
      setResult(data);

      // Log to history for profile stats (per user)
      try {
        const dets = Array.isArray(data?.detections) ? data.detections : [];
        const totals = {
          calories: data?.total_calories ?? dets.reduce((a,d)=>a + (d.estimated_calories||0),0),
          protein:  data?.total_protein  ?? dets.reduce((a,d)=>a + (d.estimated_protein ||0),0),
          carbs:    data?.total_carbs    ?? dets.reduce((a,d)=>a + (d.estimated_carbs   ||0),0),
          fat:      data?.total_fat      ?? dets.reduce((a,d)=>a + (d.estimated_fat     ||0),0),
        };
        const uid = getUserId();
        const key = `meal_history:${uid}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push({ id: Date.now(), at: new Date().toISOString(), totals, count: dets.length });
        localStorage.setItem(key, JSON.stringify(history));
      } catch {}

      // Unlock first achievement and broadcast celebration
      unlockAchievement('first_scan');
    } catch (e) {
      setError(e.message || 'Scan failed');
    } finally { setLoading(false); }
  };

  // UI helpers
  const copyJSON = () => {
    if (!result) return;
    try { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); } catch {}
  };
  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `scan_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const Summary = ({ data }) => {
    const dets = Array.isArray(data?.detections) ? data.detections : [];
    const totals = {
      calories: data?.total_calories ?? dets.reduce((a,d)=>a + (d.estimated_calories||0),0),
      protein:  data?.total_protein  ?? dets.reduce((a,d)=>a + (d.estimated_protein ||0),0),
      carbs:    data?.total_carbs    ?? dets.reduce((a,d)=>a + (d.estimated_carbs   ||0),0),
      fat:      data?.total_fat      ?? dets.reduce((a,d)=>a + (d.estimated_fat     ||0),0),
    };
    const Ring = ({ value=0, max=100, label }) => {
      const r=36,c=2*Math.PI*r, pct=Math.max(0,Math.min(1,value/(max||1))); const off=c - pct*c;
      return (
        <div className="macro-card">
          <svg width="96" height="96" viewBox="0 0 96 96" className="ring">
            <circle cx="48" cy="48" r={r} className="ring-track" />
            <circle cx="48" cy="48" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={off} />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">{Math.round(value)}</text>
          </svg>
          <div className="macro-label">{label}</div>
        </div>
      );
    };
    return (
      <div className="summary-grid">
        <Ring value={totals.calories} max={2500} label="kcal" />
        <Ring value={totals.protein}  max={120}  label="protein" />
        <Ring value={totals.carbs}    max={275}  label="carbs" />
        <Ring value={totals.fat}      max={70}   label="fat" />
      </div>
    );
  };

  const DetectionCard = ({ d }) => {
    const pct = Math.round((d?.confidence||0)*100);
    return (
      <div className="det-card">
        <div className="det-head">
          <h4>{d?.label || 'item'}</h4>
          <span className="pill">{pct}%</span>
        </div>
        <div className="det-grid">
          <div><span>kcal</span><strong>{(d?.estimated_calories||0).toFixed(1)}</strong></div>
          <div><span>protein</span><strong>{(d?.estimated_protein||0).toFixed(1)} g</strong></div>
          <div><span>carbs</span><strong>{(d?.estimated_carbs||0).toFixed(1)} g</strong></div>
          <div><span>fat</span><strong>{(d?.estimated_fat||0).toFixed(1)} g</strong></div>
        </div>
      </div>
    );
  };

  const AdviceChips = ({ list }) => {
    if (!list?.length) return null;
    const uniq = Array.from(new Set(list.filter(Boolean)));
    return (
      <div className="chips">
        {uniq.map((t,i)=>(<span key={i} className="chip">{t}</span>))}
      </div>
    );
  };

  const dets = Array.isArray(result?.detections) ? result.detections : [];
  const allAdvice = dets.flatMap(d => d?.advice || []);

  return (
    <div className="scan-page" style={{ position:'relative', minHeight:'100dvh', overflowX:'hidden', overflowY:'auto' }}>
      {/* Full-viewport animated background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={1.0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={["#ff007a", "#4d3dff", "#ffffff"]}
        />
      </div>

      {/* Foreground content */}
      <div style={{ position:'relative', zIndex:1 }}>
        <Celebration />
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
          activeHref="/scan"
          baseColor="#000000"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#000000"
        />

        <div className="scan-pane" style={{ marginTop: 'clamp(56px, 29vh, 2000px)', overflow:'visible', paddingBottom:'2vh' }}>
          <div className="scan-head">
            <h1>Scan your meal</h1>
            <p>Drop an image or use camera. We’ll detect items and estimate nutrition.</p>
          </div>
          <br />

          <div className="actions top">
            {!showCamera ? (
              <button className="btn ghost" onClick={startCamera}>Open Camera</button>
            ) : (
              <>
                <button className="btn primary" onClick={capturePhoto}>Capture</button>
                <button className="btn ghost" onClick={stopCamera}>Close Camera</button>
              </>
            )}
          </div>

          {showCamera && (
            <div className="camera-view">
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            </div>
          )}
          <br />

          {!showCamera && (
            <div
              className="dropzone"
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onClick={pick}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && pick()}
            >
              {preview ? (
                <img src={preview} alt="preview" />
              ) : (
                <div className="dz-hint">
                  <strong>Drag & drop</strong> an image here or <span className="link">browse</span>
                </div>
              )}
              <input
                ref={inputRef}
                id="file-input"
                type="file"
                accept="image/*"
                onChange={e => onFile(e.target.files?.[0])}
                hidden
              />
            </div>
          )}

          <div className="actions">
            <button className="btn primary lg" disabled={!file || loading} onClick={onScan}>
              {loading ? 'Scanning…' : 'Scan meal'}
            </button>
            <button className="btn ghost" disabled={!file || loading} onClick={() => { setFile(null); setPreview(''); setResult(null); }}>Clear</button>
          </div>

          {error && <div className="alert error">{error}</div>}

          {result && (
            <>
              <div className="result-actions">
                <button className="btn ghost" onClick={copyJSON}>Copy JSON</button>
                <button className="btn ghost" onClick={downloadJSON}>Download JSON</button>
                <button className="btn ghost" onClick={() => setShowRaw(v=>!v)}>{showRaw ? 'Hide raw data' : 'Show raw data'}</button>
              </div>

              <Summary data={result} />

              <AdviceChips list={allAdvice} />

              <div className="det-list">
                {dets.map((d,i)=>(<DetectionCard key={i} d={d} />))}
              </div>

              {showRaw && (
                <div className="result-raw">
                  <h3>Raw</h3>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
