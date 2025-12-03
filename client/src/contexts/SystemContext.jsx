import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SystemContext = createContext();

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};

export const SystemProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [systemActive, setSystemActive] = useState(false);
  const [supervisor, setSupervisor] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Verificar si hay una sesión activa guardada
  useEffect(() => {
    const savedSession = localStorage.getItem('AliadaDigital_system_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = new Date();
      const sessionDate = new Date(session.date);
      
      // Verificar si es el mismo día
      if (
        sessionDate.toDateString() === now.toDateString() &&
        session.active
      ) {
        setSystemActive(true);
        setSupervisor(session.supervisor);
        setSessionStartTime(new Date(session.startTime));
      } else {
        // Limpiar sesión expirada
        localStorage.removeItem('AliadaDigital_system_session');
      }
    }
  }, []);

  // Activar sistema cuando el supervisor se loguea
  useEffect(() => {
    if (!loading && user) {
      // Activar sistema para cualquier usuario logueado (asumimos que es supervisor)
      activateSystem({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'admin'
      });
    }
  }, [user, loading]);

  const activateSystem = (supervisorData) => {
    const sessionData = {
      active: true,
      supervisor: supervisorData,
      startTime: new Date().toISOString(),
      date: new Date().toISOString(),
    };

    setSystemActive(true);
    setSupervisor(supervisorData);
    setSessionStartTime(new Date());
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('AliadaDigital_system_session', JSON.stringify(sessionData));
  };

  const deactivateSystem = () => {
    setSystemActive(false);
    setSupervisor(null);
    setSessionStartTime(null);
    
    // Limpiar localStorage
    localStorage.removeItem('AliadaDigital_system_session');
    
    console.log('🔴 Sistema desactivado');
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return null;
    
    const now = new Date();
    const diff = now - sessionStartTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, total: `${hours}h ${minutes}m` };
  };

  const value = {
    systemActive,
    supervisor,
    sessionStartTime,
    activateSystem,
    deactivateSystem,
    getSessionDuration,
    isLoaded: !loading
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};
