import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell/AppShell';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

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
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<LoadingSpinner message="Loading onboarding..." />}>
                <Onboarding />
              </Suspense>
            )
          }
        />

        {/* Protected routes with AppShell layout */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
                <Settings />
              </Suspense>
            }
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
