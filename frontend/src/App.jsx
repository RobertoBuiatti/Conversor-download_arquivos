import React, { useState } from 'react';
import ConverterPage from './pages/ConverterPage';
import RemoverFundoImagemPage from './pages/RemoverFundoImagemPage';
import DocumentRecognizerForm from './components/DocumentRecognizerForm';

function App() {
  const [page, setPage] = useState('converter');

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={() => setPage('converter')}>Conversor de Arquivos</button>
        <button onClick={() => setPage('recognizer')}>Reconhecer Documento</button>
        <button onClick={() => setPage('remove-bg')}>Remover Fundo Imagem</button>
      </nav>
      {page === 'converter' && <ConverterPage />}
      {page === 'recognizer' && <DocumentRecognizerForm />}
      {page === 'remove-bg' && <RemoverFundoImagemPage />}
    </div>
  );
}

export default App;
