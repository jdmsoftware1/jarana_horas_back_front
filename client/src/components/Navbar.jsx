import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <nav className="bg-brand-dark shadow-lg border-b border-brand-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/images/logo_jarana.jpg" 
                alt="Jarana Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="ml-3 text-xl font-bold text-brand-cream font-serif">
                Jarana
              </span>
              <span className="ml-2 text-sm text-brand-accent font-sans">
                Registro Horario
              </span>
            </div>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/checkin"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/checkin')
                    ? 'border-brand-light text-brand-cream'
                    : 'border-transparent text-brand-accent hover:text-brand-cream hover:border-brand-accent'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Fichar
              </Link>
              
              <Link
                to="/records"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/records')
                    ? 'border-brand-light text-brand-cream'
                    : 'border-transparent text-brand-accent hover:text-brand-cream hover:border-brand-accent'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Mis Registros
              </Link>
              
              {isAdmin() && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin')
                      ? 'border-brand-light text-brand-cream'
                      : 'border-transparent text-brand-accent hover:text-brand-cream hover:border-brand-accent'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Administración
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-brand-cream">
              <span className="font-medium">{user?.name}</span>
              <span className="text-brand-accent ml-2">({user?.employeeCode})</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-brand-accent hover:text-brand-cream focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/checkin"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/checkin')
                ? 'bg-brand-light/10 border-brand-light text-brand-cream'
                : 'border-transparent text-brand-accent hover:text-brand-cream hover:bg-brand-dark/50 hover:border-brand-accent'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Fichar
          </Link>
          
          <Link
            to="/records"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/records')
                ? 'bg-brand-light/10 border-brand-light text-brand-cream'
                : 'border-transparent text-brand-accent hover:text-brand-cream hover:bg-brand-dark/50 hover:border-brand-accent'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Mis Registros
          </Link>
          
          {isAdmin() && (
            <Link
              to="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/admin')
                  ? 'bg-brand-light/10 border-brand-light text-brand-cream'
                  : 'border-transparent text-brand-accent hover:text-brand-cream hover:bg-brand-dark/50 hover:border-brand-accent'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Administración
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
