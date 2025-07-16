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
import { SnackbarProvider } from 'notistack';

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
        main: '#2E71FF',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      // Increase base font size for better mobile readability
      fontSize: 16,
      h1: {
        fontSize: '2.5rem',
        '@media (max-width:600px)': {
          fontSize: '2rem',
        },
      },
      h2: {
        fontSize: '2rem',
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h3: {
        fontSize: '1.75rem',
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        '@media (max-width:600px)': {
          fontSize: '1.25rem',
        },
      },
      h5: {
        fontSize: '1.25rem',
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      h6: {
        fontSize: '1.125rem',
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
      },
      body1: {
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
      },
      subtitle1: {
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      subtitle2: {
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
      },
      caption: {
        fontSize: '0.75rem',
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      button: {
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
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

// GitHub Pages SPA redirect workaround
const params = new URLSearchParams(window.location.search);
const redirect = params.get('redirect');
if (redirect) {
  window.history.replaceState({}, '', '/inbox-board' + redirect);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
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
    </SnackbarProvider>
  </React.StrictMode>
);
