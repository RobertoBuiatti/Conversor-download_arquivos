import React, { useState, useRef } from 'react';
import styles from './ConverterForm.module.css';

/**
 * Formulário para conversão de arquivos Word/PDF.
 * Permite converter, juntar e remover páginas de PDFs.
 */
const ConverterForm = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [operation, setOperation] = useState('word-to-pdf');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const [pages, setPages] = useState('');
  const inputRef = useRef();
  const multiInputRef = useRef();

  // Valida arquivo (tipo e tamanho)
  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowedTypes.includes(file.type)) return false;
    if (file.size > maxSize) return false;
    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && !validateFile(selected)) {
      alert('Arquivo inválido ou muito grande (máx 10MB).');
      return;
    }
    setFile(selected);
  };

  const handleMultiFileChange = (e) => {
    const validFiles = Array.from(e.target.files).filter(validateFile);
    if (validFiles.length !== e.target.files.length) {
      alert('Algum arquivo é inválido ou muito grande (máx 10MB).');
    }
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleMultiDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMultiDragActive(true);
  };

  const handleMultiDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMultiDragActive(false);
  };

  const handleMultiDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMultiDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleClickInput = () => {
    inputRef.current.click();
  };

  const handleClickMultiInput = () => {
    multiInputRef.current.click();
  };

  const handleOperationChange = (e) => {
    setOperation(e.target.value);
    setResult(null);
    setFiles([]);
    setFile(null);
    setPages('');
  };

  const handlePagesChange = (e) => {
    setPages(e.target.value);
  };

  // Funções para manipular a lista de arquivos
  const moveFileUp = (idx) => {
    if (idx === 0) return;
    const newFiles = [...files];
    [newFiles[idx - 1], newFiles[idx]] = [newFiles[idx], newFiles[idx - 1]];
    setFiles(newFiles);
  };

  const moveFileDown = (idx) => {
    if (idx === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[idx], newFiles[idx + 1]] = [newFiles[idx + 1], newFiles[idx]];
    setFiles(newFiles);
  };

  const removeFile = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();

    let endpoint = '';
    switch (operation) {
      case 'word-to-pdf':
        if (!file) return setLoading(false);
        formData.append('file', file);
        endpoint = '/api/converter/word-to-pdf/';
        break;
      case 'pdf-to-word':
        if (!file) return setLoading(false);
        formData.append('file', file);
        endpoint = '/api/converter/pdf-to-word/';
        break;
      case 'merge-pdfs':
        if (!files.length) return setLoading(false);
        files.forEach(f => formData.append('file', f));
        endpoint = '/api/converter/merge-pdfs/';
        break;
      case 'remove-pdf-pages':
        if (!file) return setLoading(false);
        formData.append('file', file);
        formData.append('pages', JSON.stringify(
          pages
            .split(',')
            .map(p => parseInt(p.trim()))
            .filter(p => !isNaN(p))
        ));
        endpoint = '/api/converter/remove-pdf-pages/';
        break;
      default:
        endpoint = '';
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + endpoint, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const blob = await res.blob();
        setResult(URL.createObjectURL(blob));
      } else {
        setResult('Erro ao converter arquivo.');
      }
    } catch {
      setResult('Erro de conexão.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {operation !== 'merge-pdfs' && (
          <div
            className={`${styles.dropzone} ${dragActive ? styles.active : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickInput}
          >
            <input
              type="file"
              ref={inputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
            />
            {file ? (
              <span className={styles.filename}>{file.name}</span>
            ) : (
              <span className={styles.droptext}>
                Arraste e solte o arquivo aqui ou clique para selecionar
              </span>
            )}
          </div>
        )}
        <label className={styles.label}>
          Operação:
          <select value={operation} onChange={handleOperationChange} className={styles.select}>
            <option value="word-to-pdf">Word para PDF</option>
            <option value="pdf-to-word">PDF para Word</option>
            <option value="merge-pdfs">Juntar PDFs</option>
            <option value="remove-pdf-pages">Remover páginas do PDF</option>
          </select>
        </label>
        {operation === 'remove-pdf-pages' && (
          <label className={styles.label}>
            Páginas para remover (ex: 0,2,4):
            <input
              type="text"
              value={pages}
              onChange={handlePagesChange}
              className={styles.select}
              placeholder="Ex: 0,2,4"
            />
          </label>
        )}
        {operation === 'merge-pdfs' && (
          <>
            <div
              className={`${styles.dropzone} ${multiDragActive ? styles.active : ''}`}
              onDragOver={handleMultiDragOver}
              onDragLeave={handleMultiDragLeave}
              onDrop={handleMultiDrop}
              onClick={handleClickMultiInput}
            >
              <input
                type="file"
                ref={multiInputRef}
                style={{ display: 'none' }}
                multiple
                accept=".pdf"
                onChange={handleMultiFileChange}
              />
              <span className={styles.droptext}>
                Arraste e solte os PDFs aqui ou clique para selecionar (ordem será mantida)
              </span>
            </div>
            {files.length > 0 && (
              <div className={styles.filelist}>
                {files.map((f, idx) => (
                  <div key={idx} className={styles.fileitem}>
                    <span className={styles.filename}>{f.name}</span>
                    <button type="button" className={styles.movebtn} onClick={() => moveFileUp(idx)} disabled={idx === 0}>↑</button>
                    <button type="button" className={styles.movebtn} onClick={() => moveFileDown(idx)} disabled={idx === files.length - 1}>↓</button>
                    <button type="button" className={styles.removebtn} onClick={() => removeFile(idx)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <button
          type="submit"
          disabled={loading}
          className={styles.button}
          aria-busy={loading}
        >
          {loading ? 'Processando...' : 'Converter'}
        </button>
{result && (
  <>
    {(typeof result === 'string' && (result.startsWith('http') || result.startsWith('blob:'))) ? (
      <a href={result} download className={styles.download}>Baixar arquivo convertido</a>
    ) : (
      <div className={styles.error}>{String(result)}</div>
    )}
  </>
)}
      </form>
      {(result && (operation === 'word-to-pdf' || operation === 'remove-pdf-pages' || operation === 'merge-pdfs') && typeof result === 'string' && (result.startsWith('http') || result.startsWith('blob:'))) && (
        <div className={styles.preview}>
          <span className={styles.previewTitle}>Pré-visualização do PDF:</span>
          <iframe
            src={result}
            title="Pré-visualização PDF"
            className={styles.iframe}
            width="100%"
            height="500px"
            style={{ borderRadius: '12px', border: '2px solid #23262f', background: '#23262f' }}
            aria-label="Pré-visualização PDF"
          />
        </div>
      )}
      {(result && operation === 'pdf-to-word' && typeof result === 'string' && (result.startsWith('http') || result.startsWith('blob:'))) && (
        <div className={styles.preview}>
          <span className={styles.previewTitle}>Arquivo Word convertido:</span>
          <a href={result} download className={styles.download} aria-label="Baixar arquivo Word convertido">Baixar arquivo convertido</a>
        </div>
      )}
    </div>
  );
};

export default ConverterForm;
