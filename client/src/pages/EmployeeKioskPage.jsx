import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, Clock, LogIn, LogOut, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useSystem } from '../contexts/SystemContext';
import Footer from '../components/Footer';

// Helper function for API URL
const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Ensure it doesn't end with a slash
  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
};

const EmployeeKioskPage = () => {
  const { systemActive, supervisor } = useSystem();
  const [employeeCode, setEmployeeCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employee, setEmployee] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Redirigir si el sistema no está activo
  if (!systemActive) {
    return <Navigate to="/" replace />;
  }

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Limpiar formulario después de éxito
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setEmployeeCode('');
        setTotpCode('');
        setEmployee(null);
        setSuccess('');
        setError('');
        setLastAction(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autenticar empleado
      const authResponse = await fetch(`${getApiUrl()}/api/kiosk/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode, totpCode })
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Error de autenticación');
      }

      // Empleado autenticado correctamente
      setEmployee(authData.employee);
      
      // Determinar acción (checkin/checkout)
      const action = authData.employee.isCheckedIn ? 'checkout' : 'checkin';
      
      // Realizar fichaje automático
      const fichajeResponse = await fetch(`${getApiUrl()}/api/kiosk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: authData.employee.id })
      });

      const fichajeData = await fichajeResponse.json();

      if (!fichajeResponse.ok) {
        throw new Error(fichajeData.error || 'Error al fichar');
      }

      setLastAction({
        type: action,
        timestamp: new Date(),
        employee: authData.employee
      });

      setSuccess(fichajeData.message);
      
      // Limpiar formulario después de 5 segundos para permitir otro empleado
      setTimeout(() => {
        setEmployee(null);
        setSuccess('');
        setError('');
        setEmployeeCode('');
        setTotpCode('');
      }, 5000);

    } catch (err) {
      setError(err.message);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-brand-dark to-brand-deep">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-brand-accent hover:text-brand-cream transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al inicio
          </Link>
          
          <div className="text-right">
            <div className="text-2xl font-mono text-brand-cream font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-brand-accent">
              {format(currentTime, "EEEE, d MMMM yyyy")}
            </div>
            <div className="text-xs text-brand-accent/70 mt-1">
              Supervisor: {supervisor?.name}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/src/Images/logo_jarana.jpg" 
                alt="Jarana Logo" 
                className="h-16 w-16 rounded-full object-cover shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-brand-cream font-serif mb-2">
              Kiosk de Empleados
            </h1>
            <p className="text-brand-accent">
              Introduce tu código y pin de Google Authenticator para fichar
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                {lastAction?.type === 'checkin' ? 'Entrada Registrada' : 'Salida Registrada'}
              </h3>
              <p className="text-green-700 mb-3">{success}</p>
              {lastAction && (
                <div className="text-sm text-green-600">
                  <p><strong>{lastAction.employee.name}</strong></p>
                  <p>{format(lastAction.timestamp, 'HH:mm:ss - dd/MM/yyyy')}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-3">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Kiosk Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-mid/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Employee Code */}
              <div>
                <label className="block text-lg font-semibold text-neutral-dark mb-3">
                  Código de Empleado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-neutral-mid" />
                  </div>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-4 text-xl border-2 border-neutral-mid/30 rounded-xl focus:border-brand-light focus:ring-0 focus:outline-none"
                    placeholder="EMP001"
                    required
                    maxLength="10"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* TOTP Code */}
              <div>
                <label className="block text-lg font-semibold text-neutral-dark mb-3">
                  Código Google Authenticator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smartphone className="h-6 w-6 text-neutral-mid" />
                  </div>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-4 text-xl text-center tracking-widest border-2 border-neutral-mid/30 rounded-xl focus:border-brand-light focus:ring-0 focus:outline-none"
                    placeholder="123456"
                    required
                    maxLength="6"
                    autoComplete="off"
                  />
                </div>
                <p className="mt-2 text-sm text-neutral-mid text-center">
                  Introduce el código de 6 dígitos de tu app Google Authenticator
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || employeeCode.length < 3 || totpCode.length !== 6}
                className="w-full py-4 px-6 text-xl font-bold text-brand-cream bg-brand-light hover:bg-brand-medium disabled:bg-neutral-mid disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-cream mr-3"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Clock className="h-6 w-6 mr-3" />
                    Fichar
                  </>
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-8 pt-6 border-t border-neutral-mid/30">
              <h3 className="text-lg font-semibold text-neutral-dark mb-3 text-center">
                Instrucciones
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-neutral-dark">
                <div className="flex items-start">
                  <LogIn className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Entrada</p>
                    <p className="text-neutral-mid">Ficha automáticamente tu entrada al llegar</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <LogOut className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Salida</p>
                    <p className="text-neutral-mid">Ficha automáticamente tu salida al irte</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Section - Shown after successful check-in/out */}
          {employee && success && (
            <div className="max-w-md mx-auto mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ¡Fichaje Exitoso!
                </h3>
                <p className="text-green-700 mb-4">{success}</p>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Empleado:</p>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.employeeCode}</p>
                </div>

                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-green-600 mb-2">
                    ✨ Accede al <Link to="/employee-portal" className="font-medium underline">Portal del Empleado</Link> para ver tus registros, solicitar vacaciones y más
                  </p>
                  
                  <p className="text-xs text-green-500">
                    Este mensaje se cerrará automáticamente en unos segundos
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-brand-accent/60">
            <p className="text-sm">
              ¿No tienes Google Authenticator configurado? Contacta con el administrador
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EmployeeKioskPage;
