import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmployeeCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vacations, setVacations] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Festivos españoles 2024-2025 (ejemplo)
  const spanishHolidays = [
    { date: '2024-01-01', name: 'Año Nuevo' },
    { date: '2024-01-06', name: 'Reyes Magos' },
    { date: '2024-03-29', name: 'Viernes Santo' },
    { date: '2024-05-01', name: 'Día del Trabajador' },
    { date: '2024-08-15', name: 'Asunción de la Virgen' },
    { date: '2024-10-12', name: 'Fiesta Nacional' },
    { date: '2024-11-01', name: 'Todos los Santos' },
    { date: '2024-12-06', name: 'Día de la Constitución' },
    { date: '2024-12-25', name: 'Navidad' },
    { date: '2025-01-01', name: 'Año Nuevo' },
    { date: '2025-01-06', name: 'Reyes Magos' },
    { date: '2025-04-18', name: 'Viernes Santo' },
    { date: '2025-05-01', name: 'Día del Trabajador' },
    { date: '2025-08-15', name: 'Asunción de la Virgen' },
    { date: '2025-10-12', name: 'Fiesta Nacional' },
    { date: '2025-11-01', name: 'Todos los Santos' },
    { date: '2025-12-06', name: 'Día de la Constitución' },
    { date: '2025-12-25', name: 'Navidad' },
  ];

  useEffect(() => {
    fetchVacations();
    setHolidays(spanishHolidays);
  }, [currentDate, user]);

  const fetchVacations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const response = await fetch(
        `http://localhost:3000/api/vacations/employee/${user.id}?year=${year}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVacations(data.filter(v => v.status === 'approved'));
      }
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para que la semana empiece en lunes (0=Lun, 6=Dom)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const days = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isHoliday = (date) => {
    const dateStr = getDateString(date);
    return holidays.find(h => h.date === dateStr);
  };

  const isVacation = (date) => {
    const dateStr = getDateString(date);
    return vacations.find(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const getDayInfo = (date) => {
    const holiday = isHoliday(date);
    const vacation = isVacation(date);
    
    if (holiday) {
      return { type: 'holiday', label: holiday.name, color: 'bg-red-100 border-red-300 text-red-700' };
    }
    if (vacation) {
      const category = vacation.category;
      if (category) {
        return { 
          type: 'vacation', 
          label: category.name,
          icon: category.icon,
          color: `bg-[${category.color}]/10 border-[${category.color}] text-[${category.color}]`
        };
      }
      return { type: 'vacation', label: 'Vacaciones', color: 'bg-blue-100 border-blue-300 text-blue-700' };
    }
    return null;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="text-brand-light" size={24} />
          <h2 className="text-2xl font-bold text-neutral-dark font-serif">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={20} className="text-brand-medium" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors"
          >
            Hoy
          </button>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={20} className="text-brand-medium" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span className="text-brand-medium">Festivos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-brand-medium">Vacaciones/Ausencias</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-brand-light/20 border border-brand-light"></div>
          <span className="text-brand-medium">Hoy</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-brand-medium py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayInfo = getDayInfo(day.date);
          const today = isToday(day.date);
          
          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 rounded-lg border transition-all ${
                !day.isCurrentMonth
                  ? 'bg-neutral-light/30 border-transparent text-brand-medium/40'
                  : today
                  ? 'bg-brand-light/20 border-brand-light shadow-md'
                  : dayInfo
                  ? dayInfo.color
                  : 'bg-white border-neutral-mid/20 hover:border-brand-light/50'
              }`}
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-medium ${
                  today ? 'text-brand-dark font-bold' : 
                  !day.isCurrentMonth ? 'text-brand-medium/40' : 
                  'text-neutral-dark'
                }`}>
                  {day.date.getDate()}
                </span>
                
                {dayInfo && day.isCurrentMonth && (
                  <div className="mt-1 flex-1">
                    <div className="text-[10px] font-medium leading-tight">
                      {dayInfo.icon && <span className="mr-1">{dayInfo.icon}</span>}
                      {dayInfo.label}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-light"></div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCalendar;
