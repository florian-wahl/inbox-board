import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { InboxDataProvider } from './contexts/InboxDataContext';
import { UIProvider } from './contexts/UIContext';
import AppRouter from './router';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <InboxDataProvider>
        <AuthProvider>
          <UIProvider>
            <AppRouter />
          </UIProvider>
        </AuthProvider>
      </InboxDataProvider>
    </ThemeProvider>
  </React.StrictMode>
);
