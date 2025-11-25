import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeKioskPage from './pages/EmployeeKioskPage';
import EmployeePortal from './pages/EmployeePortal';
import AuthCallback from './pages/AuthCallback';
import CalendarPage from './pages/employee/CalendarPage';
import LoadingSpinner from './components/LoadingSpinner';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Verificar si el usuario tiene el rol requerido
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected Routes - Requiere login con Google */}
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Public Routes - No requieren autenticación */}
      <Route path="/employee-kiosk" element={<EmployeeKioskPage />} />
      <Route path="/employee-portal" element={<EmployeePortal />} />
      <Route path="/employee-calendar" element={<CalendarPage />} />
      
      {/* 404 */}
      <Route 
        path="*" 
        element={
          <div className="flex items-center justify-center min-h-screen bg-neutral-light">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-neutral-dark mb-4 font-serif">404</h1>
              <p className="text-brand-medium mb-8">Página no encontrada</p>
              <Navigate to="/" replace />
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
