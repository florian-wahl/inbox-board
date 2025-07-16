import React, { useEffect, Suspense, lazy } from 'react';
import AppRouter from './router';
import { initializeDatabase } from './db';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load heavy dependencies
const SnackbarProvider = lazy(() => import('notistack').then(module => ({ default: module.SnackbarProvider })));

function App() {
  useEffect(() => {
    // Initialize database non-blocking in the background
    const initDB = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };

    // Use requestIdleCallback for better performance on mobile
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initDB());
    } else {
      // Fallback for older browsers
      setTimeout(initDB, 100);
    }
  }, []);

  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <AppRouter />
      </SnackbarProvider>
    </Suspense>
  );
}

export default App;
