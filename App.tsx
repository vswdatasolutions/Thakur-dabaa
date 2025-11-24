import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsManagementPage from './pages/hotel/RoomsManagementPage';
import BookingReservationPage from './pages/hotel/BookingReservationPage';
import BarPOSPage from './pages/bar/BarPOSPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ReportsPage from './pages/reporting/ReportsPage';
import UsersRolesPage from './pages/users/UsersRolesPage';
import SettingsPage from './pages/settings/SettingsPage';
import StaffPanelPage from './pages/staff/StaffPanelPage';
import VendorManagementPage from './pages/vendors/VendorManagementPage';
import BillingManagementPage from './pages/billing/BillingManagementPage'; // New Import
import { UserRole } from './types';

// Define a PrivateRoute component to protect routes based on authentication
interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Authenticated but no permission, redirect to dashboard or show unauthorized message
    // For simplicity, redirect to dashboard. In a real app, might show an an access denied page.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="rooms" element={<RoomsManagementPage />} />
          <Route
            path="booking"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier]}>
                <BookingReservationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="bar-pos"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier]}>
                <BarPOSPage />
              </PrivateRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager]}>
                <InventoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="billing" // New Route
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier, UserRole.CA]}>
                <BillingManagementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="reports"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.CA]}>
                <ReportsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="users"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin]}>
                <UsersRolesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="vendors"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager]}>
                <VendorManagementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="settings"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin]}>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="staff-panel"
            element={
              <PrivateRoute roles={[UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.GeneralStaff]}>
                <StaffPanelPage />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;