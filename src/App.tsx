import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { InboxDataProvider } from './contexts/InboxDataContext';
import { UIProvider } from './contexts/UIContext';
import AppShell from './components/AppShell/AppShell';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <InboxDataProvider>
          <UIProvider>
            <Router>
              <AppShell />
            </Router>
          </UIProvider>
        </InboxDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
