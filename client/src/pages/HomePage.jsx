import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Clock, 
  Tablet,
  User,
  Calendar
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import Footer from '../components/Footer';

const HomePage = () => {
  const { systemActive, supervisor, getSessionDuration } = useSystem();
  const sessionDuration = getSessionDuration();

  return (
    <div className="flex-1 bg-gradient-to-br from-brand-dark to-brand-deep">
      <div className="container mx-auto px-4 py-16">
        
        {/* System Status Bar */}
        {systemActive && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between text-brand-cream">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="font-medium">Sistema Activo</span>
                </div>
                <div className="text-right text-sm">
                  <p>Supervisor: <span className="font-medium">{supervisor?.name}</span></p>
                  <p>Sesión: {sessionDuration?.total || '0h 0m'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/logo_jarana.jpg" 
              alt="Jarana Logo" 
              className="h-24 w-24 rounded-full object-cover shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold text-brand-cream font-serif mb-4">
            Jarana
          </h1>
          <h2 className="text-2xl text-brand-accent mb-2">
            Sistema de Registro Horario
          </h2>
          <p className="text-brand-accent/80 max-w-2xl mx-auto">
            Selecciona tu tipo de acceso para continuar
          </p>
        </div>

        {/* Access Options */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* Supervisor Access - Always available */}
          <Link 
            to={systemActive ? "/admin-dashboard" : "/admin-login"}
            className="group bg-white rounded-2xl p-8 shadow-2xl border border-neutral-mid/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-2"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light rounded-full mb-6 group-hover:bg-brand-medium transition-colors">
                <Shield className="h-8 w-8 text-brand-cream" />
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-dark font-serif mb-3">
                {systemActive ? 'Dashboard Supervisor' : 'Activar Sistema'}
              </h3>
              
              <p className="text-brand-medium mb-6">
                {systemActive 
                  ? 'Accede al dashboard completo y gestiona el sistema activo'
                  : 'Inicia sesión como supervisor para activar el sistema del día'
                }
              </p>
              
              <div className="space-y-2 text-sm text-neutral-dark">
                <div className="flex items-center justify-center">
                  <Shield className="h-4 w-4 mr-2 text-brand-light" />
                  <span>{systemActive ? 'Sistema activo' : 'Activar sistema'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Users className="h-4 w-4 mr-2 text-brand-light" />
                  <span>Gestión de empleados</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2 text-brand-light" />
                  <span>Reportes y analytics</span>
                </div>
              </div>
              
              <div className="mt-6 px-6 py-3 bg-brand-light text-brand-cream rounded-lg font-medium group-hover:bg-brand-medium transition-colors">
                {systemActive ? 'Ir al Dashboard' : 'Iniciar Sesión'}
              </div>
            </div>
          </Link>

          {/* Employee Options - Only when system is active */}
          {systemActive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link
                to="/employee-kiosk"
                className="group relative bg-white/10 backdrop-blur-sm border border-brand-accent/30 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-12 w-12 text-brand-accent group-hover:text-brand-cream transition-colors" />
                  <ArrowRight className="h-6 w-6 text-brand-accent/60 group-hover:text-brand-cream group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold text-brand-cream mb-2">
                  Fichar Entrada/Salida
                </h3>
                <p className="text-brand-accent/80 text-sm mb-4">
                  Registra tu asistencia de forma rápida y segura
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-brand-accent" />
                    <span className="text-sm text-brand-accent">Google Authenticator</span>
                  </div>
                  <div className="flex items-center">
                    <Tablet className="h-4 w-4 mr-2 text-brand-accent" />
                    <span className="text-sm text-brand-accent">Interfaz optimizada</span>
                  </div>
                </div>
              </Link>

              <Link
                to="/employee-portal"
                className="group relative bg-white/10 backdrop-blur-sm border border-brand-accent/30 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <User className="h-12 w-12 text-brand-accent group-hover:text-brand-cream transition-colors" />
                  <ArrowRight className="h-6 w-6 text-brand-accent/60 group-hover:text-brand-cream group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold text-brand-cream mb-2">
                  Portal del Empleado
                </h3>
                <p className="text-brand-accent/80 text-sm mb-4">
                  Consulta tus registros, solicita vacaciones y más
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-brand-accent" />
                    <span className="text-sm text-brand-accent">Historial de fichajes</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-brand-accent" />
                    <span className="text-sm text-brand-accent">Gestión de vacaciones</span>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-neutral-mid/20 opacity-60">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-mid rounded-full mb-6">
                  <Tablet className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-neutral-dark font-serif mb-3">
                  Kiosk Empleados
                </h3>
                
                <p className="text-brand-medium mb-6">
                  El kiosk estará disponible cuando el supervisor active el sistema
                </p>
                
                <div className="mt-6 px-6 py-3 bg-neutral-mid text-white rounded-lg font-medium">
                  Sistema Inactivo
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-16 text-brand-accent/60">
          <p className="text-sm">
            ¿Problemas de acceso? Contacta con el administrador del sistema
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;
