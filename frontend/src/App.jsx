import React, { useState } from "react";
import MealScanner from "./components/MealScanner";
// import ResultCard from "./components/ResultCard";
// import BMICalculator from "./components/BMICalculator";
import PrismaticBurst from "./components/PrismaticBurst";
import "./App.css"; // CSS

export default function App() {
  const [detections, setDetections] = useState([]);

  return (
    <div>
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
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

      <div style={{ display:'grid', placeItems:'center', marginTop: -120 }}>
        <MealScanner setDetections={setDetections} />
      </div>
    </div>
  );
}
