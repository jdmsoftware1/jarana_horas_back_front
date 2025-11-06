import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSystem } from '../contexts/SystemContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Users, 
  Clock, 
  Calendar, 
  Settings, 
  LogOut, 
  Power,
  Plus,
  QrCode,
  BarChart3,
  FileText,
  Shield,
  Filter,
  Download,
  Brain,
  LogIn
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';

// Helper function for API URL
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

// Helper function for authenticated fetch
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};

// Helper function to calculate time ago
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const recordTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - recordTime) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `Hace ${diffInDays}d`;
};

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { deactivateSystem, getSessionDuration } = useSystem();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const sessionDuration = getSessionDuration();

  // Doble verificación de seguridad
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Verificar que sea admin
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Verificar si las utilidades de IA están habilitadas
  const aiUtilsEnabled = import.meta.env.VITE_ENABLE_AI_UTILS === 'true';

  // Construir tabs dinámicamente según feature flags
  const baseTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'records', label: 'Registros', icon: Clock },
    { id: 'weekly-schedules', label: 'Horarios Semanales', icon: Calendar },
    { id: 'vacations', label: 'Vacaciones', icon: Shield },
    { id: 'weekly', label: 'Vista Semanal', icon: FileText },
  ];

  const aiTabs = aiUtilsEnabled ? [
    { id: 'ai-insights', label: 'IA Insights', icon: BarChart3 },
    { id: 'ai-knowledge', label: 'Gestión IA', icon: Brain },
  ] : [];

  const tabs = [
    ...baseTabs,
    ...aiTabs,
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleDeactivateSystem = () => {
    if (confirm('¿Estás seguro de que quieres desactivar el sistema? Esto cerrará tu sesión y los empleados no podrán fichar hasta que se reactive.')) {
      deactivateSystem();
      // Cerrar sesión y redirigir
      logout();
      navigate('/', { replace: true });
      window.location.reload(); // Forzar recarga completa
    }
  };

  return (
    <div className="flex-1 bg-neutral-light">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-mid/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo & Title */}
            <div className="flex items-center">
              <img 
                src="/images/logo_jarana.jpg" 
                alt="Jarana Logo" 
                className="h-10 w-10 rounded-full object-cover mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-neutral-dark font-serif">
                  Jarana Admin
                </h1>
                <p className="text-sm text-brand-medium">Panel de Administración</p>
              </div>
            </div>

            {/* System Status & Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-dark">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-brand-medium">
                  Sesión activa: {sessionDuration?.total || '0h 0m'}
                </p>
              </div>
              <button
                onClick={handleDeactivateSystem}
                className="inline-flex items-center px-3 py-2 border border-red-200 text-sm leading-4 font-medium rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Power className="h-4 w-4 mr-2" />
                Desactivar Sistema
              </button>
              <button
                onClick={handleBackToHome}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-brand-medium hover:text-neutral-dark hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="border-b border-neutral-mid/30 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-light text-brand-light'
                      : 'border-transparent text-brand-medium hover:text-neutral-dark hover:border-brand-accent'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'employees' && <EmployeesContent />}
        {activeTab === 'records' && <RecordsContent />}
        {activeTab === 'weekly-schedules' && <WeeklySchedulesContent />}
        {activeTab === 'vacations' && <VacationsContent />}
        {activeTab === 'weekly' && <WeeklyViewContent />}
        {activeTab === 'ai-insights' && aiUtilsEnabled && <AIInsightsContent />}
        {activeTab === 'ai-knowledge' && aiUtilsEnabled && <AIKnowledgeContent />}
        {activeTab === 'settings' && <SettingsContent />}
      </div>
      
      <Footer />
      
      {/* AI Chat Component */}
      <AIChat userId={user?.id} userRole="admin" />
    </div>
  );
};

