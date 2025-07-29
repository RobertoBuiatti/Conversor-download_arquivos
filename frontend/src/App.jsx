import React, { useState } from 'react';
import ConverterPage from './pages/ConverterPage';
import DownloaderPage from './pages/DownloaderPage';

function App() {
  const [page, setPage] = useState('converter');

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={() => setPage('converter')}>Conversor de Arquivos</button>
        <button onClick={() => setPage('downloader')}>Baixar Áudio do YouTube</button>
      </nav>
      {page === 'converter' && <ConverterPage />}
      {page === 'downloader' && <DownloaderPage />}
    </div>
  );
}

export default App;
