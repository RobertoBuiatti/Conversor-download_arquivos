import React, { useState } from 'react';
import axios from 'axios';
import styles from './DownloaderForm.module.css';

/**
 * Formulário para download de áudio/vídeo do YouTube.
 */
const DownloaderForm = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Valida URL do YouTube
  const validateUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !validateUrl(url)) {
      setResult('Informe uma URL válida do YouTube.');
      return;
    }
    if (!['mp3', 'm4a', 'mp4', 'webm'].includes(format)) {
      setResult('Formato inválido.');
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/downloader/download-audio/`,
        { url, format },
        { responseType: 'blob' }
      );
      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      setResult(downloadUrl);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        setResult(error.response.data.detail);
      } else {
        setResult('Erro ao baixar áudio/vídeo.');
      }
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
      <label>
        Formato desejado:
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option value="mp3">Áudio MP3</option>
          <option value="m4a">Áudio M4A</option>
          <option value="mp4">Vídeo MP4</option>
          <option value="webm">Vídeo WEBM</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Processando...' : 'Baixar'}
      </button>
      {result && (
        typeof result === 'string' && result.startsWith('blob:') ? (
          <a
            href={result}
            download={`youtube.${format}`}
            aria-label="Baixar arquivo YouTube"
            className={styles.downloadLink}
          >
            Baixar arquivo
          </a>
        ) : (
          <div className={styles.error} role="alert">{result}</div>
        )
      )}
    </form>
  );
};

export default DownloaderForm;
