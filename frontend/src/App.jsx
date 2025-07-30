import React, { useState } from 'react';
import ConverterPage from './pages/ConverterPage';

function App() {
  const [page, setPage] = useState('converter');

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={() => setPage('converter')}>Conversor de Arquivos</button>
      </nav>
      {page === 'converter' && <ConverterPage />}
    </div>
  );
}

export default App;
