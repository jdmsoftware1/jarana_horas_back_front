import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, user } = useAuth();
  const error = searchParams.get('error');

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (user) {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const getErrorMessage = (errorCode) => {
    const errors = {
      'google_auth_failed': 'Error al autenticar con Google. Intenta de nuevo.',
      'token_generation_failed': 'Error al generar el token. Contacta al administrador.',
      'no_token': 'No se recibió el token de autenticación.',
      'unauthorized': 'Tu email no está autorizado para acceder al sistema.'
    };
    return errors[errorCode] || 'Error desconocido. Intenta de nuevo.';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-dark to-brand-deep py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        
        {/* Back Button */}
        <Link 
          to="/"
          className="inline-flex items-center text-brand-accent hover:text-brand-cream mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light rounded-full">
              <Shield className="h-8 w-8 text-brand-cream" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-brand-cream font-serif">
            Acceso Administrador
          </h2>
          <p className="mt-2 text-brand-accent">
            Inicia sesión con tu cuenta de administrador
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200 text-sm text-center">
              {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-mid/30 hover:border-brand-light hover:bg-neutral-light text-neutral-dark font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-lg">Iniciar sesión con Google</span>
          </button>

          <div className="mt-6 text-center text-sm text-neutral-mid">
            <p>Autenticación segura con Google OAuth 2.0</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <div className="bg-brand-light/10 border border-brand-accent/20 rounded-lg p-4">
            <h3 className="text-brand-cream font-medium mb-2">
              Solo para Administradores
            </h3>
            <p className="text-brand-accent/80 text-sm">
              Este acceso está restringido a usuarios con permisos de administrador. 
              Si eres empleado, usa el <Link to="/employee-kiosk" className="text-brand-light hover:underline">Kiosk de Empleados</Link>.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLoginPage;
