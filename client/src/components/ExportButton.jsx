import React from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ onClick, loading = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${className}`}
    >
      {loading ? (
        'Exportando...'
      ) : (
        <>
          <Download className="-ml-1 mr-2 h-5 w-5" />
          Exportar Datos
        </>
      )}
    </button>
  );
};

export default ExportButton;
