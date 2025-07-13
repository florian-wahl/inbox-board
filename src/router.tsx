import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell/AppShell';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <AppShell />;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/onboarding" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Onboarding />} 
        />
        
        {/* Protected routes with AppShell layout */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route 
            path="/dashboard" 
            element={<Dashboard />} 
          />
          <Route 
            path="/settings" 
            element={<Settings />} 
          />
          
          {/* Default redirect for authenticated users */}
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Route>
        
        {/* Catch all - redirect to dashboard or onboarding */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/onboarding"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
