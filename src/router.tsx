import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell/AppShell';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppShell />;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <HashRouter>
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
    </HashRouter>
  );
};

export default AppRouter;
