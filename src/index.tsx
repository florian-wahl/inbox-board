import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { InboxDataProvider } from './contexts/InboxDataContext';
import { UIProvider } from './contexts/UIContext';
import AppRouter from './router';
import { useAuth } from './contexts/AuthContext';
import { useInboxData } from './contexts/InboxDataContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppInitializer() {
  const { isAuthenticated, accessToken } = useAuth();
  const { reload } = useInboxData();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      (async () => {
        await reload();
      })();
    }
  }, [isAuthenticated, accessToken, reload]);

  return null;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <InboxDataProvider>
          <UIProvider>
            <AppInitializer />
            <AppRouter />
          </UIProvider>
        </InboxDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
