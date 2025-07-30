import React from 'react';
import ConverterPage from './pages/ConverterPage';

function App() {
  const page = 'converter';

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
              </nav>
      {page === 'converter' && <ConverterPage />}
    </div>
  );
}

export default App;
