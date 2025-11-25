import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Calendar, 
  FileText, 
  MessageCircle,
  LogOut,
  LogIn,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  Upload,
  Eye,
  Trash2,
  File,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeCalendar from '../components/EmployeeCalendar';

// Helper para obtener API URL
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

// Helper para fetch autenticado con token de empleado
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('employeeToken');
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Si es 401 (Unauthorized), limpiar sesión y redirigir al login
  if (response.status === 401) {
    console.warn('⚠️ Sesión expirada o no autorizado. Redirigiendo al login...');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
    
    // Mostrar mensaje al usuario
    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    
    // Redirigir al login de empleado
    window.location.href = '/employee-kiosk';
  }
  
  return response;
};

const EmployeePortal = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [employeeCode, setEmployeeCode] = useState('EMP');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadDocumentsCount, setUnreadDocumentsCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authenticate employee
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      console.log('Authenticating employee:', employeeCode.toUpperCase());
      const response = await fetch(`${getApiUrl()}/auth/login/totp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeCode: employeeCode.toUpperCase(), 
          totpCode: authCode 
        })
      });

      const data = await response.json();
      console.log('Auth response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      // Guardar token para futuras peticiones
      if (data.token) {
        localStorage.setItem('employeeToken', data.token);
      }

      setEmployee(data.employee);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar contador de documentos no leídos
  const loadUnreadDocumentsCount = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/documents/admin-to-employee/my-documents`);
      if (response.ok) {
        const documents = await response.json();
        const unreadCount = documents.filter(doc => !doc.readAt).length;
        setUnreadDocumentsCount(unreadCount);
      }
    } catch (error) {
      console.error('Error loading unread documents count:', error);
    }
  };

  // Cargar contador al autenticarse y periódicamente
  useEffect(() => {
    if (isAuthenticated && employee) {
      loadUnreadDocumentsCount();
      // Actualizar cada 30 segundos
      const interval = setInterval(loadUnreadDocumentsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, employee]);

  const handleLogout = () => {
    setEmployee(null);
    setIsAuthenticated(false);
    setEmployeeCode('EMP');
    setAuthCode('');
    setActiveTab('dashboard');
    setUnreadDocumentsCount(0);
  };

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-deep flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <Link 
                to="/"
                className="inline-flex items-center text-brand-accent hover:text-brand-cream transition-colors mb-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al inicio
              </Link>
              
              <h1 className="text-3xl font-bold text-brand-cream mb-2">
                Portal del Empleado
              </h1>
              <p className="text-brand-accent">
                Accede a tu información personal y gestiona tus solicitudes
              </p>
            </div>

            {/* Auth Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleAuth} className="space-y-6">
                {/* Employee Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Empleado
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent"
                      placeholder="EMP001"
                      required
                      maxLength="10"
                    />
                  </div>
                </div>

                {/* TOTP Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Google Authenticator
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent text-center tracking-widest"
                      placeholder="123456"
                      required
                      maxLength="6"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700 text-sm">{authError}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-light hover:bg-brand-medium text-brand-cream font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-cream mr-2"></div>
                      Verificando...
                    </div>
                  ) : (
                    'Acceder al Portal'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Main portal interface - Sidebar menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'records', label: 'Mis Fichajes', icon: Clock },
    { id: 'vacations', label: 'Vacaciones', icon: MessageCircle },
    { id: 'documents', label: 'Documentos', icon: File },
    { id: 'reports', label: 'Reportes', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-neutral-light flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-neutral-mid/20 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-mid/20">
          {!isSidebarCollapsed && (
            <h2 className="text-lg font-semibold text-brand-dark">Portal</h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 text-brand-medium" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-brand-medium" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge = item.id === 'documents' && unreadDocumentsCount > 0;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-light text-white'
                    : 'text-brand-medium hover:bg-neutral-light hover:text-brand-dark'
                }`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <Icon className={`h-5 w-5 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadDocumentsCount}
                      </span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && showBadge && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-neutral-mid/20 p-4">
          {!isSidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-white font-semibold">
                  {employee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-dark truncate">{employee.name}</p>
                  <p className="text-xs text-brand-medium truncate">{employee.employeeCode}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5 mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-neutral-mid/20 h-16 flex items-center px-6">
          <Link 
            to="/"
            className="text-brand-medium hover:text-brand-dark transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-neutral-dark">
            {menuItems.find(item => item.id === activeTab)?.label || 'Portal del Empleado'}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardContent employee={employee} setActiveTab={setActiveTab} />}
            {activeTab === 'calendar' && <EmployeeCalendar employee={employee} />}
            {activeTab === 'records' && <RecordsContent employee={employee} />}
            {activeTab === 'vacations' && <VacationsContent employee={employee} />}
            {activeTab === 'documents' && <DocumentsContent employee={employee} onDocumentRead={loadUnreadDocumentsCount} />}
            {activeTab === 'reports' && <ReportsContent employee={employee} />}
          </div>
        </main>

        <Footer />
      </div>
      
      {/* AI Chat */}
      <AIChat userId={employee.id} userRole="employee" />
    </div>
  );
};

