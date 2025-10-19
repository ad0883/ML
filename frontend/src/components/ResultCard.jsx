// frontend/src/components/ResultCard.jsx
import React, { useEffect, useRef } from "react";
import "./ResultCard.css";

export default function ResultCard({ food }) {
  const barRef = useRef(null);

  useEffect(() => {
    // animate the conf bar width
    const pct = Math.round((food.confidence || 0) * 100);
    if (barRef.current) {
      // start at 0 then animate to pct
      barRef.current.style.width = "0%";
      requestAnimationFrame(() => {
        barRef.current.style.width = `${pct}%`;
      });
    }
  }, [food]);

  // friendly rounding
  const confPct = Math.round((food.confidence || 0) * 100);

  return (
    <div className="result-card">
      <div className="label-row">
        <h3>{food.label || "Unknown Food"}</h3>
        <div className="conf-pill">{confPct}%</div>
      </div>

      <div className="conf-bar" aria-hidden>
        <i ref={barRef} style={{ width: "0%" }} />
      </div>

      <div className="nutrition-info" style={{ marginTop: 12 }}>
        <div className="nutrition-row">
          <span>Calories:</span>
          <strong>{food.estimated_calories?.toFixed(1) ?? "—"} kcal</strong>
        </div>
        
        <div className="nutrition-row">
          <span>Protein:</span>
          <strong>{food.estimated_protein?.toFixed(1) ?? "—"} g</strong>
        </div>
        
        <div className="nutrition-row">
          <span>Carbs:</span>
          <strong>{food.estimated_carbs?.toFixed(1) ?? "—"} g</strong>
        </div>
        
        <div className="nutrition-row">
          <span>Fat:</span>
          <strong>{food.estimated_fat?.toFixed(1) ?? "—"} g</strong>
        </div>
      </div>

      {food.nutrition && (
        <div className="nutrition-details">
          <small>
            Per 100g: {food.nutrition.cal_per_100g} cal, {food.nutrition.protein_per_100g}g protein, {food.nutrition.carbs_per_100g}g carbs, {food.nutrition.fat_per_100g}g fat
          </small>
          <small>
            Typical serving: {food.nutrition.serving_g}g
          </small>
        </div>
      )}
    </div>
  );
}
