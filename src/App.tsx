import React, { useEffect } from 'react';
import AppRouter from './router';
import { initializeDatabase } from './db';
import { SnackbarProvider } from 'notistack';

function App() {
  useEffect(() => {
    // Initialize database when app starts
    initializeDatabase();
  }, []);

  return (
    <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <AppRouter />
    </SnackbarProvider>
  );
}

export default App;
