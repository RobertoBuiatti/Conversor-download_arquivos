import React, { useState } from 'react';
import ConverterForm from '../components/ConverterForm';
import DocumentRecognizerForm from '../components/DocumentRecognizerForm';

const ConverterPage = () => {
  const [activeForm, setActiveForm] = useState('converter');

  return (
    <div style={{ width: "100%" }}>
      <h1>Conversor de Arquivos</h1>
      <div style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        marginTop: "24px"
      }}>
        <button
          style={{
            background: activeForm === 'converter'
              ? 'linear-gradient(90deg, #14532d 0%, #065f46 100%)'
              : '#23262f',
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0.8rem 1.5rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
          }}
          onClick={() => setActiveForm('converter')}
        >
          Conversor de Arquivos
        </button>
        <button
          style={{
            background: activeForm === 'recognizer'
              ? 'linear-gradient(90deg, #14532d 0%, #065f46 100%)'
              : '#23262f',
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0.8rem 1.5rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
          }}
          onClick={() => setActiveForm('recognizer')}
        >
          Reconhecer Documento
        </button>
      </div>
      <div style={{ marginTop: "32px", width: "100%", display: "flex", justifyContent: "center" }}>
        {activeForm === 'converter' && <ConverterForm />}
        {activeForm === 'recognizer' && <DocumentRecognizerForm />}
      </div>
    </div>
  );
};

export default ConverterPage;
