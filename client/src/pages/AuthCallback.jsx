import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Página de callback para Google OAuth
 * Recibe el token de la URL y lo guarda en el contexto
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      console.error('Error en autenticación:', error);
      navigate('/admin-login?error=' + error);
      return;
    }

    if (token) {
      handleGoogleCallback(token, refreshToken);
      // Redirigir directo al Admin Dashboard
      navigate('/admin-dashboard');
    } else {
      navigate('/admin-login?error=no_token');
    }
  }, [searchParams, navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-brand-medium">Autenticando con Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
