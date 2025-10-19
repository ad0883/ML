import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./BMICalculator.css";

const BMICATEGORIES = [
  { id: "underweight", label: "Underweight", min: 0, max: 18.4, color: "#6ea8fe" },
  { id: "normal", label: "Normal", min: 18.5, max: 24.9, color: "#6ef3c5" },
  { id: "overweight", label: "Overweight", min: 25, max: 29.9, color: "#ffd166" },
  { id: "obese", label: "Obese", min: 30, max: 100, color: "#ff6b6b" },
];

const LS_KEY = "mealapp_bmi_history_v1";

function findCategory(bmi) {
  if (bmi === null || isNaN(bmi)) return null;
  return BMICATEGORIES.find((c) => bmi >= c.min && bmi <= c.max) || null;
}

export default function BMICalculator() {
  const [unit, setUnit] = useState("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => setCategory(findCategory(bmi)), [bmi]);

  const clearError = () => setError("");

  const validate = () => {
    clearError();
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!Number.isFinite(w) || w <= 0) { setError("Enter a valid weight."); return false; }
    if (!Number.isFinite(h) || h <= 0) { setError("Enter a valid height."); return false; }
    if (unit === "metric" && (h < 50 || h > 300)) { setError("Height (cm) looks unrealistic."); return false; }
    return true;
  };

  const calcBMI = () => {
    if (!validate()) return;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    let val;
    if (unit === "metric") {
      const m = h / 100;
      val = w / (m * m);
    } else {
      val = (w / (h * h)) * 703;
    }
    val = Math.round(val * 10) / 10;
    setBmi(val);

    const entry = { id: Date.now().toString(), bmi: val, weight: w, height: h, unit, ts: new Date().toISOString() };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(LS_KEY); };
  const deleteEntry = (id) => { const next = history.filter(h => h.id !== id); setHistory(next); localStorage.setItem(LS_KEY, JSON.stringify(next)); };

  return (
    <div className="bmi-calculator">
      <div className="bmi-top">
        <div className="bmi-left">
          <h2>BMI Calculator</h2>

          <div className="unit-row">
            <button className={`unit-btn ${unit === "metric" ? "" : "ghost"}`} onClick={() => setUnit("metric")}>Metric</button>
            <button className={`unit-btn ${unit === "imperial" ? "" : "ghost"}`} onClick={() => setUnit("imperial")}>Imperial</button>
          </div>

          <div className="inputs-row">
            <input type="number" placeholder={unit === "metric" ? "Weight (kg)" : "Weight (lb)"} value={weight} onChange={e => { setWeight(e.target.value); clearError(); }} />
            <input type="number" placeholder={unit === "metric" ? "Height (cm)" : "Height (in)"} value={height} onChange={e => { setHeight(e.target.value); clearError(); }} />
            <button className="button" onClick={calcBMI}>Calculate</button>
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="bmi-error">{error}</motion.div>}
          </AnimatePresence>
        </div>

        <div className="bmi-right">
          <div className="bmi-summary">
            <div className="bmi-value">{bmi ?? "--"}</div>
            <div className="bmi-label">{category?.label ?? "—"}</div>
          </div>

          <div className="bmi-bar-wrap">
            <div className="bmi-bar-bg"><motion.div className="bmi-bar-fill" animate={{ width: `${Math.min(100, (bmi ? (bmi/40)*100 : 0))}%` }} transition={{ type: "spring", stiffness: 80 }} /></div>
          </div>

          <div className="bmi-interpret">
            {bmi ? (
              <div>
                {category?.id === "normal"
                  ? "Healthy range — keep it up!"
                  : category?.id === "underweight"
                    ? "Underweight — consider nutrient-dense meals."
                    : category?.id === "overweight"
                      ? "Slightly above — increase activity & monitor diet."
                      : "High BMI — consider professional advice."}
              </div>
            ) : <div>Enter values and click Calculate for interpretation.</div>}
          </div>
        </div>
      </div>

      <div className="bmi-history">
        <div className="history-header">
          <h3>History</h3>
          <div className="history-actions">
            <button className="button ghost" onClick={() => { setWeight(""); setHeight(""); setBmi(null); setCategory(null); }}>Reset</button>
            <button className="button ghost" onClick={clearHistory}>Clear</button>
          </div>
        </div>

        <div className="history-list">
          {history.length === 0 ? <div className="small">No saved results yet</div> : history.map(h => (
            <div className="history-item" key={h.id}>
              <div>
                <div className="history-bmi">{h.bmi} BMI • {findCategory(h.bmi)?.label ?? ""}</div>
                <div className="small">{h.weight}{h.unit==="metric"?" kg":" lb"} · {h.height}{h.unit==="metric"?" cm":" in"}</div>
                <div className="small">{new Date(h.ts).toLocaleString()}</div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button className="button ghost" onClick={() => { setBmi(h.bmi); setCategory(findCategory(h.bmi)); }}>Load</button>
                <button className="button ghost" onClick={() => deleteEntry(h.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
