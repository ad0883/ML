// filepath: /Users/akbroc/Desktop/ML/frontend/src/components/Celebration.jsx
import React, { useEffect, useState } from 'react';
import { onAchievement } from '../utils/achievements';

export default function Celebration() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    return onAchievement(({ id }) => {
      setActive({ id, at: Date.now() });
      setTimeout(() => setActive(null), 4200);
    });
  }, []);

  if (!active) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex: 9999, pointerEvents:'none' }}>
      {/* Confetti-like simple animation using CSS */}
      <div className="confetti-layer"/>
      <div style={{ position:'absolute', top:'10vh', left:'50%', transform:'translateX(-50%)', background:'rgba(255,255,255,0.95)', color:'#111', padding:'14px 18px', borderRadius:12, boxShadow:'0 10px 40px rgba(0,0,0,0.35)', fontWeight:800 }}>
        Achievement unlocked!
      </div>
      <style>{`
        .confetti-layer { position:absolute; inset:0; overflow:hidden; }
        .confetti-layer:before, .confetti-layer:after {
          content:''; position:absolute; left:50%; top:-20px; width:2px; height:2px; background:transparent;
          box-shadow:
            -200px 20px 0 2px #ff3b3b,
            -150px 60px 0 2px #ffd93b,
            -100px 40px 0 2px #3bf2ff,
            -50px 80px 0 2px #6bff3b,
            0 50px 0 2px #ff3bde,
            50px 90px 0 2px #ff7b3b,
            100px 30px 0 2px #7b3bff,
            150px 70px 0 2px #3bff7e,
            200px 60px 0 2px #3b9bff;
          animation: fall 2.8s linear infinite;
        }
        .confetti-layer:after { filter:hue-rotate(120deg); animation-delay: .6s; }
        @keyframes fall { from { transform: translate(-50%, -20px); } to { transform: translate(-50%, 110vh); } }
      `}</style>
    </div>
  );
}
