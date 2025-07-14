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
import { useUI } from './contexts/UIContext';

function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUI();
  const [resolvedMode, setResolvedMode] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const updateMode = () => setResolvedMode(mq.matches ? 'dark' : 'light');
      updateMode();
      mq.addEventListener('change', updateMode);
      return () => mq.removeEventListener('change', updateMode);
    } else {
      setResolvedMode(theme);
    }
  }, [theme]);

  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: resolvedMode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  }), [resolvedMode]);

  return <ThemeProvider theme={muiTheme}><CssBaseline />{children}</ThemeProvider>;
}

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
    <AuthProvider>
      <InboxDataProvider>
        <UIProvider>
          <DynamicThemeProvider>
            <AppInitializer />
            <AppRouter />
          </DynamicThemeProvider>
        </UIProvider>
      </InboxDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
