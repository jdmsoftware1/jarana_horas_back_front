import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Clock, User, ArrowRight, CheckCircle, Users as UsersIcon, BarChart3, Calendar, FileText, LogOut } from 'lucide-react';

/**
 * Página del Menú Principal
 * Muestra 3 opciones después del login con Google:
 * 1. Admin Dashboard - Gestionar todo el sistema
 * 2. Portal Empleado - Login con Google Authenticator (TOTP)
 * 3. Kiosk - Fichar con código + PIN
 */
const MainMenuPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin-login', { replace: true });
    window.location.reload(); // Forzar recarga para limpiar estado
  };


  return (
    <div className="min-h-screen bg-[#4A3728] flex flex-col">
      {/* Header con Logo */}
      <header className="py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/logo_jarana.jpg" 
              alt="Jarana Logo" 
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 font-serif">Jarana</h1>
          <p className="text-xl text-white/80">Sistema de Registro Horario</p>
          <p className="text-lg text-white/60 mt-4">Selecciona tu tipo de acceso para continuar</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Dashboard Supervisor - Tarjeta Grande Blanca */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex flex-col h-full">
              <div className="flex justify-center mb-6">
                <div className="bg-orange-500 p-4 rounded-full">
                  <Shield size={40} className="text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4 font-serif">
                Dashboard Supervisor
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                Accede al dashboard completo y gestiona el sistema activo
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-orange-500" />
                  <span>Sistema activo</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <UsersIcon size={20} className="text-orange-500" />
                  <span>Gestión de empleados</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <BarChart3 size={20} className="text-orange-500" />
                  <span>Reportes y analytics</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin-dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition-colors duration-300 mt-auto"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>

          {/* Fichar Entrada/Salida */}
          <div className="bg-[#5C4A3D] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group cursor-pointer"
               onClick={() => navigate('/employee-kiosk')}>
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <Clock size={32} className="text-white" />
                </div>
                <ArrowRight size={24} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 font-serif">
                Fichar<br/>Entrada/Salida
              </h2>
              
              <p className="text-white/70 text-sm mb-6">
                Registra tu asistencia de forma rápida y segura
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Shield size={16} />
                  <span>Google Authenticator</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <CheckCircle size={16} />
                  <span>Interfaz optimizada</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portal del Empleado */}
          <div className="bg-[#5C4A3D] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group cursor-pointer"
               onClick={() => navigate('/employee-portal')}>
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <User size={32} className="text-white" />
                </div>
                <ArrowRight size={24} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 font-serif">
                Portal del<br/>Empleado
              </h2>
              
              <p className="text-white/70 text-sm mb-6">
                Consulta tus registros, solicita vacaciones y más
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock size={16} />
                  <span>Historial de fichajes</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar size={16} />
                  <span>Gestión de vacaciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info y Logout */}
        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm mb-4">
            Sesión iniciada como: <span className="text-white font-semibold">{user?.email}</span><br/>
            Rol: <span className="text-white font-semibold">{user?.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>¿Problemas de acceso? Contacta con el administrador del sistema</p>
        </div>
      </main>
    </div>
  );
};

export default MainMenuPage;
