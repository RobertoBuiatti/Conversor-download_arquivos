import React, { useState } from 'react';
import styles from './DownloaderForm.module.css';

/**
 * Formulário simplificado sem download do YouTube.
 */
const DownloaderForm = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp3');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Nenhuma ação de download será realizada
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
      <button type="submit">
        Baixar
      </button>
    </form>
  );
};

export default DownloaderForm;
