const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Si es 401 (Unauthorized), limpiar sesión y redirigir al login
    if (response.status === 401) {
      console.warn('⚠️ Sesión expirada o no autorizado. Redirigiendo al login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mostrar mensaje al usuario
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      
      // Redirigir al login
      window.location.href = '/login';
      
      throw new ApiError(
        'Sesión expirada',
        response.status,
        data
      );
    }
    
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data
    );
  }
  
  return data;
};

const api = {
  // Auth endpoints
  login: async (employeeCode, pin) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeCode, pin }),
    });
    return handleResponse(response);
  },

  loginWithTotp: async (employeeCode, totpCode) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/totp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeCode, totpCode }),
    });
    return handleResponse(response);
  },

  verifyToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Records endpoints
  checkin: async (device = 'web', location = null, notes = '') => {
    const response = await fetch(`${API_BASE_URL}/records/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ device, location, notes }),
    });
    return handleResponse(response);
  },

  checkout: async (device = 'web', location = null, notes = '') => {
    const response = await fetch(`${API_BASE_URL}/records/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ device, location, notes }),
    });
    return handleResponse(response);
  },

  getRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/records?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/records/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Admin endpoints
  getAllRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/records/all?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/records/analytics?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getEmployees: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createEmployee: async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  },

  updateEmployee: async (id, employeeData) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  },

  deleteEmployee: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  regenerateTotp: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}/regenerate-totp`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export { api, ApiError };
