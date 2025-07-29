// frontend/src/pages/Conversor.jsx

import React, { useState } from 'react';
import styles from '../styles/Conversor.module.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Conversor() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [pages, setPages] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = (e) => setFile(e.target.files[0]);
  const handleMultiUpload = (e) => setFiles([...e.target.files]);
  const handlePages = (e) => setPages(e.target.value);

  const sendFile = async (endpoint, body, isMulti = false) => {
    setLoading(true);
    setResultUrl('');
    try {
      const formData = new FormData();
      if (isMulti) {
        files.forEach(f => formData.append('files', f));
      } else {
        formData.append('file', file);
      }
      if (endpoint === '/pdf/remove-pages') {
        formData.append('pages', pages.split(',').map(p => Number(p.trim())));
      }
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResultUrl(data.url ? `${API_URL}${data.url}` : '');
    } catch {
      setResultUrl('Erro ao processar arquivo.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h2>Conversor de Arquivos</h2>
      <div className={styles.section}>
        <h3>Word para PDF</h3>
        <input type="file" accept=".doc,.docx" onChange={handleUpload} />
        <button onClick={() => sendFile('/convert/word-to-pdf')}>Converter</button>
      </div>
      <div className={styles.section}>
        <h3>PDF para Word</h3>
        <input type="file" accept=".pdf" onChange={handleUpload} />
        <button onClick={() => sendFile('/convert/pdf-to-word')}>Converter</button>
      </div>
      <div className={styles.section}>
        <h3>Juntar PDFs</h3>
        <input type="file" accept=".pdf" multiple onChange={handleMultiUpload} />
        <button onClick={() => sendFile('/pdf/merge', null, true)}>Juntar</button>
      </div>
      <div className={styles.section}>
        <h3>Remover páginas do PDF</h3>
        <input type="file" accept=".pdf" onChange={handleUpload} />
        <input type="text" placeholder="Ex: 1,3,5" value={pages} onChange={handlePages} />
        <button onClick={() => sendFile('/pdf/remove-pages')}>Remover</button>
      </div>
      {loading && <p>Processando...</p>}
      {resultUrl && (
        <div className={styles.result}>
          <a href={resultUrl} target="_blank" rel="noopener noreferrer">Baixar arquivo</a>
        </div>
      )}
    </div>
  );
}
