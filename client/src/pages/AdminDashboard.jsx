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
  Plus,
  QrCode,
  BarChart3,
  FileText,
  Shield,
  Filter,
  Download,
  Brain,
  LogIn,
  LogOut,
  File,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import Layout from '../components/Layout';
import AbsenceCategoryManager from '../components/AbsenceCategoryManager';

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
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Si es 401 (Unauthorized), limpiar sesión y redirigir al login
  if (response.status === 401) {
    console.warn('⚠️ Sesión expirada o no autorizado. Redirigiendo al login...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Mostrar mensaje al usuario
    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    
    // Redirigir al login
    window.location.href = '/login';
  }
  
  return response;
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    { id: 'absence-categories', label: 'Categorías Ausencias', icon: FileText },
    { id: 'weekly', label: 'Vista Semanal', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: File },
  ];

  const aiTabs = aiUtilsEnabled ? [
    //{ id: 'ai-insights', label: 'IA Insights', icon: BarChart3 },
    { id: 'ai-knowledge', label: 'Gestión IA', icon: Brain },
  ] : [];

  const tabs = [
    ...baseTabs,
    ...aiTabs,
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  return (
    <Layout isAdmin={true} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'employees' && <EmployeesContent />}
        {activeTab === 'records' && <RecordsContent />}
        {activeTab === 'weekly-schedules' && <WeeklySchedulesContent />}
        {activeTab === 'vacations' && <VacationsContent />}
        {activeTab === 'absence-categories' && <AbsenceCategoryManager />}
        {activeTab === 'weekly' && <WeeklyViewContent />}
        {activeTab === 'documents' && <DocumentsManagementContent />}
        {activeTab === 'ai-knowledge' && aiUtilsEnabled && <AIKnowledgeContent />}
        {activeTab === 'settings' && <SettingsContent />}
      </div>
      
      <Footer />
      
      {/* AI Chat Component */}
      <AIChat userId={user?.id} userRole="admin" />
    </Layout>
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
        const activeEmps = employees.filter(emp => emp.isActive);
        totalEmployees = employees.length;
        activeEmployees = activeEmps.length;
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
      const inactiveEmployees = totalEmployees - activeEmployees;
      
      setStats([
        { 
          label: 'Total Empleados', 
          value: totalEmployees.toString(), 
          change: totalEmployees > 0 ? `${inactiveEmployees} inactivos` : '', 
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
          change: `${activeEmployees} trabajando`, 
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHoursComparisonModal, setShowHoursComparisonModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [showInactive, setShowInactive] = useState(true); // Mostrar empleados inactivos por defecto

  // Cargar empleados con sus últimos registros y estadísticas de horas
  const fetchEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      
      if (response.ok) {
        const employeesData = await response.json();
        setEmployees(employeesData);
        
        // Obtener último registro y estadísticas de horas para cada empleado
        const employeesWithLastRecord = await Promise.all(
          employeesData.map(async (employee) => {
            try {
              // Obtener último registro
              const recordsResponse = await authenticatedFetch(`${getApiUrl()}/records/employee/${employee.id}?limit=1`);
              let lastRecord = null;
              if (recordsResponse.ok) {
                const records = await recordsResponse.json();
                lastRecord = records.length > 0 ? records[0] : null;
              }
              
              // Obtener estadísticas de horas
              const statsResponse = await authenticatedFetch(`${getApiUrl()}/records/employee/${employee.id}/hours-stats`);
              let hoursStats = null;
              if (statsResponse.ok) {
                hoursStats = await statsResponse.json();
              }
              
              return {
                ...employee,
                lastRecord,
                hoursStats
              };
            } catch (error) {
              console.error(`Error fetching data for employee ${employee.id}:`, error);
              return {
                ...employee,
                lastRecord: null,
                hoursStats: null
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
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark font-serif">
            Gestión de Empleados
          </h2>
          <div className="mt-2 flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-brand-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-brand-medium text-brand-light focus:ring-brand-light"
              />
              <span>Mostrar empleados inactivos</span>
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Botones de exportación CSV */}
          <div className="relative group">
            <button
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="py-2">
                <button
                  onClick={async () => {
                    try {
                      const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
                      const endDate = new Date().toISOString().split('T')[0];
                      const response = await authenticatedFetch(`${getApiUrl()}/records/export/audit?startDate=${startDate}&endDate=${endDate}`);
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `auditoria_${startDate}_${endDate}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } else {
                        alert('Error al exportar auditoría');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Error al exportar');
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📋 Auditoría (último mes)
                </button>
                <button
                  onClick={async () => {
                    try {
                      const month = new Date().getMonth() + 1;
                      const year = new Date().getFullYear();
                      const response = await authenticatedFetch(`${getApiUrl()}/records/export/summary?month=${month}&year=${year}`);
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `resumen_${month}_${year}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } else {
                        alert('Error al exportar resumen');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Error al exportar');
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📊 Resumen mensual
                </button>
                <button
                  onClick={async () => {
                    try {
                      const year = new Date().getFullYear();
                      const response = await authenticatedFetch(`${getApiUrl()}/records/export/vacations?year=${year}`);
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `vacaciones_${year}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } else {
                        alert('Error al exportar vacaciones');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Error al exportar');
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🏖️ Vacaciones del año
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </button>
        </div>
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

      {/* Edit Employee Modal */}
      {showEditForm && selectedEmployee && (
        <EditEmployeeModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowEditForm(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedEmployee(null);
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
                Horas Trabajadas
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
            ) : employeesWithRecords.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-brand-medium">
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              employeesWithRecords
                .filter(employee => showInactive || employee.isActive)
                .map((employee) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                    {employee.hoursStats ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-brand-medium">Hoy:</span>
                          <span className="text-xs font-semibold text-neutral-dark">
                            {employee.hoursStats.today.hours}h {employee.hoursStats.today.minutes}m
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-brand-medium">Semana:</span>
                          <span className="text-xs font-semibold text-neutral-dark">
                            {employee.hoursStats.week.hours}h {employee.hoursStats.week.minutes}m
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-brand-medium">Mes:</span>
                          <span className="text-xs font-semibold text-neutral-dark">
                            {employee.hoursStats.month.hours}h {employee.hoursStats.month.minutes}m
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin datos</span>
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
                    <button 
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowHoursComparisonModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-brand-light text-brand-cream rounded hover:bg-brand-medium transition-colors"
                      title="Ver Análisis de Horas"
                    >
                      📊 Análisis
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowEditForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar Empleado"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={async () => {
                        const action = employee.isActive ? 'desactivar' : 'activar';
                        if (confirm(`¿Estás seguro de que quieres ${action} a ${employee.name}?`)) {
                          try {
                            const response = await authenticatedFetch(`${getApiUrl()}/employees/${employee.id}/toggle-active`, {
                              method: 'PATCH'
                            });
                            
                            if (response.ok) {
                              alert(`✅ Empleado ${action === 'desactivar' ? 'desactivado' : 'activado'} correctamente`);
                              fetchEmployees();
                            } else {
                              const error = await response.json();
                              alert(`❌ Error: ${error.error || 'No se pudo actualizar el empleado'}`);
                            }
                          } catch (error) {
                            console.error('Error actualizando empleado:', error);
                            alert('❌ Error al actualizar el empleado');
                          }
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        employee.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={employee.isActive ? 'Desactivar Empleado' : 'Activar Empleado'}
                    >
                      {employee.isActive ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hours Comparison Modal */}
      {showHoursComparisonModal && selectedEmployee && (
        <HoursComparisonModal
          employee={selectedEmployee}
          onClose={() => {
            setShowHoursComparisonModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
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
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedEmployee, filter]);

  const filterRecordsByDate = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    // Calcular el lunes de esta semana correctamente (domingo = 0, lunes = 1, etc.)
    // Si es domingo (0), retroceder 6 días; si no, retroceder (día - 1) días
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(today.getDate() - daysToMonday);
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
    if (!timestamp) return '--:--';
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      return '--:--';
    }
  };

  // Group records by day
  const groupRecordsByDay = (records) => {
    const grouped = {};
    
    records.forEach(record => {
      if (!record.timestamp) return;
      try {
        const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(record);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
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

  // Función para exportar toda la BD a CSV
  const handleExportAll = async () => {
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      const token = localStorage.getItem('token');
      const baseUrl = getApiUrl();
      
      // Obtener todos los datos en paralelo
      const [recordsRes, employeesRes, vacationsRes, schedulesRes, templatesRes] = await Promise.all([
        authenticatedFetch(`${baseUrl}/records/all`),
        authenticatedFetch(`${baseUrl}/employees`),
        authenticatedFetch(`${baseUrl}/vacations`),
        authenticatedFetch(`${baseUrl}/weekly-schedules`),
        authenticatedFetch(`${baseUrl}/schedule-templates`)
      ]);

      const allRecords = recordsRes.ok ? await recordsRes.json() : { records: [] };
      const allEmployees = employeesRes.ok ? await employeesRes.json() : [];
      const allVacations = vacationsRes.ok ? await vacationsRes.json() : { vacations: [] };
      const allSchedules = schedulesRes.ok ? await schedulesRes.json() : { schedules: [] };
      const allTemplates = templatesRes.ok ? await templatesRes.json() : { templates: [] };

      // Helper para escapar CSV
      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Generar CSV de Registros
      let csv = '=== REGISTROS DE FICHAJES ===\n';
      csv += 'ID,Empleado,Código,Tipo,Fecha,Hora,Dispositivo,Notas\n';
      const recordsData = allRecords.records || allRecords || [];
      recordsData.forEach(r => {
        const date = r.timestamp ? new Date(r.timestamp) : null;
        csv += [
          escapeCSV(r.id),
          escapeCSV(r.employee?.name || r.Employee?.name || ''),
          escapeCSV(r.employee?.employeeCode || r.Employee?.employeeCode || ''),
          escapeCSV(r.type === 'checkin' ? 'Entrada' : 'Salida'),
          escapeCSV(date ? date.toLocaleDateString('es-ES') : ''),
          escapeCSV(date ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''),
          escapeCSV(r.device || ''),
          escapeCSV(r.notes || '')
        ].join(',') + '\n';
      });

      // Generar CSV de Empleados
      csv += '\n=== EMPLEADOS ===\n';
      csv += 'ID,Nombre,Código,Email,Rol,Activo,Fecha Creación\n';
      const employeesData = Array.isArray(allEmployees) ? allEmployees : (allEmployees.employees || []);
      employeesData.forEach(e => {
        csv += [
          escapeCSV(e.id),
          escapeCSV(e.name),
          escapeCSV(e.employeeCode),
          escapeCSV(e.email || ''),
          escapeCSV(e.role),
          escapeCSV(e.isActive ? 'Sí' : 'No'),
          escapeCSV(e.createdAt ? new Date(e.createdAt).toLocaleDateString('es-ES') : '')
        ].join(',') + '\n';
      });

      // Generar CSV de Vacaciones
      csv += '\n=== VACACIONES Y AUSENCIAS ===\n';
      csv += 'ID,Empleado,Código,Fecha Inicio,Fecha Fin,Tipo,Estado,Motivo\n';
      const vacationsData = Array.isArray(allVacations) ? allVacations : (allVacations.vacations || []);
      vacationsData.forEach(v => {
        csv += [
          escapeCSV(v.id),
          escapeCSV(v.employee?.name || v.Employee?.name || ''),
          escapeCSV(v.employee?.employeeCode || v.Employee?.employeeCode || ''),
          escapeCSV(v.startDate ? new Date(v.startDate).toLocaleDateString('es-ES') : ''),
          escapeCSV(v.endDate ? new Date(v.endDate).toLocaleDateString('es-ES') : ''),
          escapeCSV(v.type || 'vacaciones'),
          escapeCSV(v.status || ''),
          escapeCSV(v.reason || '')
        ].join(',') + '\n';
      });

      // Generar CSV de Horarios Semanales
      csv += '\n=== HORARIOS SEMANALES ASIGNADOS ===\n';
      csv += 'ID,Empleado,Año,Semana,Plantilla,Fecha Inicio,Fecha Fin\n';
      const schedulesData = Array.isArray(allSchedules) ? allSchedules : (allSchedules.schedules || []);
      schedulesData.forEach(s => {
        csv += [
          escapeCSV(s.id),
          escapeCSV(s.employee?.name || s.Employee?.name || ''),
          escapeCSV(s.year),
          escapeCSV(s.weekNumber),
          escapeCSV(s.template?.name || s.ScheduleTemplate?.name || ''),
          escapeCSV(s.startDate ? new Date(s.startDate).toLocaleDateString('es-ES') : ''),
          escapeCSV(s.endDate ? new Date(s.endDate).toLocaleDateString('es-ES') : '')
        ].join(',') + '\n';
      });

      // Generar CSV de Plantillas de Horario
      csv += '\n=== PLANTILLAS DE HORARIO ===\n';
      csv += 'ID,Nombre,Descripción,Horas Semanales,Activa\n';
      const templatesData = Array.isArray(allTemplates) ? allTemplates : (allTemplates.templates || []);
      templatesData.forEach(t => {
        csv += [
          escapeCSV(t.id),
          escapeCSV(t.name),
          escapeCSV(t.description || ''),
          escapeCSV(t.weeklyHours || ''),
          escapeCSV(t.isActive ? 'Sí' : 'No')
        ].join(',') + '\n';
      });

      // Descargar el archivo
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jarana_export_completo_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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
          
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button
                    onClick={handleExportAll}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📊 Exportar TODO (CSV)
                  </button>
                </div>
              </div>
            )}
          </div>
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
                        {date ? format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : 'Fecha no disponible'}
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vacation.category ? (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${vacation.category.color}20`, color: vacation.category.color }}
                        >
                          {vacation.category.icon}
                        </div>
                        <span className="text-sm text-neutral-dark">{vacation.category.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-dark">{getTypeLabel(vacation.type)}</span>
                    )}
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

  // Array de días ordenado: Lunes a Domingo
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Get week dates (Monday to Sunday)
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
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
                    // Convertir de JavaScript (0=Domingo) a nuestro formato (0=Lunes)
                    const jsDayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
                    const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1; // 0=Lunes, ..., 6=Domingo
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
                defaultValue="AliadaDigital"
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
  const [nextCode, setNextCode] = useState({ nextCode: 'EMP01', prefix: 'EMP', number: 1 });
  const [loadingCode, setLoadingCode] = useState(true);

  // Obtener el próximo código de empleado al montar el componente
  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const response = await authenticatedFetch(`${getApiUrl()}/admin/next-employee-code?role=employee`);
        if (response.ok) {
          const data = await response.json();
          setNextCode(data);
        }
      } catch (err) {
        console.error('Error fetching next code:', err);
      } finally {
        setLoadingCode(false);
      }
    };
    
    fetchNextCode();
  }, []);

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
          {/* Código de empleado (informativo) */}
          <div className="bg-brand-light/10 border border-brand-light/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-dark">Código de empleado</p>
                <p className="text-xs text-neutral-mid mt-1">Se asignará automáticamente</p>
              </div>
              <div className="text-right">
                {loadingCode ? (
                  <span className="text-sm text-neutral-mid">Cargando...</span>
                ) : (
                  <span className="text-lg font-bold text-brand-dark">{nextCode.nextCode}</span>
                )}
              </div>
            </div>
          </div>

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

// Edit Employee Modal
const EditEmployeeModal = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: employee.name || '',
    email: employee.email || '',
    isActive: employee.isActive !== undefined ? employee.isActive : true,
    pin: '' // PIN vacío por defecto, solo se cambia si el usuario lo rellena
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Solo enviar PIN si se ha rellenado
      const updateData = {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive
      };
      
      if (formData.pin && formData.pin.length >= 4) {
        updateData.pin = formData.pin;
      }

      const response = await authenticatedFetch(`${getApiUrl()}/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando empleado');
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
          Editar Empleado
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
              Nuevo PIN (opcional, 4-8 dígitos)
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
              minLength="4"
              maxLength="8"
              placeholder="Dejar vacío para no cambiar"
            />
            <p className="text-xs text-brand-medium mt-1">
              Solo rellena este campo si quieres cambiar el PIN
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-neutral-mid/30"
              />
              <span className="text-sm font-medium text-neutral-dark">
                Empleado Activo
              </span>
            </label>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
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

  // Array de días: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
  const daysOfWeek = [
    { id: 0, name: 'Lunes' },
    { id: 1, name: 'Martes' },
    { id: 2, name: 'Miércoles' },
    { id: 3, name: 'Jueves' },
    { id: 4, name: 'Viernes' },
    { id: 5, name: 'Sábado' },
    { id: 6, name: 'Domingo' }
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
              isWorkingDay: day.id >= 0 && day.id <= 4, // Monday to Friday by default (Lunes a Viernes)
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
            isWorkingDay: day.id >= 0 && day.id <= 4,
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
          isWorkingDay: day.id >= 0 && day.id <= 4,
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
    const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc'];
    const hasAllowedExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (file && hasAllowedExtension) {
      // Verificar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setSelectedFile(file);
    } else {
      alert('Solo se permiten archivos .txt, .pdf, .docx, .doc');
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
            accept=".txt,.pdf,.docx,.doc"
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
          Formatos soportados: .txt, .pdf, .docx, .doc (máx. 10MB). El documento se procesará automáticamente.
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
                                    // 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
                                    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
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
                                      .map(d => ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][d.dayOfWeek])
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
                        <button
                          onClick={async () => {
                            if (confirm(`¿Estás seguro de que quieres eliminar la plantilla "${template.name}"?`)) {
                              try {
                                const response = await authenticatedFetch(`${getApiUrl()}/schedule-templates/${template.id}`, {
                                  method: 'DELETE'
                                });
                                
                                if (response.ok) {
                                  alert('✅ Plantilla eliminada correctamente');
                                  fetchTemplates();
                                } else {
                                  const error = await response.json();
                                  alert(`❌ Error: ${error.error || 'No se pudo eliminar la plantilla'}`);
                                }
                              } catch (error) {
                                console.error('Error eliminando plantilla:', error);
                                alert('❌ Error al eliminar la plantilla');
                              }
                            }
                          }}
                          className="px-3 py-1 text-sm text-red-500 hover:text-red-700"
                        >
                          🗑️ Eliminar
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
  // Crear días empezando por Lunes (0=Lunes, 1=Martes, ..., 6=Domingo)
  const initializeDays = () => {
    // Siempre crear días nuevos empezando por Lunes, sin importar si es edición o creación
    const days = [
      { dayOfWeek: 0, isWorkingDay: true, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 1, isWorkingDay: true, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 2, isWorkingDay: true, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 3, isWorkingDay: true, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 4, isWorkingDay: true, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 5, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 6, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] }
    ];
    console.log('🆕 initializeDays:', days);
    return days;
  };

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    days: initializeDays()
  });

  // Cargar datos de la plantilla cuando se edita
  useEffect(() => {
    if (template && template.templateDays && template.templateDays.length > 0) {
      console.log('📝 Cargando plantilla existente:', template);
      
      // Crear un array de 7 días con valores por defecto
      const days = initializeDays();
      
      // Actualizar con los datos de la plantilla
      template.templateDays.forEach(templateDay => {
        const dayIndex = templateDay.dayOfWeek;
        if (dayIndex >= 0 && dayIndex <= 6) {
          days[dayIndex] = {
            dayOfWeek: templateDay.dayOfWeek,
            isWorkingDay: templateDay.isWorkingDay,
            isSplitSchedule: templateDay.isSplitSchedule || false,
            startTime: templateDay.startTime || '09:00',
            endTime: templateDay.endTime || '18:00',
            morningStart: templateDay.morningStart || '09:00',
            morningEnd: templateDay.morningEnd || '14:00',
            afternoonStart: templateDay.afternoonStart || '16:00',
            afternoonEnd: templateDay.afternoonEnd || '20:00',
            notes: templateDay.notes || '',
            breaks: templateDay.breaks || []
          };
        }
      });
      
      console.log('✅ Días cargados:', days);
      
      setFormData({
        name: template.name || '',
        description: template.description || '',
        days: days
      });
    }
  }, [template]);

  // Array de nombres de días: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
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
      
      // Limpiar los días para enviar solo los campos necesarios
      const cleanedDays = formData.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        isWorkingDay: day.isWorkingDay,
        isSplitSchedule: day.isSplitSchedule,
        startTime: day.startTime || null,
        endTime: day.endTime || null,
        breakStartTime: day.breakStartTime || null,
        breakEndTime: day.breakEndTime || null,
        morningStart: day.morningStart || null,
        morningEnd: day.morningEnd || null,
        afternoonStart: day.afternoonStart || null,
        afternoonEnd: day.afternoonEnd || null,
        notes: day.notes || null,
        breaks: day.breaks || []
      }));
      
      console.log('🔍 formData.days antes de limpiar:', formData.days);
      console.log('🧹 cleanedDays:', cleanedDays);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        createdBy: user?.id,
        templateDays: cleanedDays
      };
      
      console.log('📤 Enviando plantilla:', { url, method: template ? 'PUT' : 'POST', payload });
      
      const response = await authenticatedFetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Plantilla guardada:', result);
        alert(template ? 'Plantilla actualizada correctamente' : 'Plantilla creada correctamente');
        onClose(); // Esto llamará a fetchTemplates() en el componente padre
      } else {
        const error = await response.json();
        console.error('❌ Error del servidor:', error);
        alert(`Error: ${error.error || 'No se pudo guardar la plantilla'}`);
      }
    } catch (error) {
      console.error('❌ Error al guardar plantilla:', error);
      alert('Error al guardar la plantilla. Revisa la consola para más detalles.');
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
    days: [
      { dayOfWeek: 0, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 1, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 2, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 3, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 4, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 5, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] },
      { dayOfWeek: 6, isWorkingDay: false, isSplitSchedule: false, startTime: '09:00', endTime: '18:00', morningStart: '09:00', morningEnd: '14:00', afternoonStart: '16:00', afternoonEnd: '20:00', notes: '', breaks: [] }
    ]
  });

  // Array de nombres de días: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
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

// Hours Comparison Modal Component
const HoursComparisonModal = ({ employee, onClose }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await authenticatedFetch(`${getApiUrl()}/records/employee/${employee.id}/hours-comparison`);
        if (response.ok) {
          const data = await response.json();
          setComparison(data);
        } else {
          console.error('Error fetching hours comparison');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [employee.id]);

  const renderPeriodComparison = (title, period) => {
    if (!period) return null;

    const isOvertime = period.difference.isPositive;
    const percentageColor = period.percentage >= 100 ? 'text-green-600' : 'text-red-600';

    return (
      <div className="bg-neutral-light/30 rounded-lg p-4 border border-neutral-mid/10">
        <h4 className="font-semibold text-neutral-dark mb-3">{title}</h4>
        
        <div className="space-y-3">
          {/* Horas Estimadas */}
          <div className="flex items-center justify-between p-3 bg-white rounded border border-neutral-mid/20">
            <div>
              <div className="text-xs text-brand-medium font-medium mb-1">Horas Estimadas</div>
              <div className="text-2xl font-bold text-neutral-dark">
                {period.estimated.hours}h {period.estimated.minutes}m
              </div>
            </div>
            <div className="text-3xl">📋</div>
          </div>

          {/* Horas Reales */}
          <div className="flex items-center justify-between p-3 bg-white rounded border border-neutral-mid/20">
            <div>
              <div className="text-xs text-brand-medium font-medium mb-1">Horas Trabajadas</div>
              <div className="text-2xl font-bold text-neutral-dark">
                {period.actual.hours}h {period.actual.minutes}m
              </div>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>

          {/* Diferencia */}
          <div className={`flex items-center justify-between p-3 rounded border-2 ${
            isOvertime ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div>
              <div className="text-xs font-medium mb-1">
                {isOvertime ? '✅ Horas Extra' : '⚠️ Déficit'}
              </div>
              <div className={`text-2xl font-bold ${isOvertime ? 'text-green-700' : 'text-red-700'}`}>
                {isOvertime ? '+' : '-'}{period.difference.hours}h {period.difference.minutes}m
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-dark/60 mb-1">Cumplimiento</div>
              <div className={`text-2xl font-bold ${percentageColor}`}>
                {period.percentage}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-mid/20 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-neutral-dark font-serif">
                📊 Análisis de Horas Trabajadas
              </h3>
              <p className="text-sm text-brand-medium mt-1">
                {employee.name} - {employee.employeeCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-brand-medium hover:text-neutral-dark text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">ℹ️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">¿Cómo se calculan las horas?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Horas Estimadas:</strong> Basadas en el horario asignado al empleado</li>
                      <li>• <strong>Horas Trabajadas:</strong> Calculadas desde los registros de entrada/salida</li>
                      <li>• <strong>Diferencia:</strong> Horas extra (positivo) o déficit (negativo)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Today */}
              {renderPeriodComparison('📅 Hoy', comparison.today)}

              {/* This Week */}
              {renderPeriodComparison('📆 Esta Semana', comparison.week)}

              {/* This Month */}
              {renderPeriodComparison('📊 Este Mes', comparison.month)}
            </div>
          ) : (
            <div className="text-center py-12 text-brand-medium">
              No se pudieron cargar los datos de comparación
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-mid/20 bg-neutral-light/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS MANAGEMENT CONTENT
// ============================================

const DocumentsManagementContent = () => {
  const [view, setView] = useState('pending'); // 'pending', 'all', 'send'
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Filtros para vista "Todos los Documentos"
  const [filters, setFilters] = useState({
    employeeId: '',
    documentType: '',
    month: '',
    year: '', // Sin filtro de año por defecto para mostrar TODOS los documentos
    direction: '', // Por defecto mostrar TODOS los documentos (sin filtro de dirección)
    search: ''
  });

  // Form state para enviar documentos
  const [sendForm, setSendForm] = useState({
    title: '',
    description: '',
    documentType: 'nomina',
    recipientId: '',
    priority: 'normal',
    expiresAt: '',
    file: null
  });

  // Form state para revisar documentos
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    reviewNotes: ''
  });

  useEffect(() => {
    loadPendingDocuments();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (view === 'all') {
      loadAllDocuments();
    }
  }, [view, filters]);

  const loadPendingDocuments = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/documents/pending-from-employees`);
      if (response.ok) {
        const data = await response.json();
        setPendingDocuments(data);
      }
    } catch (error) {
      console.error('Error loading pending documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await authenticatedFetch(`${getApiUrl()}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.filter(emp => emp.role === 'employee'));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadAllDocuments = async () => {
    setLoading(true);
    try {
      // Construir query params
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.documentType) params.append('documentType', filters.documentType);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.direction) params.append('direction', filters.direction);
      if (filters.search) params.append('search', filters.search);

      console.log('Loading documents with filters:', filters);
      const response = await authenticatedFetch(`${getApiUrl()}/documents/all?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Documents loaded:', data.length, data);
        setAllDocuments(data);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
      }
    } catch (error) {
      console.error('Error loading all documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setSendForm({ ...sendForm, file });
    }
  };

  const handleSendDocument = async (e) => {
    e.preventDefault();
    
    if (!sendForm.file || !sendForm.title) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', sendForm.file);
      formData.append('title', sendForm.title);
      formData.append('description', sendForm.description);
      formData.append('documentType', sendForm.documentType);
      formData.append('priority', sendForm.priority);
      if (sendForm.recipientId) {
        formData.append('recipientId', sendForm.recipientId);
      }
      if (sendForm.expiresAt) {
        formData.append('expiresAt', sendForm.expiresAt);
      }

      const response = await authenticatedFetch(`${getApiUrl()}/documents/admin-to-employee`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Documento enviado correctamente');
        setShowSendModal(false);
        setSendForm({
          title: '',
          description: '',
          documentType: 'nomina',
          recipientId: '',
          priority: 'normal',
          expiresAt: '',
          file: null
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo enviar el documento'}`);
      }
    } catch (error) {
      console.error('Error sending document:', error);
      alert('Error al enviar el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedDocument) return;

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/documents/${selectedDocument.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });

      if (response.ok) {
        alert('Documento revisado correctamente');
        setShowReviewModal(false);
        setSelectedDocument(null);
        setReviewForm({ status: 'approved', reviewNotes: '' });
        loadPendingDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo revisar el documento'}`);
      }
    } catch (error) {
      console.error('Error reviewing document:', error);
      alert('Error al revisar el documento');
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

  const openReviewModal = (doc) => {
    setSelectedDocument(doc);
    setReviewForm({ status: 'approved', reviewNotes: '' });
    setShowReviewModal(true);
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
          <h2 className="text-2xl font-bold text-neutral-dark">Gestión de Documentos</h2>
          <p className="text-brand-medium mt-1">Administra documentos de empleados y envía comunicaciones</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Enviar Documento</span>
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-2 border-b border-neutral-mid/20">
        <button
          onClick={() => setView('pending')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            view === 'pending'
              ? 'border-brand-light text-brand-light'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Pendientes</span>
            {pendingDocuments.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingDocuments.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            view === 'all'
              ? 'border-brand-light text-brand-light'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Todos los Documentos</span>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes de Revisión</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingDocuments.length}</p>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{employees.length}</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documentos Urgentes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {pendingDocuments.filter(d => d.priority === 'urgent').length}
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <File className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Documents List */}
      {view === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20">
          <div className="p-6 border-b border-neutral-mid/20">
            <h3 className="text-lg font-semibold text-neutral-dark">Documentos Pendientes de Revisión</h3>
          </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : pendingDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">No hay documentos pendientes de revisión</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-mid/20">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-neutral-light/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-dark">{doc.title}</h4>
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
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {doc.sender?.name} ({doc.sender?.employeeCode})
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
                      onClick={() => handleDownload(doc.id, doc.originalName)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openReviewModal(doc)}
                      className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* All Documents View with Filters */}
      {view === 'all' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Empleado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                >
                  <option value="">Todos los empleados</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={filters.documentType}
                  onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                >
                  <option value="">Todos los tipos</option>
                  <option value="nomina">Nómina</option>
                  <option value="contrato">Contrato</option>
                  <option value="politica">Política</option>
                  <option value="notificacion">Notificación</option>
                  <option value="baja_medica">Baja Médica</option>
                  <option value="justificante">Justificante</option>
                  <option value="certificado">Certificado</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                >
                  <option value="">Todos los meses</option>
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>

              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                >
                  <option value="">Todos los años</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <select
                  value={filters.direction}
                  onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                >
                  <option value="">Todos</option>
                  <option value="admin_to_employee">Admin → Empleado</option>
                  <option value="employee_to_admin">Empleado → Admin</option>
                </select>
              </div>

              {/* Búsqueda */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Buscar por título o descripción..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                />
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    employeeId: '',
                    documentType: '',
                    month: '',
                    year: '',
                    direction: '',
                    search: ''
                  })}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20">
            <div className="p-6 border-b border-neutral-mid/20">
              <h3 className="text-lg font-semibold text-neutral-dark">
                Documentos ({allDocuments.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : allDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron documentos con los filtros seleccionados</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-mid/20">
                {allDocuments.map((doc) => (
                  <div key={doc.id} className="p-6 hover:bg-neutral-light/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-neutral-dark">{doc.title}</h4>
                          {getStatusBadge(doc.status)}
                          {getPriorityBadge(doc.priority)}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <File className="h-4 w-4 mr-1" />
                            {getDocumentTypeLabel(doc.documentType)}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {doc.direction === 'admin_to_employee' 
                              ? `Para: ${doc.recipient?.name || 'Todos'}`
                              : `De: ${doc.sender?.name}`
                            }
                          </span>
                          <span>
                            {doc.createdAt || doc.created_at 
                              ? format(new Date(doc.createdAt || doc.created_at), "d 'de' MMMM, yyyy", { locale: es })
                              : 'Fecha no disponible'
                            }
                          </span>
                          {doc.reviewedAt && (
                            <span className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Revisado por {doc.reviewer?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDownload(doc.id, doc.originalName)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        {doc.direction === 'employee_to_admin' && doc.status === 'pending' && (
                          <button
                            onClick={() => openReviewModal(doc)}
                            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors"
                          >
                            Revisar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Document Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-dark">Enviar Documento a Empleado(s)</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSendDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={sendForm.title}
                    onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    placeholder="Ej: Nómina de Noviembre 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={sendForm.description}
                    onChange={(e) => setSendForm({ ...sendForm, description: e.target.value })}
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
                      value={sendForm.documentType}
                      onChange={(e) => setSendForm({ ...sendForm, documentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    >
                      <option value="nomina">Nómina</option>
                      <option value="contrato">Contrato</option>
                      <option value="politica">Política</option>
                      <option value="notificacion">Notificación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={sendForm.priority}
                      onChange={(e) => setSendForm({ ...sendForm, priority: e.target.value })}
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
                    Destinatario
                  </label>
                  <select
                    value={sendForm.recipientId}
                    onChange={(e) => setSendForm({ ...sendForm, recipientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                  >
                    <option value="">Todos los empleados</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Deja en blanco para enviar a todos los empleados
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Expiración (Opcional)
                  </label>
                  <input
                    type="date"
                    value={sendForm.expiresAt}
                    onChange={(e) => setSendForm({ ...sendForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                  />
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
                  {sendForm.file && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {sendForm.file.name} ({(sendForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
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
                    {uploading ? 'Enviando...' : 'Enviar Documento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Document Modal */}
      {showReviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-dark">Revisar Documento</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Document Info */}
              <div className="mb-6 p-4 bg-neutral-light rounded-lg">
                <h4 className="font-semibold text-neutral-dark mb-2">{selectedDocument.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>De:</strong> {selectedDocument.sender?.name} ({selectedDocument.sender?.employeeCode})</p>
                  <p><strong>Tipo:</strong> {getDocumentTypeLabel(selectedDocument.documentType)}</p>
                  <p><strong>Fecha:</strong> {
                    selectedDocument.createdAt || selectedDocument.created_at 
                      ? format(new Date(selectedDocument.createdAt || selectedDocument.created_at), "d 'de' MMMM, yyyy", { locale: es })
                      : 'Fecha no disponible'
                  }</p>
                  {selectedDocument.description && (
                    <p><strong>Descripción:</strong> {selectedDocument.description}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleReviewDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                  >
                    <option value="reviewed">Revisado</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de Revisión
                  </label>
                  <textarea
                    value={reviewForm.reviewNotes}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-light focus:border-brand-light"
                    rows="4"
                    placeholder="Añade comentarios sobre la revisión..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
                  >
                    Guardar Revisión
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

export default AdminDashboard;
