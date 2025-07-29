// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Conversor from './pages/Conversor';
import YouTubeAudio from './pages/YouTubeAudio';

export default function App() {
  return (
    <Router>
      <nav style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: '#1976d2',
        color: '#fff',
        marginBottom: '24px',
        borderRadius: '0 0 12px 12px'
      }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Conversor</Link>
        <Link to="/youtube-audio" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>YouTube Áudio</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Conversor />} />
        <Route path="/youtube-audio" element={<YouTubeAudio />} />
      </Routes>
    </Router>
  );
}