// Dashboard Content
const DashboardContent = ({ employee, setActiveTab }) => {
  const [stats, setStats] = useState({
    todayStatus: null,
    weekHours: 0,
    monthHours: 0,
    pendingVacations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [employee.id]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch recent records to calculate stats
      const recordsResponse = await fetch(`${getApiUrl()}/records/employee/${employee.id}`);
      const vacationsResponse = await fetch(`${getApiUrl()}/vacations/employee/${employee.id}`);
      
      if (recordsResponse.ok) {
        const records = await recordsResponse.json();
        console.log('All records fetched:', records.length, records);
        
        // Calculate today's status
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        const todayRecords = records.filter(r => {
          const recordDate = new Date(r.timestamp);
          return recordDate >= todayStart && recordDate <= todayEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log('Today records found:', todayRecords.length, todayRecords);
        
        let todayStatus = 'not_started';
        if (todayRecords.length > 0) {
          const lastRecord = todayRecords[todayRecords.length - 1];
          const checkins = todayRecords.filter(r => r.type === 'checkin');
          const checkouts = todayRecords.filter(r => r.type === 'checkout');
          
          // If more checkins than checkouts, user is checked in
          if (checkins.length > checkouts.length) {
            todayStatus = 'checked_in';
          } else if (checkouts.length > 0) {
            todayStatus = 'checked_out';
          }
        }
        
        // Calculate week hours (simplified)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekRecords = records.filter(r => 
          new Date(r.timestamp) >= weekStart
        );
        const weekHours = Math.floor(weekRecords.length / 2) * 8; // Simplified calculation
        
        setStats(prev => ({
          ...prev,
          todayStatus,
          weekHours,
          monthHours: weekHours * 4 // Simplified
        }));
      }

      if (vacationsResponse.ok) {
        const vacations = await vacationsResponse.json();
        const pendingVacations = vacations.filter(v => v.status === 'pending').length;
        
        setStats(prev => ({
          ...prev,
          pendingVacations
        }));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'checked_in': return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'checked_out': return <XCircle className="h-8 w-8 text-red-500" />;
      default: return <Clock className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'checked_in': return 'Fichado (Dentro)';
      case 'checked_out': return 'Fichado (Fuera)';
      default: return 'Sin fichar hoy';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-dark mb-6">
          Bienvenido, {employee.name}
        </h2>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today Status */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <div className="flex items-center">
              {getStatusIcon(stats.todayStatus)}
              <div className="ml-4">
                <p className="text-sm font-medium text-brand-medium">Estado Hoy</p>
                <p className="text-lg font-semibold text-neutral-dark">
                  {getStatusText(stats.todayStatus)}
                </p>
              </div>
            </div>
          </div>

          {/* Week Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brand-medium">Horas Semana</p>
                <p className="text-2xl font-semibold text-neutral-dark">{stats.weekHours}h</p>
              </div>
            </div>
          </div>

          {/* Month Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brand-medium">Horas Mes</p>
                <p className="text-2xl font-semibold text-neutral-dark">{stats.monthHours}h</p>
              </div>
            </div>
          </div>

          {/* Pending Vacations */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-500 rounded-lg p-3">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brand-medium">Vacaciones Pendientes</p>
                <p className="text-2xl font-semibold text-neutral-dark">{stats.pendingVacations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/employee-kiosk"
              className="flex items-center p-4 bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors"
            >
              <Clock className="h-8 w-8 text-brand-light mr-3" />
              <div>
                <p className="font-medium text-neutral-dark">Fichar Entrada/Salida</p>
                <p className="text-sm text-brand-medium">Registrar asistencia</p>
              </div>
            </Link>
            
            <button 
              onClick={() => setActiveTab('vacations')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Plus className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-neutral-dark">Solicitar Vacaciones</p>
                <p className="text-sm text-green-600">Nueva solicitud</p>
              </div>
            </button>
            
            <button 
              onClick={() => {
                const chatButton = document.querySelector('[data-ai-chat-button]');
                if (chatButton) chatButton.click();
              }}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-neutral-dark">Chat con IA</p>
                <p className="text-sm text-blue-600">Consultas y solicitudes</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Records Content
const RecordsContent = ({ employee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [viewMode, setViewMode] = useState('grouped'); // grouped, list
  const [page, setPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetchRecords();
  }, [employee.id, filter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      console.log('Fetching records for employee:', employee.id);
      const response = await fetch(`${getApiUrl()}/records/employee/${employee.id}`);
      console.log('Records response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Records data received:', data.length, data);
        setRecords(filterRecords(data));
      } else {
        console.error('Failed to fetch records:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'today':
        return data.filter(record => new Date(record.timestamp) >= today);
      case 'week':
        return data.filter(record => new Date(record.timestamp) >= weekStart);
      case 'month':
        return data.filter(record => new Date(record.timestamp) >= monthStart);
      default:
        return data;
    }
  };

  const formatDateTime = (timestamp) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getTypeIcon = (type) => {
    return type === 'checkin' ? 
      <LogIn className="h-4 w-4 text-green-600" /> : 
      <LogOut className="h-4 w-4 text-red-600" />;
  };

  const getTypeText = (type) => {
    return type === 'checkin' ? 'Entrada' : 'Salida';
  };

  const getTypeColor = (type) => {
    return type === 'checkin' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
  };

  // Group records by day
  const groupRecordsByDay = (records) => {
    const grouped = {};
    
    records.forEach(record => {
      const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    // Sort records within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });

    return grouped;
  };

  const calculateWorkHours = (dayRecords) => {
    const checkins = dayRecords.filter(r => r.type === 'checkin');
    const checkouts = dayRecords.filter(r => r.type === 'checkout');
    
    let totalMinutes = 0;
    const pairs = Math.min(checkins.length, checkouts.length);
    
    for (let i = 0; i < pairs; i++) {
      const start = new Date(checkins[i].timestamp);
      const end = new Date(checkouts[i].timestamp);
      totalMinutes += (end - start) / (1000 * 60);
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const groupedRecords = groupRecordsByDay(records);
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a));

  // Pagination
  const totalPages = viewMode === 'grouped' 
    ? Math.ceil(sortedDates.length / recordsPerPage)
    : Math.ceil(records.length / recordsPerPage);
  const startIndex = (page - 1) * recordsPerPage;
  const paginatedRecords = records.slice(startIndex, startIndex + recordsPerPage);
  const paginatedDates = sortedDates.slice(startIndex, startIndex + recordsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-dark">Mis Fichajes</h2>
        
        <div className="flex items-center space-x-4 flex-wrap">
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          >
            <option value="grouped">Vista Resumen</option>
            <option value="list">Vista Lista</option>
          </select>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          >
            <option value="all">Todos los registros</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
          
          <button
            onClick={fetchRecords}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Records Display */}
      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-12 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay registros para el período seleccionado</p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* Grouped View by Day */
        <div className="space-y-4">
          {paginatedDates.map(date => {
            const dayRecords = groupedRecords[date];
            const checkins = dayRecords.filter(r => r.type === 'checkin');
            const checkouts = dayRecords.filter(r => r.type === 'checkout');
            
            return (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-brand-light to-brand-medium px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-cream">
                        {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </h3>
                      <p className="text-sm text-brand-cream/80 mt-1">
                        {checkins.length} entrada(s) • {checkouts.length} salida(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-brand-cream/80">Horas trabajadas</div>
                      <div className="text-2xl font-bold text-brand-cream">
                        {calculateWorkHours(dayRecords)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Timeline */}
                <div className="p-6">
                  <div className="space-y-3">
                    {dayRecords.map((record, idx) => {
                      const time = format(new Date(record.timestamp), 'HH:mm');
                      const isCheckin = record.type === 'checkin';
                      
                      return (
                        <div key={record.id} className="flex items-start space-x-4">
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCheckin ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isCheckin ? (
                                <LogIn className="h-5 w-5 text-green-600" />
                              ) : (
                                <LogOut className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            {idx < dayRecords.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
                            )}
                          </div>

                          {/* Record details */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  isCheckin ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                  {isCheckin ? '🟢 Entrada' : '🔴 Salida'}
                                </span>
                                <span className="ml-3 text-2xl font-bold text-neutral-dark">
                                  {time}
                                </span>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                {record.device || 'Kiosk Web'}
                              </div>
                            </div>
                            {record.notes && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                💬 {record.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Original Table) */
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispositivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(record.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(record.type)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(record.type)}`}>
                          {getTypeText(record.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.device || 'Kiosk Web'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination for List View */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + recordsPerPage, records.length)} de {records.length} registros
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm bg-brand-light text-brand-cream rounded-md">
                  {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination for Grouped View */}
      {viewMode === 'grouped' && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(startIndex + recordsPerPage, sortedDates.length)} de {sortedDates.length} días
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm bg-brand-light text-brand-cream rounded-md">
              {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Vacations Content
const VacationsContent = ({ employee }) => {
  const [vacations, setVacations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVacation, setNewVacation] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    reason: ''
  });

  useEffect(() => {
    fetchVacations();
    fetchCategories();
  }, [employee.id]);

  const fetchVacations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/vacations/employee/${employee.id}`);
      if (response.ok) {
        const data = await response.json();
        setVacations(data);
      }
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/absence-categories/active`);
      if (response.ok) {
        const data = await response.json();
        console.log('Categorías cargadas:', data);
        setCategories(data);
        // Establecer la primera categoría como default si existe
        if (data.length > 0 && !newVacation.categoryId) {
          setNewVacation(prev => ({ ...prev, categoryId: data[0].id }));
        }
      } else {
        console.error('Error al cargar categorías:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmitVacation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getApiUrl()}/vacations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVacation,
          employeeId: employee.id
        })
      });

      if (response.ok) {
        setShowNewForm(false);
        setNewVacation({ 
          startDate: '', 
          endDate: '', 
          categoryId: categories.length > 0 ? categories[0].id : '', 
          reason: '' 
        });
        fetchVacations();
      }
    } catch (error) {
      console.error('Error creating vacation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  const getTypeText = (type) => {
    const types = {
      vacation: 'Vacaciones',
      sick_leave: 'Baja médica',
      personal: 'Personal',
      maternity: 'Maternidad',
      paternity: 'Paternidad',
      other: 'Otro'
    };
    return types[type] || type;
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-dark">Mis Vacaciones</h2>
        
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </button>
      </div>

      {/* New Vacation Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">Nueva Solicitud de Vacaciones</h3>
          
          <form onSubmit={handleSubmitVacation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={newVacation.startDate}
                  onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={newVacation.endDate}
                  onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Indicador de días solicitados */}
            {newVacation.startDate && newVacation.endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    📅 Días solicitados:
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    {calculateDays(newVacation.startDate, newVacation.endDate)} días
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ausencia
              </label>
              {categories.length === 0 ? (
                <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No hay categorías de ausencias disponibles. Por favor, contacta al administrador para que configure las categorías.
                  </p>
                </div>
              ) : (
                <select
                  value={newVacation.categoryId}
                  onChange={(e) => setNewVacation({...newVacation, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                      {category.maxDaysPerYear && ` (máx. ${category.maxDaysPerYear} días/año)`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={newVacation.reason}
                onChange={(e) => setNewVacation({...newVacation, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-transparent"
                rows="3"
                placeholder="Describe el motivo de tu solicitud..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={categories.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  categories.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-light text-brand-cream hover:bg-brand-medium'
                }`}
              >
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vacations List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
        {vacations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tienes solicitudes de vacaciones</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-4 px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
            >
              Crear primera solicitud
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vacations.map((vacation) => {
                  // Validar fechas
                  const startDate = vacation.startDate ? new Date(vacation.startDate) : null;
                  const endDate = vacation.endDate ? new Date(vacation.endDate) : null;
                  const createdAt = vacation.createdAt ? new Date(vacation.createdAt) : null;
                  
                  const isValidStartDate = startDate && !isNaN(startDate.getTime());
                  const isValidEndDate = endDate && !isNaN(endDate.getTime());
                  const isValidCreatedAt = createdAt && !isNaN(createdAt.getTime());
                  
                  return (
                  <tr key={vacation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {isValidStartDate ? format(startDate, 'dd/MM/yyyy', { locale: es }) : 'N/A'} - {isValidEndDate ? format(endDate, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Solicitado: {isValidCreatedAt ? format(createdAt, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vacation.category ? (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center text-lg"
                            style={{ 
                              backgroundColor: `${vacation.category.color}20`, 
                              color: vacation.category.color 
                            }}
                          >
                            {vacation.category.icon}
                          </div>
                          <span className="text-sm text-gray-900">{vacation.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">{getTypeText(vacation.type)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {calculateDays(vacation.startDate, vacation.endDate)} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(vacation.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vacation.status)}`}>
                          {getStatusText(vacation.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {vacation.reason || '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Reports Content
const ReportsContent = ({ employee }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [employee.id, selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [recordsResponse, vacationsResponse] = await Promise.all([
        fetch(`${getApiUrl()}/records/employee/${employee.id}`),
        fetch(`${getApiUrl()}/vacations/employee/${employee.id}`)
      ]);

      const records = recordsResponse.ok ? await recordsResponse.json() : [];
      const vacations = vacationsResponse.ok ? await vacationsResponse.json() : [];

      setReportData(calculateReportData(records, vacations));
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (records, vacations) => {
    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredRecords = records.filter(r => new Date(r.timestamp) >= startDate);
    const filteredVacations = vacations.filter(v => 
      new Date(v.startDate) >= startDate && v.status === 'approved'
    );

    // Calculate work hours (simplified)
    const checkinRecords = filteredRecords.filter(r => r.type === 'checkin');
    const checkoutRecords = filteredRecords.filter(r => r.type === 'checkout');
    const workDays = Math.min(checkinRecords.length, checkoutRecords.length);
    const totalHours = workDays * 8; // Simplified calculation

    // Calculate late arrivals (after 9:15 AM)
    const lateArrivals = checkinRecords.filter(r => {
      const time = new Date(r.timestamp);
      const hour = time.getHours();
      const minute = time.getMinutes();
      const isLate = hour > 9 || (hour === 9 && minute > 15);
      if (isLate) {
        console.log('Late arrival detected:', time.toLocaleString('es-ES'), 'at', hour + ':' + minute);
      }
      return isLate;
    }).length;

    console.log('Punctuality calculation:', {
      totalCheckins: checkinRecords.length,
      lateArrivals,
      punctualityScore: checkinRecords.length > 0 ? Math.max(0, 100 - (lateArrivals / checkinRecords.length * 100)).toFixed(1) : 100
    });

    // Calculate early departures (before 4:45 PM)
    const earlyDepartures = checkoutRecords.filter(r => {
      const time = new Date(r.timestamp);
      const hour = time.getHours();
      const minute = time.getMinutes();
      return hour < 16 || (hour === 16 && minute < 45);
    }).length;

    // Calculate vacation days
    const vacationDays = filteredVacations.reduce((total, vacation) => {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return total + diffDays;
    }, 0);

    return {
      workDays,
      totalHours,
      lateArrivals,
      earlyDepartures,
      vacationDays,
      averageHoursPerDay: workDays > 0 ? (totalHours / workDays).toFixed(1) : 0,
      punctualityScore: checkinRecords.length > 0 ? Math.max(0, 100 - (lateArrivals / checkinRecords.length * 100)).toFixed(1) : 100
    };
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'week': return 'Última Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      default: return 'Este Mes';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-dark">Mis Reportes</h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          >
            <option value="week">Última semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
          
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Días Trabajados</p>
              <p className="text-2xl font-semibold text-neutral-dark">{reportData?.workDays || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Horas Totales</p>
              <p className="text-2xl font-semibold text-neutral-dark">{reportData?.totalHours || 0}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Llegadas Tarde</p>
              <p className="text-2xl font-semibold text-neutral-dark">{reportData?.lateArrivals || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Días de Vacaciones</p>
              <p className="text-2xl font-semibold text-neutral-dark">{reportData?.vacationDays || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">Métricas de Rendimiento</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-medium">Promedio horas/día</span>
              <span className="text-lg font-semibold text-neutral-dark">{reportData?.averageHoursPerDay || 0}h</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-medium">Puntuación puntualidad</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-neutral-dark mr-2">{reportData?.punctualityScore || 100}%</span>
                <div className={`w-3 h-3 rounded-full ${
                  (reportData?.punctualityScore || 100) >= 90 ? 'bg-green-500' :
                  (reportData?.punctualityScore || 100) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-medium">Salidas tempranas</span>
              <span className="text-lg font-semibold text-neutral-dark">{reportData?.earlyDepartures || 0}</span>
            </div>
          </div>
        </div>

        {/* Period Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">Resumen - {getPeriodText()}</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Asistencia</p>
                  <p className="text-xs text-blue-700">Días trabajados en el período</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">{reportData?.workDays || 0}</p>
                  <p className="text-xs text-blue-600">días</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Productividad</p>
                  <p className="text-xs text-green-700">Horas trabajadas totales</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-900">{reportData?.totalHours || 0}</p>
                  <p className="text-xs text-green-600">horas</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Puntualidad</p>
                  <p className="text-xs text-yellow-700">Porcentaje de llegadas a tiempo</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-900">{reportData?.punctualityScore || 100}</p>
                  <p className="text-xs text-yellow-600">%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips and Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">💡 Recomendaciones</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(reportData?.lateArrivals || 0) > 2 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Mejora tu puntualidad</h4>
              <p className="text-sm text-orange-700">
                Has llegado tarde {reportData.lateArrivals} veces. Intenta llegar 10 minutos antes para mejorar tu puntuación.
              </p>
            </div>
          )}
          
          {(reportData?.averageHoursPerDay || 0) < 7.5 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Optimiza tu tiempo</h4>
              <p className="text-sm text-blue-700">
                Tu promedio es {reportData?.averageHoursPerDay}h/día. Considera revisar tu gestión del tiempo.
              </p>
            </div>
          )}
          
          {(reportData?.punctualityScore || 100) >= 95 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">¡Excelente trabajo!</h4>
              <p className="text-sm text-green-700">
                Tu puntualidad es ejemplar. Sigue manteniendo estos buenos hábitos.
              </p>
            </div>
          )}
          
          {(reportData?.workDays || 0) === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Sin datos suficientes</h4>
              <p className="text-sm text-gray-700">
                No hay suficientes datos para este período. Asegúrate de fichar regularmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS CONTENT
// ============================================

const DocumentsContent = ({ employee, onDocumentRead }) => {
  const [view, setView] = useState('received'); // 'received' or 'sent'
  const [sentDocuments, setSentDocuments] = useState([]);
  const [receivedDocuments, setReceivedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    documentType: 'justificante',
    priority: 'normal',
    file: null
  });

  useEffect(() => {
    loadDocuments();
  }, [view]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      if (view === 'sent') {
        const response = await authenticatedFetch(`${getApiUrl()}/documents/employee-to-admin/my-documents`);
        if (response.ok) {
          const data = await response.json();
          setSentDocuments(data);
        }
      } else {
        const response = await authenticatedFetch(`${getApiUrl()}/documents/admin-to-employee/my-documents`);
        if (response.ok) {
          const data = await response.json();
          setReceivedDocuments(data);
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar tamaño (10MB máx)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.title) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('documentType', uploadForm.documentType);
      formData.append('priority', uploadForm.priority);

      const response = await authenticatedFetch(`${getApiUrl()}/documents/employee-to-admin`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Documento subido correctamente');
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          description: '',
          documentType: 'justificante',
          priority: 'normal',
          file: null
        });
        setView('sent');
        loadDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo subir el documento'}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al descargar el documento');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  const handleMarkAsRead = async (documentId) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/documents/${documentId}/mark-read`, {
        method: 'PATCH'
      });
      if (response.ok) {
        loadDocuments();
        // Actualizar contador de documentos no leídos
        if (onDocumentRead) {
          onDocumentRead();
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
      reviewed: { color: 'bg-blue-100 text-blue-800', label: 'Revisado', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', label: 'Aprobado', icon: CheckCircle2 },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: XCircle }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baja' },
      normal: { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };
    
    const badge = badges[priority] || badges.normal;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      baja_medica: 'Baja Médica',
      justificante: 'Justificante',
      certificado: 'Certificado',
      nomina: 'Nómina',
      contrato: 'Contrato',
      politica: 'Política',
      notificacion: 'Notificación',
      otro: 'Otro'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark">Documentos</h2>
          <p className="text-brand-medium mt-1">Gestiona tus documentos y comunicaciones</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-1 inline-flex">
        <button
          onClick={() => setView('received')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === 'received'
              ? 'bg-brand-light text-brand-cream'
              : 'text-neutral-dark hover:bg-neutral-light'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Recibidos</span>
            {receivedDocuments.filter(d => !d.readAt).length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {receivedDocuments.filter(d => !d.readAt).length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setView('sent')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === 'sent'
              ? 'bg-brand-light text-brand-cream'
              : 'text-neutral-dark hover:bg-neutral-light'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Enviados</span>
          </div>
        </button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {view === 'sent' && sentDocuments.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-12 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No has enviado ningún documento</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-brand-light hover:text-brand-medium"
              >
                Subir tu primer documento
              </button>
            </div>
          )}

          {view === 'received' && receivedDocuments.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-12 text-center">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No has recibido ningún documento</p>
            </div>
          )}

          {view === 'sent' && sentDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-dark">{doc.title}</h3>
                    {getStatusBadge(doc.status)}
                    {getPriorityBadge(doc.priority)}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <File className="h-4 w-4 mr-1" />
                      {getDocumentTypeLabel(doc.documentType)}
                    </span>
                    <span>
                      {doc.createdAt || doc.created_at 
                        ? format(new Date(doc.createdAt || doc.created_at), "d 'de' MMMM, yyyy", { locale: es })
                        : 'Fecha no disponible'
                      }
                    </span>
                  </div>
                  {doc.reviewNotes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Notas del revisor:</p>
                      <p className="text-sm text-blue-700">{doc.reviewNotes}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(doc.id, doc.originalName)}
                  className="ml-4 p-2 text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {view === 'received' && receivedDocuments.map((doc) => (
            <div 
              key={doc.id} 
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                !doc.readAt ? 'border-brand-light border-2' : 'border-neutral-mid/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-dark">{doc.title}</h3>
                    {!doc.readAt && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Nuevo
                      </span>
                    )}
                    {getPriorityBadge(doc.priority)}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <File className="h-4 w-4 mr-1" />
                      {getDocumentTypeLabel(doc.documentType)}
                    </span>
                    <span>
                      De: {doc.sender?.name || 'Administración'}
                    </span>
                    <span>
                      {doc.createdAt || doc.created_at 
                        ? format(new Date(doc.createdAt || doc.created_at), "d 'de' MMMM, yyyy", { locale: es })
                        : 'Fecha no disponible'
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      handleDownload(doc.id, doc.originalName);
                      if (!doc.readAt) {
                        handleMarkAsRead(doc.id);
                      }
                    }}
                    className="p-2 text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-dark">Subir Documento</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    placeholder="Ej: Justificante médico del 25/11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    rows="3"
                    placeholder="Información adicional sobre el documento..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    <select
                      value={uploadForm.documentType}
                      onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    >
                      <option value="justificante">Justificante</option>
                      <option value="baja_medica">Baja Médica</option>
                      <option value="certificado">Certificado</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={uploadForm.priority}
                      onChange={(e) => setUploadForm({ ...uploadForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    >
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: PDF, Word, Imágenes (máx. 10MB)
                  </p>
                  {uploadForm.file && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                  >
                    {uploading ? 'Subiendo...' : 'Subir Documento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
