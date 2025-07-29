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
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Valida URL do YouTube
  const validateUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  // Busca preview ao digitar URL válida
  React.useEffect(() => {
    if (!url || !validateUrl(url)) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    axios.post(
      `${import.meta.env.VITE_API_URL}/api/downloader/preview/`,
      { url }
    )
      .then(res => {
        setPreview(res.data);
        setPreviewError(null);
      })
      .catch(err => {
        setPreview(null);
        if (err.response && err.response.data && err.response.data.detail) {
          setPreviewError(err.response.data.detail);
        } else {
          setPreviewError('Erro ao obter preview.');
        }
      })
      .finally(() => setPreviewLoading(false));
  }, [url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !validateUrl(url)) {
      setResult('Informe uma URL válida do YouTube.');
      return;
    }
    if (!preview) {
      setResult('Preview não disponível. Verifique a URL ou tente novamente.');
      return;
    }
    if (!['mp3', 'm4a', 'mp4', 'webm'].includes(format)) {
      setResult('Formato inválido.');
      return;
    }
    setLoading(true);
    setResult(null);
    setProgress(0);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/downloader/download-audio/`,
        { url, format },
        {
          responseType: 'blob',
          onDownloadProgress: (evt) => {
            if (evt.lengthComputable) {
              setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          }
        }
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
    setProgress(0);
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
      {previewLoading && <div className={styles.loading}>Carregando preview...</div>}
      {previewError && <div className={styles.error}>{previewError}</div>}
      {preview && (
        <div className={styles.preview}>
          <img src={preview.thumbnail} alt="Thumbnail" className={styles.thumbnail} />
          <div className={styles.meta}>
            <strong>{preview.title}</strong>
            <div>Duração: {preview.duration ? `${Math.floor(preview.duration / 60)}m ${preview.duration % 60}s` : 'N/A'}</div>
            <div>Canal: {preview.uploader}</div>
            {preview.is_live && <div className={styles.live}>🔴 Ao vivo</div>}
            {preview.age_limit && <div>Restrição de idade: {preview.age_limit}+</div>}
            {preview.restrictions && (
              <div>
                {preview.restrictions.region_restricted && <div>Restrito por região</div>}
                {preview.restrictions.availability && <div>Disponibilidade: {preview.restrictions.availability}</div>}
                {preview.restrictions.license && <div>Licença: {preview.restrictions.license}</div>}
              </div>
            )}
          </div>
        </div>
      )}
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
        disabled={loading || !preview}
        aria-busy={loading}
      >
        {loading ? 'Processando...' : 'Baixar'}
      </button>
      {loading && (
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <span className={styles.progressText}>{progress}%</span>
        </div>
      )}
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
