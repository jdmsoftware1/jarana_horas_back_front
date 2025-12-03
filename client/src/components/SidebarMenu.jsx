import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar,
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Home,
  Brain,
  Shield,
  File
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarMenu = ({ isAdmin = false, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  // Menú items para empleados (rutas reales)
  const employeeMenuItems = [
    { id: 'home', icon: Home, label: 'Inicio', path: '/employee-portal' },
    { id: 'checkin', icon: Clock, label: 'Fichar', path: '/employee-portal' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendario', path: '/employee-calendar' },
    { id: 'records', icon: BarChart3, label: 'Mis Registros', path: '/employee-portal' },
    { id: 'absences', icon: Calendar, label: 'Ausencias', path: '/employee-portal' },
  ];

  // Menú items para admin (tabs)
  const adminMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'employees', icon: Users, label: 'Empleados' },
    { id: 'records', icon: Clock, label: 'Registros' },
    { id: 'weekly-schedules', icon: Calendar, label: 'Horarios Semanales' },
    { id: 'vacations', icon: Shield, label: 'Vacaciones' },
    { id: 'absence-categories', icon: FileText, label: 'Categorías Ausencias' },
    { id: 'weekly', icon: FileText, label: 'Vista Semanal' },
    { id: 'documents', icon: File, label: 'Documentos' },
    { id: 'ai-knowledge', icon: Brain, label: 'Gestión IA' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  const handleItemClick = (item) => {
    if (isAdmin && onTabChange) {
      // Para admin, cambiar tab
      onTabChange(item.id);
    } else if (item.path) {
      // Para empleados, navegar a ruta
      navigate(item.path);
    }
  };

  const isActive = (item) => {
    if (isAdmin) {
      return activeTab === item.id;
    }
    return false; // Para empleados, podrías implementar lógica de ruta activa
  };

  return (
    <div 
      className={`fixed left-0 top-0 h-screen bg-brand-dark border-r border-brand-deep shadow-2xl transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header con logo */}
      <div className="p-4 border-b border-brand-deep flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img 
              src="/images/logo_AliadaDigital.jpg" 
              alt="AliadaDigital Logo" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <span className="text-lg font-bold text-brand-cream font-serif block">
                AliadaDigital
              </span>
              <span className="text-xs text-brand-accent font-sans">
                {isAdmin ? 'Admin' : 'Portal'}
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img 
            src="/images/logo_AliadaDigital.jpg" 
            alt="AliadaDigital Logo" 
            className="h-10 w-10 rounded-full object-cover mx-auto"
          />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-brand-light text-brand-cream rounded-full p-1 shadow-lg hover:bg-brand-medium transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* User info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-brand-deep">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand-cream font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-cream truncate">
                {user.name}
              </p>
              <p className="text-xs text-brand-accent truncate">
                {user.employeeCode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 relative ${
                  active
                    ? 'bg-brand-light text-brand-cream shadow-lg'
                    : 'text-brand-accent hover:bg-brand-deep hover:text-brand-cream'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon 
                  className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'} transition-transform group-hover:scale-110`} 
                  size={20} 
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-brand-dark text-brand-cream text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-brand-deep">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-brand-dark"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-brand-deep">
        <button
          onClick={handleLogout}
          className={`group flex items-center w-full px-3 py-3 rounded-lg text-brand-accent hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 relative ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Cerrar sesión' : ''}
        >
          <LogOut 
            className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110`} 
            size={20} 
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Cerrar sesión
            </span>
          )}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-brand-dark text-brand-cream text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-brand-deep">
              Cerrar sesión
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-brand-dark"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default SidebarMenu;
