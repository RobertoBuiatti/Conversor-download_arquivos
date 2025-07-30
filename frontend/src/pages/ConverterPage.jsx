import React from 'react';
import ConverterForm from '../components/ConverterForm';
import DocumentRecognizerForm from '../components/DocumentRecognizerForm';

const ConverterPage = () => {
  return (
    <div style={{ width: "100%" }}>
      <h1>Conversor de Arquivos</h1>
      <div style={{
        display: "flex",
        gap: "32px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        marginTop: "24px"
      }}>
        <ConverterForm />
        <DocumentRecognizerForm />
      </div>
    </div>
  );
};

export default ConverterPage;
