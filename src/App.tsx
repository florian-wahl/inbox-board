import React, { useEffect } from 'react';
import AppRouter from './router';
import { initializeDatabase } from './db';

function App() {
  useEffect(() => {
    // Initialize database when app starts
    initializeDatabase();
  }, []);

  return <AppRouter />;
}

export default App;
