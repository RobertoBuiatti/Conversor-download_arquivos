// frontend/src/pages/YouTubeAudio.jsx

import React, { useState } from 'react';
import styles from '../styles/YouTubeAudio.module.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function YouTubeAudio() {
  const [url, setUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setResultUrl('');
    try {
      const res = await fetch(`${API_URL}/youtube/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResultUrl(data.url ? `${API_URL}${data.url}` : 'Erro ao baixar áudio.');
    } catch {
      setResultUrl('Erro ao baixar áudio.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h2>Baixar Áudio do YouTube</h2>
      <input
        type="text"
        placeholder="Cole o link do vídeo"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className={styles.input}
      />
      <button onClick={handleDownload} className={styles.button}>Baixar Áudio</button>
      {loading && <p>Processando...</p>}
      {resultUrl && (
        <div className={styles.result}>
          <a href={resultUrl} target="_blank" rel="noopener noreferrer">Baixar arquivo</a>
        </div>
      )}
    </div>
  );
}
