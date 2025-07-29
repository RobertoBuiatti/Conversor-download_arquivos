import React, { useState } from 'react';
import styles from './ConverterForm.module.css';

const ConverterForm = () => {
  const [file, setFile] = useState(null);
  const [operation, setOperation] = useState('word-to-pdf');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOperationChange = (e) => {
    setOperation(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '';
    switch (operation) {
      case 'word-to-pdf':
        endpoint = '/api/converter/word-to-pdf/';
        break;
      case 'pdf-to-word':
        endpoint = '/api/converter/pdf-to-word/';
        break;
      case 'merge-pdfs':
        endpoint = '/api/converter/merge-pdfs/';
        break;
      case 'remove-pdf-pages':
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Selecione o arquivo:
        <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
      </label>
      <label>
        Operação:
        <select value={operation} onChange={handleOperationChange}>
          <option value="word-to-pdf">Word para PDF</option>
          <option value="pdf-to-word">PDF para Word</option>
          <option value="merge-pdfs">Juntar PDFs</option>
          <option value="remove-pdf-pages">Remover páginas do PDF</option>
        </select>
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Processando...' : 'Converter'}
      </button>
      {result && (
        typeof result === 'string' && result.startsWith('http') ? (
          <a href={result} download>Baixar arquivo convertido</a>
        ) : (
          <div className={styles.error}>{result}</div>
        )
      )}
    </form>
  );
};

export default ConverterForm;
