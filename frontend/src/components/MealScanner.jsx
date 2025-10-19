// frontend/src/components/MealScanner.jsx

import React, { useRef, useState } from "react";
import "./MealScanner.css";
import { useAuth } from "../AuthContext";

/**
 * MealScanner: upload image, POST to backend, and call setDetections(detectionsArray).
 */
export default function MealScanner({ setDetections }) {
  const { token } = useAuth();
  // Camera & preview
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Results
  const [items, setItems] = useState([]); // {label, confidence, bbox, estimated_* , mult}
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [advice, setAdvice] = useState([]);

  // Daily goals (can be replaced by user profile later)
  const GOALS = { calories: 2200, protein: 120, carbs: 275, fat: 70 };

  // History (very light localStorage-based)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("meal_history") || "[]"); } catch { return []; }
  });

  const saveHistory = (entry) => {
    const next = [{ ...entry, id: Date.now() }, ...history].slice(0, 100);
    setHistory(next);
    localStorage.setItem("meal_history", JSON.stringify(next));
  };

  const clearHistory = () => {
    localStorage.removeItem("meal_history");
    setHistory([]);
    alert("History cleared");
  };

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch (e) {
      console.error("Camera error", e);
      alert("Cannot access camera. Check permissions and reload.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], "camera.jpg", { type: "image/jpeg" });
      setFile(f);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  // File input fallback
  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  // Helpers
  const computeTotals = (list) => {
    const t = list.reduce((acc, it) => {
      const m = it.mult ?? 1;
      acc.calories += (it.estimated_calories || 0) * m;
      acc.protein  += (it.estimated_protein  || 0) * m;
      acc.carbs    += (it.estimated_carbs    || 0) * m;
      acc.fat      += (it.estimated_fat      || 0) * m;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
      calories: Math.round(t.calories * 10) / 10,
      protein:  Math.round(t.protein  * 10) / 10,
      carbs:    Math.round(t.carbs    * 10) / 10,
      fat:      Math.round(t.fat      * 10) / 10,
    };
  };

  const drawOverlay = (list, width, height) => {
    const c = overlayRef.current; if (!c) return;
    c.width = width; c.height = height;
    const g = c.getContext("2d");
    g.clearRect(0,0,c.width,c.height);
    g.lineWidth = 2; g.font = "14px system-ui";
    list.forEach((it) => {
      const { x1, y1, x2, y2 } = it.bbox || {};
      if (x1 == null) return;
      g.strokeStyle = "#00e5ff"; g.fillStyle = "rgba(0,229,255,0.15)";
      g.beginPath(); g.rect(x1, y1, x2 - x1, y2 - y1); g.stroke(); g.fill();
      g.fillStyle = "#00e5ff";
      const label = `${it.label} ${(it.confidence*100).toFixed(0)}%`;
      g.fillText(label, x1 + 6, Math.max(14, y1 - 6));
    });
  };

  const handleScan = async () => {
    if (!file) { alert("Capture or choose an image first"); return; }
    setLoading(true);
    const fd = new FormData(); fd.append("file", file);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const resp = await fetch("http://127.0.0.1:8000/scan-meal", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const withMult = (data.detections || []).map(d => ({ ...d, mult: 1 }));
      setItems(withMult);
      setDetections?.(withMult);
      setTotals({
        calories: data.total_calories || 0,
        protein: data.total_protein || 0,
        carbs: data.total_carbs || 0,
        fat: data.total_fat || 0,
      });

      // Draw boxes on overlay if we have a preview image
      const img = new Image();
      img.onload = () => drawOverlay(withMult, img.width, img.height);
      if (preview) img.src = preview; // draw over preview size

      // Aggregate advice
      const adv = Array.from(new Set((withMult.flatMap(i => i.advice || [])).filter(Boolean)));
      setAdvice(adv);
    } catch (e) {
      console.error(e);
      alert(e.name === "AbortError" ? "Request timed out" : e.message);
    } finally {
      setLoading(false);
    }
  };

  const onChangeMult = (idx, value) => {
    const next = items.map((it, i) => i === idx ? { ...it, mult: value } : it);
    setItems(next);
    const t = computeTotals(next);
    setTotals(t);
  };

  // CSV export
  const exportCSV = () => {
    const headers = ["label","confidence","calories","protein","carbs","fat","mult"];
    const rows = items.map(i => [
      i.label,
      (i.confidence*100).toFixed(1)+"%",
      (i.estimated_calories||0).toFixed(1),
      (i.estimated_protein||0).toFixed(1),
      (i.estimated_carbs||0).toFixed(1),
      (i.estimated_fat||0).toFixed(1),
      (i.mult||1).toFixed(2)
    ]);
    const totalRow = ["TOTAL","",
      totals.calories.toFixed(1), totals.protein.toFixed(1), totals.carbs.toFixed(1), totals.fat.toFixed(1), ""
    ];
    const csv = [headers.join(","), ...rows.map(r=>r.join(",")), totalRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `meal_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const saveCurrent = () => {
    saveHistory({
      ts: new Date().toISOString(),
      totals,
      items: items.map(i => ({ label: i.label, mult: i.mult, calories: i.estimated_calories, protein: i.estimated_protein, carbs: i.estimated_carbs, fat: i.estimated_fat }))
    });
    alert("Saved to history");
  };

  // Progress ring helper
  const Ring = ({ value=0, goal=100, label }) => {
    const pct = Math.max(0, Math.min(100, (value/goal)*100));
    const r = 36, c = 2 * Math.PI * r; const off = c - (pct/100)*c;
    return (
      <div style={{ textAlign:'center' }}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} stroke="#eee" strokeWidth="10" fill="none" />
          <circle cx="48" cy="48" r={r} stroke="#6c5ce7" strokeWidth="10" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 48 48)" />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#333">{value?.toFixed(0)}</text>
        </svg>
        <div style={{ fontSize:12, color:'#666' }}>{label}</div>
      </div>
    );
  };

  return (
    <div className="meal-scanner">
      <h2 className="scanner-title">📸 Meal Scanner</h2>
      <p className="scanner-subtitle">Capture or upload your meal, adjust servings, export or save to history.</p>

      <div className="upload-section">
        {!showCamera && (
          <>
            <button className="camera-btn" onClick={startCamera}>📷 Open Camera</button>
            <input id="file-input" type="file" accept="image/*" onChange={onPickFile} />
            <label className="file-label" htmlFor="file-input">📁 Choose File</label>
          </>
        )}
        {showCamera && (
          <>
            <button className="capture-btn" onClick={capturePhoto}>📸 Capture Photo</button>
            <button className="cancel-btn" onClick={stopCamera}>❌ Cancel</button>
          </>
        )}
      </div>

      {showCamera && (
        <div className="camera-view" style={{ position:'relative' }}>
          <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
          <canvas ref={overlayRef} style={{ position:'absolute', left:0, top:0 }} />
        </div>
      )}

      {preview && (
        <div className="preview">
          <h3>📷 Preview</h3>
          <img src={preview} alt="preview" />
          <button className="scan-btn" onClick={handleScan} disabled={loading}>{loading ? "⏳ Analyzing..." : "🔍 Scan Meal"}</button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display:'none' }} />

      {items.length > 0 && (
        <div className="totals-card">
          <h2>📊 Total Nutrition</h2>
          <div className="totals-grid">
            <div className="total-item"><span>🔥 Calories</span><strong>{totals.calories.toFixed(1)}</strong><small>kcal</small></div>
            <div className="total-item"><span>🥩 Protein</span><strong>{totals.protein.toFixed(1)}</strong><small>g</small></div>
            <div className="total-item"><span>🍞 Carbs</span><strong>{totals.carbs.toFixed(1)}</strong><small>g</small></div>
            <div className="total-item"><span>🥑 Fat</span><strong>{totals.fat.toFixed(1)}</strong><small>g</small></div>
          </div>
          <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}>
            <Ring value={totals.calories} goal={GOALS.calories} label="kcal" />
            <Ring value={totals.protein} goal={GOALS.protein} label="protein" />
            <Ring value={totals.carbs} goal={GOALS.carbs} label="carbs" />
            <Ring value={totals.fat} goal={GOALS.fat} label="fat" />
          </div>
          <div style={{ marginTop:16, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={exportCSV} className="file-label">⬇️ Export CSV</button>
            <button onClick={saveCurrent} className="camera-btn">💾 Save to History</button>
            <button onClick={clearHistory} className="cancel-btn">🧹 Clear History</button>
          </div>
        </div>
      )}

      {advice.length > 0 && (
        <div style={{ marginTop:16, background:'#fff', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>🧠 Suggestions</h3>
          <ul>{advice.map((a,i)=>(<li key={i}>{a}</li>))}</ul>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop:16 }}>
          <h3>🍽️ Items & Servings</h3>
          {items.map((it, idx) => (
            <div key={idx} className="result-card" style={{ marginTop:12 }}>
              <div className="label-row"><h3 style={{ textTransform:'capitalize' }}>{it.label}</h3><div className="conf-pill">{Math.round((it.confidence||0)*100)}%</div></div>
              <div className="conf-bar" aria-hidden><i style={{ width: `${Math.round((it.confidence||0)*100)}%` }} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                <div>Calories: <strong>{(it.estimated_calories||0).toFixed(1)}</strong></div>
                <div>Protein: <strong>{(it.estimated_protein||0).toFixed(1)} g</strong></div>
                <div>Carbs: <strong>{(it.estimated_carbs||0).toFixed(1)} g</strong></div>
                <div>Fat: <strong>{(it.estimated_fat||0).toFixed(1)} g</strong></div>
              </div>
              <div style={{ marginTop:10 }}>
                <label>Serving x{(it.mult||1).toFixed(2)}</label>
                <input type="range" min="0.25" max="2.0" step="0.05" value={it.mult||1} onChange={(e)=>onChangeMult(idx, parseFloat(e.target.value))} style={{ width:'100%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3>📚 Recent Scans</h3>
            <button onClick={clearHistory} className="cancel-btn">Clear All</button>
          </div>
          <ul style={{ listStyle:'none', padding:0 }}>
            {history.slice(0,10).map(h => (
              <li key={h.id} style={{ background:'#fff', margin:'8px 0', padding:12, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:12, color:'#666' }}>{new Date(h.ts).toLocaleString()}</div>
                <div>Calories: <strong>{h.totals.calories.toFixed(1)}</strong> | Protein: <strong>{h.totals.protein.toFixed(1)} g</strong> | Carbs: <strong>{h.totals.carbs.toFixed(1)} g</strong> | Fat: <strong>{h.totals.fat.toFixed(1)} g</strong></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
