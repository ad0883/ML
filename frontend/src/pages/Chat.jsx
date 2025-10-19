// filepath: /Users/akbroc/Desktop/ML/frontend/src/pages/Chat.jsx
import React from 'react';
import PillNav from '../components/PillNav';
import logo from '../assets/logo.svg';
import './Chat.css';
import Aurora from '../components/Aurora';

export default function Chat() {
  return (
    <div className="chat-page">
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
        activeHref="/chat"
        baseColor="#000000"
        pillColor="#ffffff"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#000000"
      />

      <div className="chat-bg">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      <div className="chat-container glass">
        <div className="chat-header">
          <h2>Disease Symptom Chatbot</h2>
          <p className="disclaimer">Powered by HealthNexus AI. For informational purposes only.</p>
        </div>

        <div className="streamlit-embed">
          <iframe
            src="http://localhost:8501"
            title="HealthNexus AI Chat"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '12px'
            }}
          />
        </div>
      </div>
    </div>
  );
}
