import React, { useState } from 'react';
import styles from './DownloaderForm.module.css';

const DownloaderForm = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/downloader/download-audio/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const blob = await res.blob();
        setResult(URL.createObjectURL(blob));
      } else {
        setResult('Erro ao baixar áudio.');
      }
    } catch {
      setResult('Erro de conexão.');
    }
    setLoading(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Link do vídeo do YouTube:
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Processando...' : 'Baixar Áudio'}
      </button>
      {result && (
        typeof result === 'string' && result.startsWith('http') ? (
          <a href={result} download>Baixar áudio</a>
        ) : (
          <div className={styles.error}>{result}</div>
        )
      )}
    </form>
  );
};

export default DownloaderForm;
