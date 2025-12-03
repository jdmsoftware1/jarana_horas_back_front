import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-dark text-brand-cream py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-sm">
            © {currentYear} <span className="font-semibold">AliadaDigital</span>. Todos los derechos reservados.
          </div>
          <div className="text-sm text-brand-medium">
            Designed by <span className="font-semibold text-brand-accent">JDMSoftware</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
