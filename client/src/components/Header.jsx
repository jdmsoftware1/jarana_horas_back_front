import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-brand-dark shadow-lg border-b border-brand-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="/images/logo_jarana.jpg" 
              alt="Logo" 
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-brand-cream font-serif">
                {import.meta.env.VITE_COMPANY_NAME || 'Jarana'}
              </h1>
              <p className="text-sm text-brand-accent">
                Sistema de Registro Horario
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