// Dashboard Content
const DashboardContent = () => {
  const [stats, setStats] = useState([
    { label: 'Total Empleados', value: '0', change: '', icon: Users, color: 'bg-blue-500' },
    { label: 'Fichajes Hoy', value: '0', change: '', icon: Clock, color: 'bg-green-500' },
    { label: 'Horas Trabajadas', value: '0h', change: '', icon: BarChart3, color: 'bg-brand-light' },
    { label: 'Empleados Activos', value: '0', change: '', icon: Shield, color: 'bg-purple-500' }
  ]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch real dashboard data
  const fetchDashboardData = async () => {
    try {
      const [employeesResponse, recordsResponse] = await Promise.all([
        authenticatedFetch(`${getApiUrl()}/employees`),
        authenticatedFetch(`${getApiUrl()}/records/all`)
      ]);

      let totalEmployees = 0;
      let activeEmployees = 0;
      let todayRecords = 0;
      let totalHours = 0;

      // Process employees data
      if (employeesResponse.ok) {
        const employees = await employeesResponse.json();
        totalEmployees = employees.length;
        activeEmployees = employees.filter(emp => emp.isActive).length;
      }

      // Process records data
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        const records = recordsData.records || recordsData;
        
        // Filter today's records
        const today = new Date().toDateString();
        const todayRecordsFiltered = records.filter(record => 
          new Date(record.timestamp).toDateString() === today
        );
        todayRecords = todayRecordsFiltered.length;

        // Calculate total hours (simplified calculation)
        const checkinRecords = records.filter(r => r.type === 'checkin');
        const checkoutRecords = records.filter(r => r.type === 'checkout');
        
        // Basic hours calculation (this is simplified)
        totalHours = Math.min(checkinRecords.length, checkoutRecords.length) * 8;

        // Get recent activity (last 5 records)
        const sortedRecords = records
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        
        setRecentActivity(sortedRecords);
      }

      // Update stats with real data
      setStats([
        { 
          label: 'Total Empleados', 
          value: totalEmployees.toString(), 
          change: totalEmployees > 0 ? `${totalEmployees} registrados` : '', 
          icon: Users, 
          color: 'bg-blue-500' 
        },
        { 
          label: 'Fichajes Hoy', 
          value: todayRecords.toString(), 
          change: todayRecords > 0 ? 'registros hoy' : 'sin registros', 
          icon: Clock, 
          color: 'bg-green-500' 
        },
        { 
          label: 'Horas Trabajadas', 
          value: `${totalHours}h`, 
          change: 'estimadas', 
          icon: BarChart3, 
          color: 'bg-brand-light' 
        },
        { 
          label: 'Empleados Activos', 
          value: activeEmployees.toString(), 
          change: `${activeEmployees}/${totalEmployees} activos`, 
          icon: Shield, 
          color: 'bg-purple-500' 
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-dark font-serif mb-6">
          Dashboard General
        </h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
                <div className="flex items-center">
                  <div className="bg-gray-200 rounded-lg p-3 animate-pulse">
                    <div className="h-6 w-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
                  <div className="flex items-center">
                    <div className={`${stat.color} rounded-lg p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-brand-medium">{stat.label}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-neutral-dark">{stat.value}</p>
                        {stat.change && (
                          <p className="ml-2 text-sm font-medium text-brand-medium">{stat.change}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {loading ? (
              // Loading skeleton for activity
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-4 text-brand-medium">
                No hay actividad reciente
              </div>
            ) : (
              recentActivity.map((record, i) => {
                const timeAgo = getTimeAgo(record.timestamp);
                const employeeName = record.employee ? record.employee.name : 'Empleado desconocido';
                const actionText = record.type === 'checkin' ? 'fichó entrada' : 'fichó salida';
                const dotColor = record.type === 'checkin' ? 'bg-green-500' : 'bg-red-500';
                
                return (
                  <div key={record.id || i} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${dotColor} rounded-full mr-3`}></div>
                      <span className="text-sm text-neutral-dark">{employeeName} {actionText}</span>
                    </div>
                    <span className="text-xs text-brand-medium">{timeAgo}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Employees Content
const EmployeesContent = () => {
  const [employees, setEmployees] = useState([]);
  const [employeesWithRecords, setEmployeesWithRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [qrCodeData, setQRCodeData] = useState(null);

  // Cargar empleados con sus últimos registros
  const fetchEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      
      if (response.ok) {
        const employeesData = await response.json();
        setEmployees(employeesData);
        
        // Obtener último registro para cada empleado
        const employeesWithLastRecord = await Promise.all(
          employeesData.map(async (employee) => {
            try {
              const recordsResponse = await authenticatedFetch(`${getApiUrl()}/records/employee/${employee.id}?limit=1`);
              if (recordsResponse.ok) {
                const records = await recordsResponse.json();
                const lastRecord = records.length > 0 ? records[0] : null;
                return {
                  ...employee,
                  lastRecord
                };
              }
              return {
                ...employee,
                lastRecord: null
              };
            } catch (error) {
              console.error(`Error fetching records for employee ${employee.id}:`, error);
              return {
                ...employee,
                lastRecord: null
              };
            }
          })
        );
        
        setEmployeesWithRecords(employeesWithLastRecord);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Gestión de Empleados
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </button>
      </div>

      {/* Create Employee Modal */}
      {showCreateForm && (
        <CreateEmployeeModal 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchEmployees();
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedEmployee && (
        <QRCodeModal
          employee={selectedEmployee}
          qrCodeData={qrCodeData}
          onClose={() => {
            setShowQRModal(false);
            setSelectedEmployee(null);
            setQRCodeData(null);
          }}
          onRegenerate={async () => {
            try {
              const response = await authenticatedFetch(`${getApiUrl()}/employees/${selectedEmployee.id}/regenerate-totp`, {
                method: 'POST'
              });
              
              if (response.ok) {
                const data = await response.json();
                setQRCodeData(data);
              }
            } catch (error) {
              console.error('Error regenerating QR:', error);
            }
          }}
        />
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-mid/20">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Último Fichaje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-mid/20">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                </td>
              </tr>
            ) : employeesWithRecords.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-brand-medium">
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              employeesWithRecords.map((employee) => (
                <tr key={employee.id} className="hover:bg-neutral-light/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center">
                        <span className="text-brand-cream font-medium">
                          {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-dark">{employee.name}</div>
                        <div className="text-sm text-brand-medium">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {employee.employeeCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-medium">
                    {employee.lastRecord ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.lastRecord.type === 'checkin' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.lastRecord.type === 'checkin' ? 'Entrada' : 'Salida'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(employee.lastRecord.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin registros</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setQRCodeData({ qrCode: employee.qrCodeUrl });
                        setShowQRModal(true);
                      }}
                      className="text-brand-light hover:text-brand-medium"
                      title="Ver QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Records Content
const RecordsContent = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [viewMode, setViewMode] = useState('grouped'); // grouped, list
  const [page, setPage] = useState(1);
  const recordsPerPage = 10;

  // Cargar empleados
  const fetchEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Cargar registros
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = selectedEmployee === 'all' 
        ? `${getApiUrl()}/records/all`
        : `${getApiUrl()}/records/employee/${selectedEmployee}`;
      
      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const allRecords = data.records || data || [];
        setRecords(filterRecordsByDate(allRecords));
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  React.useEffect(() => {
    fetchRecords();
  }, [selectedEmployee, filter]);

  const filterRecordsByDate = (data) => {
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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
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
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Registros de Fichajes
        </h2>
        
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          >
            <option value="all">Todos los empleados</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode})
              </option>
            ))}
          </select>

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
                        {selectedEmployee !== 'all' && ` • ${calculateWorkHours(dayRecords)}`}
                      </p>
                    </div>
                    {selectedEmployee !== 'all' && (
                      <div className="text-right">
                        <div className="text-sm text-brand-cream/80">Horas trabajadas</div>
                        <div className="text-2xl font-bold text-brand-cream">
                          {calculateWorkHours(dayRecords)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Timeline */}
                <div className="p-6">
                  <div className="space-y-3">
                    {dayRecords.map((record, idx) => {
                      const time = formatTime(record.timestamp);
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
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  isCheckin ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                  {isCheckin ? '🟢 Entrada' : '🔴 Salida'}
                                </span>
                                <span className="text-2xl font-bold text-neutral-dark">
                                  {time}
                                </span>
                                {selectedEmployee === 'all' && record.employee && (
                                  <span className="text-sm text-gray-600">
                                    {record.employee.name} ({record.employee.employeeCode})
                                  </span>
                                )}
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
        /* List View (Table) */
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedEmployee === 'all' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                  )}
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
                    {selectedEmployee === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.employee ? `${record.employee.name} (${record.employee.employeeCode})` : 'Desconocido'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(record.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        record.type === 'checkin' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {record.type === 'checkin' ? 'Entrada' : 'Salida'}
                      </span>
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

// Schedules Content
const SchedulesContent = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar empleados
  const fetchEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Gestión de Horarios
        </h2>
      </div>

      {/* Employees List for Schedule Management */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-mid/20">
          <h3 className="text-lg font-semibold text-neutral-dark">
            Empleados - Asignar Horarios
          </h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-brand-medium">
              No hay empleados registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="border border-neutral-mid/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-neutral-dark">{employee.name}</h4>
                      <p className="text-sm text-brand-medium">{employee.employeeCode}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowScheduleModal(true);
                        }}
                        className="px-3 py-1 bg-brand-light text-brand-cream text-sm rounded hover:bg-brand-medium transition-colors"
                      >
                        Horarios
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedEmployee && (
        <ScheduleModal
          employee={selectedEmployee}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// Vacations Content
const VacationsContent = () => {
  const [vacations, setVacations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Cargar vacaciones y empleados
  const fetchData = async () => {
    try {
      const [vacationsResponse, employeesResponse] = await Promise.all([
        authenticatedFetch(`${getApiUrl()}/vacations`),
        authenticatedFetch(`${getApiUrl()}/employees`)
      ]);
      
      if (vacationsResponse.ok) {
        const vacationsData = await vacationsResponse.json();
        setVacations(vacationsData);
      }
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      vacation: 'Vacaciones',
      sick_leave: 'Baja médica',
      personal: 'Asunto personal',
      maternity: 'Baja maternal',
      paternity: 'Baja paternal',
      other: 'Otro'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return statuses[status] || status;
  };

  const handleStatusChange = async (vacationId, newStatus) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/vacations/${vacationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData(); // Reload data
      }
    } catch (error) {
      console.error('Error updating vacation status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Gestión de Vacaciones
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </button>
      </div>

      {/* Vacations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-mid/20">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Días
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-mid/20">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                </td>
              </tr>
            ) : vacations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-brand-medium">
                  No hay solicitudes de vacaciones
                </td>
              </tr>
            ) : (
              vacations.map((vacation) => (
                <tr key={vacation.id} className="hover:bg-neutral-light/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {vacation.employee ? `${vacation.employee.name} (${vacation.employee.employeeCode})` : 'Empleado desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {getTypeLabel(vacation.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {new Date(vacation.startDate).toLocaleDateString('es-ES')} - {new Date(vacation.endDate).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {Math.ceil((new Date(vacation.endDate) - new Date(vacation.startDate)) / (1000 * 60 * 60 * 24)) + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vacation.status)}`}>
                      {getStatusLabel(vacation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {vacation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(vacation.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleStatusChange(vacation.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Vacation Modal */}
      {showCreateModal && (
        <CreateVacationModal
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Weekly View Content (Excel-like table)
const WeeklyViewContent = () => {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Get week dates
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  // Get ISO week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Fetch employees and their weekly schedules
  const fetchData = async () => {
    setLoading(true);
    try {
      const employeesResponse = await authenticatedFetch(`${getApiUrl()}/employees`);
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);

        // Get current week number and year
        const weekNumber = getWeekNumber(currentWeek);
        const year = currentWeek.getFullYear();

        // Fetch weekly schedules for each employee
        const schedulesData = {};
        for (const employee of employeesData) {
          try {
            // Fetch weekly schedule for this specific week
            const scheduleResponse = await authenticatedFetch(
              `${getApiUrl()}/weekly-schedules/employee/${employee.id}/year/${year}`
            );
            
            if (scheduleResponse.ok) {
              const responseData = await scheduleResponse.json();
              const weeklySchedules = responseData.data || responseData;
              
              // Find the schedule for the current week
              const weekSchedule = weeklySchedules.find(
                ws => ws.weekNumber === weekNumber && ws.year === year
              );

              if (weekSchedule && weekSchedule.template) {
                // Convert template days to schedule format
                const templateDays = weekSchedule.template.templateDays || [];
                schedulesData[employee.id] = templateDays.reduce((acc, day) => {
                  acc[day.dayOfWeek] = {
                    dayOfWeek: day.dayOfWeek,
                    isWorkingDay: day.isWorkingDay,
                    isSplitSchedule: day.isSplitSchedule,
                    startTime: day.startTime,
                    endTime: day.endTime,
                    morningStart: day.morningStart,
                    morningEnd: day.morningEnd,
                    afternoonStart: day.afternoonStart,
                    afternoonEnd: day.afternoonEnd,
                    breakStartTime: day.breakStartTime,
                    breakEndTime: day.breakEndTime,
                    breaks: day.breaks || []
                  };
                  return acc;
                }, {});
              } else {
                // No weekly schedule, try to get base schedule
                const baseScheduleResponse = await authenticatedFetch(
                  `${getApiUrl()}/schedules/employee/${employee.id}`
                );
                if (baseScheduleResponse.ok) {
                  const employeeSchedules = await baseScheduleResponse.json();
                  schedulesData[employee.id] = employeeSchedules.reduce((acc, schedule) => {
                    acc[schedule.dayOfWeek] = schedule;
                    return acc;
                  }, {});
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching schedules for employee ${employee.id}:`, error);
          }
        }
        setSchedules(schedulesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [currentWeek]); // Re-fetch when week changes

  const getScheduleForDay = (employeeId, dayOfWeek) => {
    return schedules[employeeId]?.[dayOfWeek] || null;
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time.substring(0, 5); // Remove seconds
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const getWeekLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const weekNum = getWeekNumber(currentWeek);
    return `Semana ${weekNum} - ${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Vista Semanal - Horarios
        </h2>
        
        {/* Week Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek(-1)}
            className="px-3 py-1 border border-neutral-mid/30 rounded hover:bg-neutral-light"
          >
            ← Anterior
          </button>
          <span className="font-medium text-neutral-dark">
            Semana del {getWeekLabel()}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="px-3 py-1 border border-neutral-mid/30 rounded hover:bg-neutral-light"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Excel-like Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider border-r border-neutral-mid/20 sticky left-0 bg-neutral-light">
                Empleado
              </th>
              {weekDates.map((date, index) => (
                <th key={index} className="px-3 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider border-r border-neutral-mid/20 min-w-[120px]">
                  <div>{daysOfWeek[index]}</div>
                  <div className="text-brand-medium font-normal">
                    {date.getDate()}/{date.getMonth() + 1}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-mid/20">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-brand-medium">
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-neutral-light/30">
                  <td className="px-4 py-4 whitespace-nowrap border-r border-neutral-mid/20 sticky left-0 bg-white">
                    <div className="text-sm font-medium text-neutral-dark">{employee.name}</div>
                    <div className="text-xs text-brand-medium">{employee.employeeCode}</div>
                  </td>
                  {weekDates.map((date, dayIndex) => {
                    const dayOfWeek = date.getDay() === 0 ? 0 : date.getDay(); // Sunday = 0
                    const schedule = getScheduleForDay(employee.id, dayOfWeek);
                    
                    return (
                      <td key={dayIndex} className="px-3 py-4 text-center border-r border-neutral-mid/20 min-w-[140px]">
                        {schedule && schedule.isWorkingDay ? (
                          <div className="text-xs space-y-1">
                            {schedule.isSplitSchedule ? (
                              <>
                                <div className="font-medium text-neutral-dark">
                                  🌅 {formatTime(schedule.morningStart)} - {formatTime(schedule.morningEnd)}
                                </div>
                                <div className="font-medium text-neutral-dark">
                                  🌆 {formatTime(schedule.afternoonStart)} - {formatTime(schedule.afternoonEnd)}
                                </div>
                              </>
                            ) : (
                              <div className="font-medium text-neutral-dark">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </div>
                            )}
                            
                            {/* Show breaks */}
                            {schedule.breaks && schedule.breaks.length > 0 && (
                              <div className="text-brand-medium mt-1 space-y-0.5">
                                {schedule.breaks.map((breakItem, idx) => (
                                  <div key={idx} className="text-[10px]">
                                    ☕ {breakItem.name}: {formatTime(breakItem.startTime)}-{formatTime(breakItem.endTime)}
                                    {breakItem.isPaid && ' 💰'}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Fallback to old break format */}
                            {(!schedule.breaks || schedule.breaks.length === 0) && 
                             schedule.breakStartTime && schedule.breakEndTime && (
                              <div className="text-brand-medium mt-1 text-[10px]">
                                ☕ {formatTime(schedule.breakStartTime)} - {formatTime(schedule.breakEndTime)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            No laboral
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-4">
        <h3 className="text-sm font-medium text-neutral-dark mb-2">Leyenda:</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-neutral-dark rounded mr-2"></div>
            <span>Horario de trabajo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-brand-medium rounded mr-2"></div>
            <span>Horario de descanso</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
            <span>Día no laboral</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Insights Content
const AIInsightsContent = () => {
  const [analysis, setAnalysis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      const [analysisResponse, alertsResponse] = await Promise.all([
        authenticatedFetch(`${getApiUrl()}/ai/anomalies-summary?days=${selectedPeriod}`),
        authenticatedFetch(`${getApiUrl()}/ai/smart-alerts`)
      ]);

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAIInsights();
  }, [selectedPeriod]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'pattern': return '📊';
      case 'system': return '⚙️';
      case 'positive': return '✅';
      default: return '📋';
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark font-serif">
          Análisis Inteligente con IA
        </h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          
          <button
            onClick={fetchAIInsights}
            disabled={loading}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
          >
            {loading ? 'Analizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Alertas Inteligentes */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">🚨 Alertas Inteligentes</h3>
            
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-brand-medium">
                No hay alertas en este momento
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getAlertColor(alert.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                        {alert.count && (
                          <div className="mt-2 text-xs">
                            <span className="font-medium">Cantidad: {alert.count}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-70">
                        {alert.priority.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de Anomalías */}
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estadísticas de Anomalías */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
                <h3 className="text-lg font-semibold text-neutral-dark mb-4">📊 Resumen de Anomalías</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-brand-medium">Total de Anomalías</span>
                    <span className="text-2xl font-bold text-neutral-dark">{analysis.totalAnomalies}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor('high')}`}></div>
                        <span className="text-sm">Alta Severidad</span>
                      </div>
                      <span className="font-medium">{analysis.highSeverity}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor('medium')}`}></div>
                        <span className="text-sm">Media Severidad</span>
                      </div>
                      <span className="font-medium">{analysis.mediumSeverity}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor('low')}`}></div>
                        <span className="text-sm">Baja Severidad</span>
                      </div>
                      <span className="font-medium">{analysis.lowSeverity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipos de Anomalías */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
                <h3 className="text-lg font-semibold text-neutral-dark mb-4">🔍 Tipos de Anomalías</h3>
                
                <div className="space-y-3">
                  {Object.entries(analysis.byType || {}).map(([type, count]) => {
                    const typeLabels = {
                      'late_arrival': 'Llegadas Tarde',
                      'early_departure': 'Salidas Tempranas',
                      'missing_checkin': 'Entradas Faltantes',
                      'missing_checkout': 'Salidas Faltantes'
                    };
                    
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{typeLabels[type] || type}</span>
                        <span className="font-medium text-brand-dark">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Insights de IA */}
          {analysis?.aiInsights && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">🤖 Insights de IA</h3>
              
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-neutral-dark">
                  {analysis.aiInsights.summary}
                </div>
              </div>
              
              <div className="mt-4 text-xs text-brand-medium">
                Generado por: {analysis.aiInsights.model} • {new Date(analysis.aiInsights.generatedAt).toLocaleString('es-ES')}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {analysis?.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">💡 Recomendaciones</h3>
              
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-blue-900">{rec.description}</h4>
                        <p className="text-sm text-blue-700 mt-1">{rec.suggestedAction}</p>
                        {rec.employee && (
                          <p className="text-xs text-blue-600 mt-1">Empleado: {rec.employee}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Settings Content
const SettingsContent = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-dark font-serif">
        Configuración del Sistema
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">
            Configuración General
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                defaultValue="Jarana"
                className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Horario de Trabajo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  defaultValue="09:00"
                  className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                />
                <input
                  type="time"
                  defaultValue="17:00"
                  className="px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">
            Configuración de Seguridad
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-dark">Requerir Google Authenticator</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-dark">Verificación de ubicación</span>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-dark">Logout automático</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

// Create Employee Modal
const CreateEmployeeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando empleado');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
          Crear Nuevo Empleado
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              PIN (4-8 dígitos)
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              minLength="4"
              maxLength="8"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// QR Code Modal
const QRCodeModal = ({ employee, qrCodeData, onClose, onRegenerate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
          Google Authenticator - {employee.name}
        </h3>

        <div className="text-center space-y-4">
          {qrCodeData?.qrCode && (
            <div className="flex justify-center">
              <img 
                src={qrCodeData.qrCode} 
                alt="QR Code" 
                className="w-48 h-48 border border-neutral-mid/30 rounded-lg"
              />
            </div>
          )}

          <div className="text-sm text-brand-medium">
            <p className="mb-2">Escanea este código QR con Google Authenticator</p>
            <p className="font-mono text-xs bg-neutral-light p-2 rounded">
              Código: {employee.employeeCode}
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <button
              onClick={onRegenerate}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Regenerar QR
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Modal
const ScheduleModal = ({ employee, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const daysOfWeek = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
  ];

  // Load existing schedules or initialize with defaults
  React.useEffect(() => {
    const loadSchedules = async () => {
      try {
        const response = await authenticatedFetch(`${getApiUrl()}/schedules/employee/${employee.id}`);
        
        if (response.ok) {
          const existingSchedules = await response.json();
          
          // Create a map of existing schedules by day
          const scheduleMap = {};
          existingSchedules.forEach(schedule => {
            scheduleMap[schedule.dayOfWeek] = {
              dayOfWeek: schedule.dayOfWeek,
              dayName: daysOfWeek.find(d => d.id === schedule.dayOfWeek)?.name || '',
              isWorkingDay: schedule.isWorkingDay,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              breakStartTime: schedule.breakStartTime || '',
              breakEndTime: schedule.breakEndTime || '',
              notes: schedule.notes || ''
            };
          });
          
          // Fill in missing days with defaults
          const allSchedules = daysOfWeek.map(day => 
            scheduleMap[day.id] || {
              dayOfWeek: day.id,
              dayName: day.name,
              isWorkingDay: day.id >= 1 && day.id <= 5, // Monday to Friday by default
              startTime: '09:00',
              endTime: '17:00',
              breakStartTime: '13:00',
              breakEndTime: '14:00',
              notes: ''
            }
          );
          
          setSchedules(allSchedules);
        } else {
          // If no schedules exist, use defaults
          const defaultSchedules = daysOfWeek.map(day => ({
            dayOfWeek: day.id,
            dayName: day.name,
            isWorkingDay: day.id >= 1 && day.id <= 5,
            startTime: '09:00',
            endTime: '17:00',
            breakStartTime: '13:00',
            breakEndTime: '14:00',
            notes: ''
          }));
          setSchedules(defaultSchedules);
        }
      } catch (error) {
        console.error('Error loading schedules:', error);
        // Use defaults on error
        const defaultSchedules = daysOfWeek.map(day => ({
          dayOfWeek: day.id,
          dayName: day.name,
          isWorkingDay: day.id >= 1 && day.id <= 5,
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '13:00',
          breakEndTime: '14:00',
          notes: ''
        }));
        setSchedules(defaultSchedules);
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [employee.id]);

  const handleScheduleChange = (dayOfWeek, field, value) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === dayOfWeek 
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/schedules/employee/${employee.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schedules })
      });

      if (response.ok) {
        alert('Horarios guardados correctamente');
        onClose();
      } else {
        throw new Error('Error al guardar horarios');
      }
    } catch (error) {
      console.error('Error saving schedules:', error);
      alert('Error al guardar horarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
          Horarios de {employee.name} ({employee.employeeCode})
        </h3>

        {loadingSchedules ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
            <div key={schedule.dayOfWeek} className="border border-neutral-mid/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-neutral-dark">{schedule.dayName}</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedule.isWorkingDay}
                    onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'isWorkingDay', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-brand-medium">Día laboral</span>
                </label>
              </div>

              {schedule.isWorkingDay && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-dark mb-1">
                      Entrada
                    </label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'startTime', e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-dark mb-1">
                      Salida
                    </label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'endTime', e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-dark mb-1">
                      Inicio Descanso
                    </label>
                    <input
                      type="time"
                      value={schedule.breakStartTime}
                      onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'breakStartTime', e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-dark mb-1">
                      Fin Descanso
                    </label>
                    <input
                      type="time"
                      value={schedule.breakEndTime}
                      onChange={(e) => handleScheduleChange(schedule.dayOfWeek, 'breakEndTime', e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-mid/20 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Vacation Modal
const CreateVacationModal = ({ employees, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const vacationTypes = [
    { value: 'vacation', label: 'Vacaciones' },
    { value: 'sick_leave', label: 'Baja médica' },
    { value: 'personal', label: 'Asunto personal' },
    { value: 'maternity', label: 'Baja maternal' },
    { value: 'paternity', label: 'Baja paternal' },
    { value: 'other', label: 'Otro' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/vacations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando solicitud de vacaciones');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
          Nueva Solicitud de Vacaciones
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Empleado
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              required
            >
              <option value="">Seleccionar empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Tipo de solicitud
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
            >
              {vacationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Fecha inicio
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Fecha fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                required
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="text-sm text-brand-medium">
              Duración: {calculateDays()} días
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Motivo
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              rows="3"
              placeholder="Motivo de la solicitud..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              rows="2"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AI Knowledge Management Content
const AIKnowledgeContent = () => {
  const [stats, setStats] = useState({ initialized: false, documentsCount: 0, sources: [] });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [savingInstructions, setSavingInstructions] = useState(false);

  useEffect(() => {
    fetchKnowledgeStats();
    fetchCustomInstructions();
  }, []);

  const fetchKnowledgeStats = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/knowledge-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setDocuments(data.sources || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomInstructions = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/custom-instructions`);
      if (response.ok) {
        const data = await response.json();
        setCustomInstructions(data.instructions || '');
      }
    } catch (error) {
      console.error('Error fetching custom instructions:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.txt')) {
      setSelectedFile(file);
    } else {
      alert('Solo se permiten archivos .txt');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/upload-document`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Documento subido correctamente');
        setSelectedFile(null);
        await handleReloadKnowledge();
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

  const handleReloadKnowledge = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/reload-knowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchKnowledgeStats();
        alert('Base de conocimiento recargada correctamente');
      }
    } catch (error) {
      console.error('Error reloading knowledge:', error);
      alert('Error al recargar la base de conocimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (filename) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/view-document/${filename}`);
      if (response.ok) {
        const data = await response.json();
        setDocContent(data.content);
        setViewingDoc(filename);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Error al ver el documento');
    }
  };

  const handleDeleteDocument = async (filename) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${filename}"?`)) return;

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/delete-document/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Documento eliminado correctamente');
        await handleReloadKnowledge();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/ai/custom-instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: customInstructions }),
      });

      if (response.ok) {
        alert('Instrucciones guardadas correctamente');
        await handleReloadKnowledge();
      }
    } catch (error) {
      console.error('Error saving instructions:', error);
      alert('Error al guardar las instrucciones');
    } finally {
      setSavingInstructions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-dark font-serif mb-2">
          Gestión de Conocimiento IA
        </h2>
        <p className="text-brand-medium">
          Administra los documentos de conocimiento que la IA utiliza para responder preguntas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className={`${stats.initialized ? 'bg-green-500' : 'bg-gray-400'} rounded-lg p-3`}>
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Estado del Sistema</p>
              <p className="text-2xl font-semibold text-neutral-dark">
                {stats.initialized ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Documentos Cargados</p>
              <p className="text-2xl font-semibold text-neutral-dark">{stats.documentsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-brand-medium">Archivos Fuente</p>
              <p className="text-2xl font-semibold text-neutral-dark">{stats.sources.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Subir Documento</h3>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".txt"
            onChange={handleFileSelect}
            className="flex-1 px-3 py-2 border border-neutral-mid/30 rounded-lg"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
        <p className="text-sm text-brand-medium mt-2">
          Solo archivos .txt. El documento se procesará automáticamente.
        </p>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-neutral-dark">Documentos</h3>
          <button
            onClick={handleReloadKnowledge}
            disabled={loading}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
          >
            {loading ? 'Recargando...' : 'Recargar'}
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-brand-medium text-center py-8">
            No hay documentos cargados. Sube un archivo .txt para comenzar.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-neutral-mid/20 rounded-lg hover:bg-neutral-light/50"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-brand-medium" />
                  <span className="text-neutral-dark font-medium">{doc}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="p-2 text-brand-medium hover:text-brand-dark"
                    title="Ver documento"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Eliminar documento"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Instrucciones Personalizadas</h3>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          rows="6"
          placeholder="Instrucciones adicionales para la IA..."
        />
        <button
          onClick={handleSaveInstructions}
          disabled={savingInstructions}
          className="mt-4 px-6 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50"
        >
          {savingInstructions ? 'Guardando...' : 'Guardar Instrucciones'}
        </button>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-mid/20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">{viewingDoc}</h3>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-neutral-dark font-mono">
                {docContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Weekly Schedules Content
const WeeklySchedulesContent = () => {
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateFormModal, setShowTemplateFormModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCustomScheduleModal, setShowCustomScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedEmployeesForCopy, setSelectedEmployeesForCopy] = useState([]);
  const [assignData, setAssignData] = useState({
    employeeId: '',
    templateId: '',
    year: new Date().getFullYear(),
    weekNumber: 1
  });
  const [useWeekRange, setUseWeekRange] = useState(false);
  const [weekRange, setWeekRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchWeeklySchedules();
    }
  }, [selectedEmployee, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter(e => e.isActive));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/schedule-templates`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setTemplates(Array.isArray(data) ? data.filter(t => t.isActive) : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchWeeklySchedules = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/weekly-schedules/employee/${selectedEmployee}/year/${selectedYear}`
      );
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setWeeklySchedules(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching weekly schedules:', error);
      setWeeklySchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('¿Estás seguro de eliminar este horario semanal?')) return;
    
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/weekly-schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Horario eliminado correctamente');
        fetchWeeklySchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error al eliminar el horario');
    }
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getWeeksInRange = (startDate, endDate) => {
    const weeks = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    const seenWeeks = new Set();
    
    while (current <= end) {
      const weekNum = getWeekNumber(current);
      const year = current.getFullYear();
      const weekKey = `${year}-${weekNum}`;
      
      if (!seenWeeks.has(weekKey)) {
        seenWeeks.add(weekKey);
        weeks.push({ year, weekNumber: weekNum });
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return weeks;
  };

  const handleAssignTemplate = async (e) => {
    e.preventDefault();
    
    try {
      let weeksToAssign = [];
      
      if (useWeekRange && weekRange.startDate && weekRange.endDate) {
        weeksToAssign = getWeeksInRange(weekRange.startDate, weekRange.endDate);
      } else {
        weeksToAssign = [{ year: assignData.year, weekNumber: assignData.weekNumber }];
      }
      
      if (weeksToAssign.length === 0) {
        alert('No se encontraron semanas en el rango seleccionado');
        return;
      }
      
      const promises = weeksToAssign.map(week =>
        authenticatedFetch(`${getApiUrl()}/weekly-schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: assignData.employeeId,
            templateId: assignData.templateId,
            year: week.year,
            weekNumber: week.weekNumber
          })
        })
      );
      
      await Promise.all(promises);
      
      alert(`Plantilla asignada correctamente a ${weeksToAssign.length} semana(s)`);
      setShowAssignModal(false);
      setUseWeekRange(false);
      setWeekRange({ startDate: '', endDate: '' });
      fetchWeeklySchedules();
    } catch (error) {
      console.error('Error assigning template:', error);
      alert('Error al asignar plantilla');
    }
  };

  const getWeekDateRange = (year, weekNumber) => {
    const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
    
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };
    
    return `${formatDate(ISOweekStart)} - ${formatDate(ISOweekEnd)}`;
  };

  const currentWeek = getWeekNumber(new Date());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark font-serif mb-2">
            Horarios Semanales
          </h2>
          <p className="text-brand-medium">
            Gestiona horarios semanales específicos para cada empleado
          </p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-brand-medium text-brand-cream rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Calendar className="h-5 w-5 inline mr-2" />
          Gestionar Plantillas
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Empleado
            </label>
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
            >
              <option value="">Seleccionar empleado...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={!selectedEmployee}
              className="flex-1 px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Asignar Plantilla
            </button>
            <button
              onClick={() => setShowCustomScheduleModal(true)}
              disabled={!selectedEmployee}
              className="flex-1 px-4 py-2 bg-brand-medium text-brand-cream rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Horario Personalizado
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Schedules List */}
      {selectedEmployee && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <h3 className="text-lg font-semibold text-neutral-dark mb-4">
            Horarios de {employees.find(e => e.id === selectedEmployee)?.name} - {selectedYear}
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-light"></div>
            </div>
          ) : weeklySchedules.length === 0 ? (
            <p className="text-brand-medium text-center py-8">
              No hay horarios semanales asignados para este empleado en {selectedYear}
            </p>
          ) : (
            <div className="space-y-3">
              {weeklySchedules.map(schedule => (
                <div
                  key={schedule.id}
                  className={`p-4 border rounded-lg ${
                    schedule.weekNumber === currentWeek && schedule.year === new Date().getFullYear()
                      ? 'border-brand-light bg-brand-light/5'
                      : 'border-neutral-mid/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-brand-medium" />
                        <span className="font-semibold text-neutral-dark">
                          Semana {schedule.weekNumber} - {schedule.year}
                        </span>
                        <span className="text-sm text-brand-medium">
                          ({getWeekDateRange(schedule.year, schedule.weekNumber)})
                        </span>
                        {schedule.weekNumber === currentWeek && schedule.year === new Date().getFullYear() && (
                          <span className="px-2 py-1 bg-brand-light text-brand-cream text-xs rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      
                      {schedule.template && (
                        <>
                          <div className="text-sm text-brand-medium mb-2">
                            <strong>Plantilla:</strong> {schedule.template.name}
                            {schedule.template.description && (
                              <span className="ml-2">- {schedule.template.description}</span>
                            )}
                          </div>

                          {/* Schedule Summary */}
                          {schedule.template.templateDays && schedule.template.templateDays.length > 0 && (
                            <div className="mt-3 bg-neutral-light/30 rounded-lg p-3 border border-neutral-mid/10">
                              <div className="text-xs font-semibold text-neutral-dark mb-2">Resumen de Horario:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {schedule.template.templateDays
                                  .filter(day => day.isWorkingDay)
                                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                                  .map((day, idx) => {
                                    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                    const dayName = dayNames[day.dayOfWeek];
                                    
                                    return (
                                      <div key={idx} className="flex items-start space-x-2 text-neutral-dark">
                                        <span className="font-medium min-w-[35px]">{dayName}:</span>
                                        <div className="flex-1">
                                          {day.isSplitSchedule ? (
                                            <div className="space-y-1">
                                              <div className="flex items-center space-x-1">
                                                <span className="text-brand-medium">🌅</span>
                                                <span>{day.morningStart} - {day.morningEnd}</span>
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                <span className="text-brand-medium">🌆</span>
                                                <span>{day.afternoonStart} - {day.afternoonEnd}</span>
                                              </div>
                                            </div>
                                          ) : (
                                            <span>{day.startTime} - {day.endTime}</span>
                                          )}
                                          
                                          {day.breaks && day.breaks.length > 0 && (
                                            <div className="mt-1 text-[10px] text-brand-medium/80 space-y-0.5">
                                              {day.breaks.map((breakItem, bIdx) => (
                                                <div key={bIdx} className="flex items-center space-x-1">
                                                  <span>☕</span>
                                                  <span>{breakItem.name}: {breakItem.startTime}-{breakItem.endTime}</span>
                                                  {breakItem.isPaid && <span className="text-green-600">💰</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                              
                              {schedule.template.templateDays.filter(d => !d.isWorkingDay).length > 0 && (
                                <div className="mt-2 text-[10px] text-neutral-dark/60">
                                  <strong>Días no laborales:</strong> {
                                    schedule.template.templateDays
                                      .filter(d => !d.isWorkingDay)
                                      .map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.dayOfWeek])
                                      .join(', ')
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {schedule.notes && (
                        <div className="text-sm text-brand-medium mt-2">
                          <strong>Notas:</strong> {schedule.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedWeek(schedule);
                          setShowCopyModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800"
                        title="Copiar a otros empleados"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Eliminar horario"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Template Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-mid/20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">Asignar Plantilla Semanal</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Empleado
                </label>
                <select
                  value={assignData.employeeId}
                  onChange={(e) => setAssignData({ ...assignData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Plantilla
                </label>
                <select
                  value={assignData.templateId}
                  onChange={(e) => setAssignData({ ...assignData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-neutral-mid/20 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-neutral-dark">
                    Modo de asignación
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setUseWeekRange(false)}
                      className={`px-3 py-1 text-sm rounded ${
                        !useWeekRange
                          ? 'bg-brand-light text-brand-cream'
                          : 'bg-neutral-light text-neutral-dark hover:bg-neutral-mid/20'
                      }`}
                    >
                      Semana única
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseWeekRange(true)}
                      className={`px-3 py-1 text-sm rounded ${
                        useWeekRange
                          ? 'bg-brand-light text-brand-cream'
                          : 'bg-neutral-light text-neutral-dark hover:bg-neutral-mid/20'
                      }`}
                    >
                      Rango de fechas
                    </button>
                  </div>
                </div>

                {!useWeekRange ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        Año
                      </label>
                      <input
                        type="number"
                        value={assignData.year}
                        onChange={(e) => setAssignData({ ...assignData, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                        min="2024"
                        max="2030"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        Semana
                      </label>
                      <input
                        type="number"
                        value={assignData.weekNumber}
                        onChange={(e) => setAssignData({ ...assignData, weekNumber: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                        min="1"
                        max="53"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          Fecha inicio
                        </label>
                        <input
                          type="date"
                          value={weekRange.startDate}
                          onChange={(e) => setWeekRange({ ...weekRange, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                          required={useWeekRange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          Fecha fin
                        </label>
                        <input
                          type="date"
                          value={weekRange.endDate}
                          onChange={(e) => setWeekRange({ ...weekRange, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                          min={weekRange.startDate}
                          required={useWeekRange}
                        />
                      </div>
                    </div>
                    
                    {weekRange.startDate && weekRange.endDate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Semanas a asignar:</strong> {getWeeksInRange(weekRange.startDate, weekRange.endDate).length}
                        </p>
                        <div className="mt-2 text-xs text-blue-700 max-h-32 overflow-y-auto">
                          {getWeeksInRange(weekRange.startDate, weekRange.endDate).map((week, idx) => (
                            <span key={idx} className="inline-block mr-2 mb-1 px-2 py-1 bg-blue-100 rounded">
                              Sem {week.weekNumber}/{week.year}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
                >
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Schedule to Multiple Employees Modal */}
      {showCopyModal && selectedWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-mid/20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">Copiar Horario Semanal</h3>
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedEmployeesForCopy([]);
                  }}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Horario a copiar:</strong> Semana {selectedWeek.weekNumber} - {selectedWeek.year}
                  {selectedWeek.template && (
                    <span className="block mt-1">Plantilla: {selectedWeek.template.name}</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Seleccionar empleados
                </label>
                <div className="max-h-64 overflow-y-auto border border-neutral-mid/30 rounded-lg p-3 space-y-2">
                  {employees
                    .filter(emp => emp.id !== selectedEmployee)
                    .map(emp => (
                      <label key={emp.id} className="flex items-center space-x-2 p-2 hover:bg-neutral-light/50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployeesForCopy.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeesForCopy([...selectedEmployeesForCopy, emp.id]);
                            } else {
                              setSelectedEmployeesForCopy(selectedEmployeesForCopy.filter(id => id !== emp.id));
                            }
                          }}
                          className="rounded border-neutral-mid/30"
                        />
                        <span className="text-sm text-neutral-dark">
                          {emp.name} ({emp.employeeCode})
                        </span>
                      </label>
                    ))}
                </div>
                <p className="text-xs text-brand-medium mt-2">
                  {selectedEmployeesForCopy.length} empleado(s) seleccionado(s)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-mid/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedEmployeesForCopy([]);
                  }}
                  className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (selectedEmployeesForCopy.length === 0) {
                      alert('Selecciona al menos un empleado');
                      return;
                    }

                    try {
                      const promises = selectedEmployeesForCopy.map(employeeId =>
                        authenticatedFetch(`${getApiUrl()}/weekly-schedules`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            employeeId,
                            templateId: selectedWeek.templateId,
                            year: selectedWeek.year,
                            weekNumber: selectedWeek.weekNumber,
                            notes: selectedWeek.notes
                          })
                        })
                      );

                      await Promise.all(promises);
                      alert(`Horario copiado a ${selectedEmployeesForCopy.length} empleado(s)`);
                      setShowCopyModal(false);
                      setSelectedEmployeesForCopy([]);
                      fetchWeeklySchedules();
                    } catch (error) {
                      console.error('Error copying schedule:', error);
                      alert('Error al copiar horario');
                    }
                  }}
                  disabled={selectedEmployeesForCopy.length === 0}
                  className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copiar a {selectedEmployeesForCopy.length} empleado(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Schedule Modal */}
      {showCustomScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-mid/20 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">
                  Crear Horario Personalizado - {employees.find(e => e.id === selectedEmployee)?.name}
                </h3>
                <button
                  onClick={() => setShowCustomScheduleModal(false)}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-brand-medium mt-2">
                Configura un horario personalizado para la semana seleccionada
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    readOnly
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg bg-neutral-light/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Número de Semana
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={assignData.weekNumber}
                    onChange={(e) => setAssignData({ ...assignData, weekNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg"
                  />
                </div>
              </div>

              <CustomScheduleForm
                employeeId={selectedEmployee}
                year={selectedYear}
                weekNumber={assignData.weekNumber}
                onClose={() => setShowCustomScheduleModal(false)}
                onSuccess={fetchWeeklySchedules}
              />
            </div>
          </div>
        </div>
      )}

      {/* Template Management Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-mid/20 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">Gestión de Plantillas</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-brand-medium">Plantillas de horarios disponibles</p>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setShowTemplateFormModal(true);
                  }}
                  className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Nueva Plantilla
                </button>
              </div>

              <div className="space-y-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border border-neutral-mid/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-dark">{template.name}</h4>
                        {template.description && (
                          <p className="text-sm text-brand-medium mt-1">{template.description}</p>
                        )}
                        <div className="mt-2 text-xs text-brand-medium">
                          {template.templateDays?.length || 0} días configurados
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateFormModal(true);
                          }}
                          className="px-3 py-1 text-sm text-brand-light hover:text-brand-medium"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Form Modal (Create/Edit) */}
      {showTemplateFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-mid/20 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">
                  {selectedTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h3>
                <button
                  onClick={() => {
                    setShowTemplateFormModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <TemplateForm
                template={selectedTemplate}
                onClose={() => {
                  setShowTemplateFormModal(false);
                  setSelectedTemplate(null);
                  fetchTemplates();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Template Form Component with Split Schedule Support and Multiple Breaks
const TemplateForm = ({ template, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    days: template?.templateDays || Array(7).fill(null).map((_, i) => ({
      dayOfWeek: i,
      isWorkingDay: false,
      isSplitSchedule: false,
      startTime: '09:00',
      endTime: '18:00',
      morningStart: '09:00',
      morningEnd: '14:00',
      afternoonStart: '16:00',
      afternoonEnd: '20:00',
      notes: '',
      breaks: []
    }))
  });

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleDayChange = (dayIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
    setFormData({ ...formData, days: newDays });
  };

  const addBreak = (dayIndex) => {
    const newDays = [...formData.days];
    const newBreak = {
      name: 'Pausa',
      startTime: '12:00',
      endTime: '12:30',
      breakType: 'rest',
      isPaid: true,
      isRequired: false,
      sortOrder: newDays[dayIndex].breaks?.length || 0
    };
    newDays[dayIndex].breaks = [...(newDays[dayIndex].breaks || []), newBreak];
    setFormData({ ...formData, days: newDays });
  };

  const removeBreak = (dayIndex, breakIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].breaks = newDays[dayIndex].breaks.filter((_, i) => i !== breakIndex);
    setFormData({ ...formData, days: newDays });
  };

  const handleBreakChange = (dayIndex, breakIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].breaks[breakIndex] = {
      ...newDays[dayIndex].breaks[breakIndex],
      [field]: value
    };
    setFormData({ ...formData, days: newDays });
  };

  const copyDayToOthers = (sourceDayIndex) => {
    const sourceDay = formData.days[sourceDayIndex];
    const confirmation = confirm(`¿Copiar la configuración de ${dayNames[sourceDayIndex]} a todos los demás días?`);
    
    if (confirmation) {
      const newDays = formData.days.map((day, index) => {
        if (index === sourceDayIndex) return day;
        return {
          ...sourceDay,
          dayOfWeek: day.dayOfWeek,
          breaks: sourceDay.breaks ? sourceDay.breaks.map(b => ({ ...b })) : []
        };
      });
      setFormData({ ...formData, days: newDays });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = template 
        ? `${getApiUrl()}/schedule-templates/${template.id}`
        : `${getApiUrl()}/schedule-templates`;
      
      const payload = {
        ...formData,
        createdBy: user?.id,
        templateDays: formData.days
      };
      
      const response = await authenticatedFetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(template ? 'Plantilla actualizada' : 'Plantilla creada');
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo guardar la plantilla'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar la plantilla');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">
            Nombre de la Plantilla *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">
            Descripción
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      <div className="border-t border-neutral-mid/20 pt-4">
        <h4 className="font-semibold text-neutral-dark mb-4">Configuración por Día</h4>
        
        <div className="space-y-4">
          {formData.days.map((day, index) => (
            <div key={index} className="border border-neutral-mid/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-neutral-dark">{dayNames[index]}</h5>
                  {day.isWorkingDay && (
                    <button
                      type="button"
                      onClick={() => copyDayToOthers(index)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      title="Copiar este día a todos los demás"
                    >
                      📋 Copiar a todos
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={(e) => handleDayChange(index, 'isWorkingDay', e.target.checked)}
                      className="rounded border-neutral-mid/30"
                    />
                    <span className="text-sm text-neutral-dark">Día laboral</span>
                  </label>
                  {day.isWorkingDay && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={day.isSplitSchedule}
                        onChange={(e) => handleDayChange(index, 'isSplitSchedule', e.target.checked)}
                        className="rounded border-neutral-mid/30"
                      />
                      <span className="text-sm text-brand-medium">Horario partido</span>
                    </label>
                  )}
                </div>
              </div>

              {day.isWorkingDay && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {day.isSplitSchedule ? (
                      <>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Entrada Mañana</label>
                          <input
                            type="time"
                            value={day.morningStart}
                            onChange={(e) => handleDayChange(index, 'morningStart', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Salida Mañana</label>
                          <input
                            type="time"
                            value={day.morningEnd}
                            onChange={(e) => handleDayChange(index, 'morningEnd', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Entrada Tarde</label>
                          <input
                            type="time"
                            value={day.afternoonStart}
                            onChange={(e) => handleDayChange(index, 'afternoonStart', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Salida Tarde</label>
                          <input
                            type="time"
                            value={day.afternoonEnd}
                            onChange={(e) => handleDayChange(index, 'afternoonEnd', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Entrada</label>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">Salida</label>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Múltiples Pausas */}
                  <div className="border-t border-neutral-mid/10 pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h6 className="text-sm font-medium text-neutral-dark">Pausas</h6>
                      <button
                        type="button"
                        onClick={() => addBreak(index)}
                        className="text-xs px-2 py-1 bg-brand-light/10 text-brand-light rounded hover:bg-brand-light/20"
                      >
                        + Añadir Pausa
                      </button>
                    </div>

                    {day.breaks && day.breaks.length > 0 ? (
                      <div className="space-y-2">
                        {day.breaks.map((breakItem, breakIndex) => (
                          <div key={breakIndex} className="bg-neutral-light/50 rounded p-2 border border-neutral-mid/10">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={breakItem.name}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'name', e.target.value)}
                                  placeholder="Nombre"
                                  className="w-full px-2 py-1 text-xs border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="time"
                                  value={breakItem.startTime}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'startTime', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="time"
                                  value={breakItem.endTime}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'endTime', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <select
                                  value={breakItem.breakType}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'breakType', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-neutral-mid/30 rounded focus:border-brand-light focus:ring-0 focus:outline-none"
                                >
                                  <option value="rest">Descanso</option>
                                  <option value="meal">Comida</option>
                                  <option value="paid">Pagada</option>
                                  <option value="unpaid">No pagada</option>
                                  <option value="personal">Personal</option>
                                  <option value="other">Otra</option>
                                </select>
                              </div>
                              <div className="col-span-2 flex items-center space-x-1">
                                <label className="flex items-center text-xs">
                                  <input
                                    type="checkbox"
                                    checked={breakItem.isPaid}
                                    onChange={(e) => handleBreakChange(index, breakIndex, 'isPaid', e.target.checked)}
                                    className="mr-1 rounded border-neutral-mid/30"
                                  />
                                  Pagada
                                </label>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeBreak(index, breakIndex)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  title="Eliminar pausa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-medium italic">No hay pausas configuradas</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-mid/20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
        >
          {template ? 'Actualizar' : 'Crear'} Plantilla
        </button>
      </div>
    </form>
  );
};

// Custom Schedule Form Component (reuses TemplateForm logic but saves as weekly schedule)
const CustomScheduleForm = ({ employeeId, year, weekNumber, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    days: Array(7).fill(null).map((_, i) => ({
      dayOfWeek: i,
      isWorkingDay: false,
      isSplitSchedule: false,
      startTime: '09:00',
      endTime: '18:00',
      morningStart: '09:00',
      morningEnd: '14:00',
      afternoonStart: '16:00',
      afternoonEnd: '20:00',
      notes: '',
      breaks: []
    }))
  });

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleDayChange = (dayIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
    setFormData({ ...formData, days: newDays });
  };

  const addBreak = (dayIndex) => {
    const newDays = [...formData.days];
    const newBreak = {
      name: 'Pausa',
      startTime: '12:00',
      endTime: '12:30',
      breakType: 'rest',
      isPaid: true,
      isRequired: false,
      sortOrder: newDays[dayIndex].breaks?.length || 0
    };
    newDays[dayIndex].breaks = [...(newDays[dayIndex].breaks || []), newBreak];
    setFormData({ ...formData, days: newDays });
  };

  const removeBreak = (dayIndex, breakIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].breaks = newDays[dayIndex].breaks.filter((_, i) => i !== breakIndex);
    setFormData({ ...formData, days: newDays });
  };

  const handleBreakChange = (dayIndex, breakIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].breaks[breakIndex] = {
      ...newDays[dayIndex].breaks[breakIndex],
      [field]: value
    };
    setFormData({ ...formData, days: newDays });
  };

  const copyDayToOthers = (sourceDayIndex) => {
    const sourceDay = formData.days[sourceDayIndex];
    const confirmation = confirm(`¿Copiar la configuración de ${dayNames[sourceDayIndex]} a todos los demás días?`);
    
    if (confirmation) {
      const newDays = formData.days.map((day, index) => {
        if (index === sourceDayIndex) return day;
        return {
          ...sourceDay,
          dayOfWeek: day.dayOfWeek,
          breaks: sourceDay.breaks ? sourceDay.breaks.map(b => ({ ...b })) : []
        };
      });
      setFormData({ ...formData, days: newDays });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // First create a temporary template with the custom schedule
      const templatePayload = {
        name: `Horario Personalizado - Semana ${weekNumber}/${year}`,
        description: `Horario personalizado creado automáticamente`,
        createdBy: user?.id,
        templateDays: formData.days
      };
      
      const templateResponse = await authenticatedFetch(`${getApiUrl()}/schedule-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templatePayload)
      });

      if (!templateResponse.ok) {
        throw new Error('Error al crear plantilla temporal');
      }

      const templateData = await templateResponse.json();
      const templateId = templateData.data.id;

      // Now assign this template to the weekly schedule
      const scheduleResponse = await authenticatedFetch(`${getApiUrl()}/weekly-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          templateId,
          year,
          weekNumber,
          notes: `Horario personalizado`
        })
      });

      if (scheduleResponse.ok) {
        alert('Horario personalizado creado correctamente');
        onSuccess();
        onClose();
      } else {
        throw new Error('Error al asignar horario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear horario personalizado');
    }
  };

  const breakTypes = [
    { value: 'meal', label: 'Comida' },
    { value: 'rest', label: 'Descanso' },
    { value: 'coffee', label: 'Café' },
    { value: 'smoke', label: 'Fumar' },
    { value: 'prayer', label: 'Oración' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-4">
          {formData.days.map((day, index) => (
            <div key={index} className="border border-neutral-mid/30 rounded-lg p-4 bg-neutral-light/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-neutral-dark">{dayNames[index]}</h4>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={(e) => handleDayChange(index, 'isWorkingDay', e.target.checked)}
                      className="rounded border-neutral-mid/30"
                    />
                    <span>Día laboral</span>
                  </label>
                  {day.isWorkingDay && (
                    <>
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={day.isSplitSchedule}
                          onChange={(e) => handleDayChange(index, 'isSplitSchedule', e.target.checked)}
                          className="rounded border-neutral-mid/30"
                        />
                        <span>Horario partido</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyDayToOthers(index)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        title="Copiar este día a todos los demás"
                      >
                        📋 Copiar a todos
                      </button>
                    </>
                  )}
                </div>
              </div>

              {day.isWorkingDay && (
                <>
                  {!day.isSplitSchedule ? (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-brand-medium mb-1">Hora entrada</label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-medium mb-1">Hora salida</label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">🌅 Mañana - Entrada</label>
                          <input
                            type="time"
                            value={day.morningStart}
                            onChange={(e) => handleDayChange(index, 'morningStart', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">🌅 Mañana - Salida</label>
                          <input
                            type="time"
                            value={day.morningEnd}
                            onChange={(e) => handleDayChange(index, 'morningEnd', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">🌆 Tarde - Entrada</label>
                          <input
                            type="time"
                            value={day.afternoonStart}
                            onChange={(e) => handleDayChange(index, 'afternoonStart', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-medium mb-1">🌆 Tarde - Salida</label>
                          <input
                            type="time"
                            value={day.afternoonEnd}
                            onChange={(e) => handleDayChange(index, 'afternoonEnd', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs text-brand-medium font-semibold">Pausas</label>
                      <button
                        type="button"
                        onClick={() => addBreak(index)}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                      >
                        + Añadir Pausa
                      </button>
                    </div>
                    {day.breaks && day.breaks.length > 0 ? (
                      <div className="space-y-2">
                        {day.breaks.map((breakItem, breakIndex) => (
                          <div key={breakIndex} className="bg-white p-3 rounded border border-neutral-mid/20">
                            <div className="grid grid-cols-6 gap-2 items-end">
                              <div className="col-span-2">
                                <label className="block text-xs text-brand-medium mb-1">Nombre</label>
                                <input
                                  type="text"
                                  value={breakItem.name}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                                  placeholder="Ej: Café"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-brand-medium mb-1">Inicio</label>
                                <input
                                  type="time"
                                  value={breakItem.startTime}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'startTime', e.target.value)}
                                  className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-brand-medium mb-1">Fin</label>
                                <input
                                  type="time"
                                  value={breakItem.endTime}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'endTime', e.target.value)}
                                  className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-brand-medium mb-1">Tipo</label>
                                <select
                                  value={breakItem.breakType}
                                  onChange={(e) => handleBreakChange(index, breakIndex, 'breakType', e.target.value)}
                                  className="w-full px-2 py-1 border border-neutral-mid/30 rounded text-sm"
                                >
                                  {breakTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="flex items-center space-x-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={breakItem.isPaid}
                                    onChange={(e) => handleBreakChange(index, breakIndex, 'isPaid', e.target.checked)}
                                    className="rounded border-neutral-mid/30"
                                  />
                                  Pagada
                                </label>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeBreak(index, breakIndex)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  title="Eliminar pausa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-medium italic">No hay pausas configuradas</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-mid/20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
        >
          Crear Horario Personalizado
        </button>
      </div>
    </form>
  );
};

export default AdminDashboard;
