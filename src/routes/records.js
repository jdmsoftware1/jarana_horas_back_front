import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Record, Employee, Vacation, DailyScheduleException, WeeklySchedule, ScheduleTemplate, ScheduleTemplateDay } from '../models/index.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { WeeklyScheduleService } from '../services/weeklyScheduleService.js';

const router = express.Router();

// Check in
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const { device = 'web', location, notes } = req.body;

    // Check if employee already has an active checkin (no checkout)
    const lastRecord = await Record.findOne({
      where: { employeeId: req.employee.id },
      order: [['timestamp', 'DESC']]
    });

    if (lastRecord && lastRecord.type === 'checkin') {
      return res.status(400).json({ 
        error: 'You are already checked in. Please check out first.' 
      });
    }

    const record = await Record.create({
      employeeId: req.employee.id,
      type: 'checkin',
      device,
      location,
      notes
    });

    res.status(201).json({
      record,
      message: 'Checked in successfully'
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ error: 'Server error during check in' });
  }
});

// Check out
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { device = 'web', location, notes } = req.body;

    // Check if employee has an active checkin
    const lastRecord = await Record.findOne({
      where: { employeeId: req.employee.id },
      order: [['timestamp', 'DESC']]
    });

    if (!lastRecord || lastRecord.type === 'checkout') {
      return res.status(400).json({ 
        error: 'You must check in first before checking out.' 
      });
    }

    const record = await Record.create({
      employeeId: req.employee.id,
      type: 'checkout',
      device,
      location,
      notes
    });

    res.status(201).json({
      record,
      message: 'Checked out successfully'
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ error: 'Server error during check out' });
  }
});

// Get records for authenticated employee
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const whereClause = { employeeId: req.employee.id };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp[Op.gte] = new Date(startDate);
      if (endDate) whereClause.timestamp[Op.lte] = new Date(endDate);
    }

    const records = await Record.findAndCountAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      records: records.rows,
      total: records.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Server error fetching records' });
  }
});

// Get all records (PROTEGIDO - Solo admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      type, 
      limit = 100, 
      offset = 0 
    } = req.query;

    const whereClause = {};

    if (employeeId) whereClause.employeeId = employeeId;
    if (type) whereClause.type = type;

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp[Op.gte] = new Date(startDate);
      if (endDate) whereClause.timestamp[Op.lte] = new Date(endDate);
    }

    const records = await Record.findAndCountAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'employeeCode']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      records: records.rows,
      total: records.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get all records error:', error);
    res.status(500).json({ error: 'Server error fetching records' });
  }
});

// Get records by employee ID (for employee portal)
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('Fetching records for employee:', employeeId);

    // First, check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      console.log('Employee not found:', employeeId);
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('Employee found:', employee.name, employee.employeeCode);

    // Get all records for this employee
    const allRecords = await Record.findAll({
      where: { employeeId },
      order: [['timestamp', 'DESC']]
    });

    console.log(`Total records in DB for employee ${employeeId}:`, allRecords.length);

    // Get records with pagination and include employee data
    const records = await Record.findAll({
      where: { employeeId },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'employeeCode']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`Returning ${records.length} records for employee ${employeeId}`);
    console.log('Sample records:', records.slice(0, 3).map(r => ({
      id: r.id,
      type: r.type,
      timestamp: r.timestamp,
      employeeId: r.employeeId
    })));

    res.json(records);
  } catch (error) {
    console.error('Get employee records error:', error);
    res.status(500).json({ error: 'Server error fetching employee records', details: error.message });
  }
});

// Get current status (checked in/out)
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const lastRecord = await Record.findOne({
      where: { employeeId: req.employee.id },
      order: [['timestamp', 'DESC']]
    });

    const status = {
      isCheckedIn: lastRecord ? lastRecord.type === 'checkin' : false,
      lastRecord: lastRecord || null
    };

    res.json(status);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Server error fetching status' });
  }
});

// Get analytics (admin only)
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    const whereClause = {};
    if (employeeId) whereClause.employeeId = employeeId;

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp[Op.gte] = new Date(startDate);
      if (endDate) whereClause.timestamp[Op.lte] = new Date(endDate);
    }

    // Get total records by type
    const recordsByType = await Record.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    // Get records by employee
    const recordsByEmployee = await Record.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'employeeCode']
      }],
      attributes: [
        'employeeId',
        [sequelize.fn('COUNT', sequelize.col('Record.id')), 'count']
      ],
      group: ['employeeId', 'employee.id', 'employee.name', 'employee.employeeCode']
    });

    // Get daily activity
    const dailyActivity = await Record.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [
        sequelize.fn('DATE', sequelize.col('timestamp')),
        'type'
      ],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'DESC']]
    });

    res.json({
      recordsByType,
      recordsByEmployee,
      dailyActivity
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Update record (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp, notes, device } = req.body;

    const record = await Record.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updateData = {};
    if (timestamp) updateData.timestamp = new Date(timestamp);
    if (notes !== undefined) updateData.notes = notes;
    if (device) updateData.device = device;

    await record.update(updateData);
    res.json(record);
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: 'Server error updating record' });
  }
});

// Delete record (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Record.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Server error deleting record' });
  }
});

// Debug route to check all records in database
router.get('/debug/all', async (req, res) => {
  try {
    const allRecords = await Record.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'employeeCode']
      }],
      order: [['timestamp', 'DESC']],
      limit: 20
    });

    const allEmployees = await Employee.findAll({
      attributes: ['id', 'name', 'employeeCode']
    });

    res.json({
      totalRecords: allRecords.length,
      totalEmployees: allEmployees.length,
      records: allRecords.map(r => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee?.name || 'Unknown',
        type: r.type,
        timestamp: r.timestamp,
        device: r.device
      })),
      employees: allEmployees
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: 'Debug route error', details: error.message });
  }
});

// Get hours worked statistics for an employee
router.get('/employee/:employeeId/hours-stats', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Verify employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    // Calcular el lunes de esta semana correctamente (domingo = 0, lunes = 1, etc.)
    // Si es domingo (0), retroceder 6 días; si no, retroceder (día - 1) días
    const dayOfWeekForStats = today.getDay();
    const daysToMonday = dayOfWeekForStats === 0 ? 6 : dayOfWeekForStats - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Helper function to calculate hours from records
    const calculateHours = async (startDate, endDate) => {
      const records = await Record.findAll({
        where: {
          employeeId,
          timestamp: {
            [Op.gte]: startDate,
            [Op.lt]: endDate
          }
        },
        order: [['timestamp', 'ASC']]
      });
      
      let totalMinutes = 0;
      let lastCheckin = null;
      
      for (const record of records) {
        if (record.type === 'checkin') {
          lastCheckin = record.timestamp;
        } else if (record.type === 'checkout' && lastCheckin) {
          const diff = new Date(record.timestamp) - new Date(lastCheckin);
          totalMinutes += diff / (1000 * 60);
          lastCheckin = null;
        }
      }
      
      return {
        hours: Math.floor(totalMinutes / 60),
        minutes: Math.round(totalMinutes % 60),
        totalMinutes: Math.round(totalMinutes)
      };
    };
    
    // Calculate for today
    const todayEnd = new Date(today);
    todayEnd.setDate(today.getDate() + 1);
    const todayStats = await calculateHours(today, todayEnd);
    
    // Calculate for this week
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(startOfWeek.getDate() + 7);
    const weekStats = await calculateHours(startOfWeek, weekEnd);
    
    // Calculate for this month
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthStats = await calculateHours(startOfMonth, monthEnd);
    
    res.json({
      employeeId,
      employeeName: employee.name,
      today: {
        date: today.toISOString().split('T')[0],
        ...todayStats
      },
      week: {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        ...weekStats
      },
      month: {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        ...monthStats
      }
    });
  } catch (error) {
    console.error('Error calculating hours stats:', error);
    res.status(500).json({ error: 'Server error calculating hours statistics' });
  }
});

// Get hours comparison (estimated vs actual) for an employee
router.get('/employee/:employeeId/hours-comparison', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { Schedule, WeeklySchedule, ScheduleTemplate, ScheduleTemplateDay } = await import('../models/index.js');
    
    // Verify employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    // Calcular el lunes de esta semana correctamente (domingo = 0, lunes = 1, etc.)
    // Si es domingo (0), retroceder 6 días; si no, retroceder (día - 1) días
    const dayOfWeekForComparison = today.getDay();
    const daysToMondayComparison = dayOfWeekForComparison === 0 ? 6 : dayOfWeekForComparison - 1;
    startOfWeek.setDate(today.getDate() - daysToMondayComparison);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Helper to calculate actual worked hours
    const calculateActualHours = async (startDate, endDate) => {
      const records = await Record.findAll({
        where: {
          employeeId,
          timestamp: {
            [Op.gte]: startDate,
            [Op.lt]: endDate
          }
        },
        order: [['timestamp', 'ASC']]
      });
      
      let totalMinutes = 0;
      let lastCheckin = null;
      
      for (const record of records) {
        if (record.type === 'checkin') {
          lastCheckin = record.timestamp;
        } else if (record.type === 'checkout' && lastCheckin) {
          const diff = new Date(record.timestamp) - new Date(lastCheckin);
          totalMinutes += diff / (1000 * 60);
          lastCheckin = null;
        }
      }
      
      return totalMinutes;
    };
    
    // Helper to calculate estimated hours from schedule
    // Uses WeeklyScheduleService to get effective schedule considering:
    // 1. Daily exceptions (highest priority)
    // 2. Weekly schedules with templates
    // 3. Base schedules (fallback)
    const calculateEstimatedHours = async (startDate, endDate) => {
      let totalMinutes = 0;
      const currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        try {
          // Get effective schedule for this date (considers weekly templates, exceptions, etc.)
          const effectiveSchedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employeeId, dateStr);
          
          if (effectiveSchedule && effectiveSchedule.isWorkingDay) {
            // Check if it's a split schedule (turno partido)
            const templateDay = effectiveSchedule.data?.templateDay;
            
            if (templateDay && templateDay.isSplitSchedule && templateDay.morningStart && templateDay.morningEnd && templateDay.afternoonStart && templateDay.afternoonEnd) {
              // Split schedule: morning + afternoon
              const morningStart = new Date(`1970-01-01T${templateDay.morningStart}`);
              const morningEnd = new Date(`1970-01-01T${templateDay.morningEnd}`);
              const afternoonStart = new Date(`1970-01-01T${templateDay.afternoonStart}`);
              const afternoonEnd = new Date(`1970-01-01T${templateDay.afternoonEnd}`);
              
              const morningMinutes = (morningEnd - morningStart) / (1000 * 60);
              const afternoonMinutes = (afternoonEnd - afternoonStart) / (1000 * 60);
              totalMinutes += morningMinutes + afternoonMinutes;
            } else if (effectiveSchedule.startTime && effectiveSchedule.endTime) {
              // Regular schedule
              const start = new Date(`1970-01-01T${effectiveSchedule.startTime}`);
              const end = new Date(`1970-01-01T${effectiveSchedule.endTime}`);
              let dayMinutes = (end - start) / (1000 * 60);
              
              // Subtract break time if exists
              if (effectiveSchedule.breakStartTime && effectiveSchedule.breakEndTime) {
                const breakStart = new Date(`1970-01-01T${effectiveSchedule.breakStartTime}`);
                const breakEnd = new Date(`1970-01-01T${effectiveSchedule.breakEndTime}`);
                dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
              }
              
              totalMinutes += dayMinutes;
            }
          }
        } catch (error) {
          console.error(`Error getting schedule for ${dateStr}:`, error);
          // Continue with next day if there's an error
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return totalMinutes;
    };
    
    // Calculate for today
    const todayEnd = new Date(today);
    todayEnd.setDate(today.getDate() + 1);
    const todayActual = await calculateActualHours(today, todayEnd);
    const todayEstimated = await calculateEstimatedHours(today, todayEnd);
    
    // Calculate for this week
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(startOfWeek.getDate() + 7);
    const weekActual = await calculateActualHours(startOfWeek, weekEnd);
    const weekEstimated = await calculateEstimatedHours(startOfWeek, weekEnd);
    
    // Calculate for this month
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthActual = await calculateActualHours(startOfMonth, monthEnd);
    const monthEstimated = await calculateEstimatedHours(startOfMonth, monthEnd);
    
    // Format results
    const formatComparison = (actual, estimated) => {
      const difference = actual - estimated;
      return {
        actual: {
          hours: Math.floor(actual / 60),
          minutes: Math.round(actual % 60),
          totalMinutes: Math.round(actual)
        },
        estimated: {
          hours: Math.floor(estimated / 60),
          minutes: Math.round(estimated % 60),
          totalMinutes: Math.round(estimated)
        },
        difference: {
          hours: Math.floor(Math.abs(difference) / 60),
          minutes: Math.round(Math.abs(difference) % 60),
          totalMinutes: Math.round(difference),
          isPositive: difference >= 0
        },
        percentage: estimated > 0 ? Math.round((actual / estimated) * 100) : 0
      };
    };
    
    res.json({
      employeeId,
      employeeName: employee.name,
      today: {
        date: today.toISOString().split('T')[0],
        ...formatComparison(todayActual, todayEstimated)
      },
      week: {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        ...formatComparison(weekActual, weekEstimated)
      },
      month: {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        ...formatComparison(monthActual, monthEstimated)
      }
    });
  } catch (error) {
    console.error('Error calculating hours comparison:', error);
    res.status(500).json({ error: 'Server error calculating hours comparison' });
  }
});

// ============================================
// EXPORTACIÓN CSV PARA AUDITORÍA
// ============================================

// Helper para escapar valores CSV
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper para formatear fecha
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper para formatear hora
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toTimeString().split(' ')[0];
};

// Helper para calcular minutos entre tiempos
const calcMinutes = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  return (e - s) / (1000 * 60);
};

// GET /api/records/export/audit - Exportar datos para auditoría
router.get('/export/audit', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, employeeId, format = 'csv' } = req.query;
    
    // Validar fechas
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Construir filtro de empleados
    const employeeWhere = { isActive: true };
    if (employeeId) {
      employeeWhere.id = employeeId;
    }
    
    // Obtener empleados
    const employees = await Employee.findAll({
      where: employeeWhere,
      attributes: ['id', 'name', 'employeeCode', 'email'],
      order: [['name', 'ASC']]
    });
    
    // Preparar datos de auditoría
    const auditData = [];
    
    for (const employee of employees) {
      // Iterar por cada día del rango
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayStart = new Date(dateStr);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Obtener registros del día
        const dayRecords = await Record.findAll({
          where: {
            employeeId: employee.id,
            timestamp: { [Op.between]: [dayStart, dayEnd] }
          },
          order: [['timestamp', 'ASC']]
        });
        
        // Calcular horas trabajadas
        let workedMinutes = 0;
        let firstCheckin = null;
        let lastCheckout = null;
        let lastCheckinTime = null;
        
        for (const record of dayRecords) {
          if (record.type === 'checkin') {
            lastCheckinTime = record.timestamp;
            if (!firstCheckin) firstCheckin = record.timestamp;
          } else if (record.type === 'checkout' && lastCheckinTime) {
            workedMinutes += (new Date(record.timestamp) - new Date(lastCheckinTime)) / (1000 * 60);
            lastCheckout = record.timestamp;
            lastCheckinTime = null;
          }
        }
        
        // Obtener horario asignado
        const effectiveSchedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, dateStr);
        let estimatedMinutes = 0;
        let scheduleType = 'sin_horario';
        let scheduleDetails = '';
        
        if (effectiveSchedule && effectiveSchedule.isWorkingDay) {
          scheduleType = effectiveSchedule.type;
          const templateDay = effectiveSchedule.data?.templateDay;
          
          if (templateDay && templateDay.isSplitSchedule && templateDay.morningStart) {
            estimatedMinutes = calcMinutes(templateDay.morningStart, templateDay.morningEnd) + 
                              calcMinutes(templateDay.afternoonStart, templateDay.afternoonEnd);
            scheduleDetails = `${templateDay.morningStart}-${templateDay.morningEnd} + ${templateDay.afternoonStart}-${templateDay.afternoonEnd}`;
          } else if (effectiveSchedule.startTime && effectiveSchedule.endTime) {
            estimatedMinutes = calcMinutes(effectiveSchedule.startTime, effectiveSchedule.endTime);
            if (effectiveSchedule.breakStartTime && effectiveSchedule.breakEndTime) {
              estimatedMinutes -= calcMinutes(effectiveSchedule.breakStartTime, effectiveSchedule.breakEndTime);
            }
            scheduleDetails = `${effectiveSchedule.startTime}-${effectiveSchedule.endTime}`;
          }
        } else if (effectiveSchedule) {
          scheduleType = effectiveSchedule.type === 'daily_exception' ? 'excepcion_libre' : 'dia_libre';
        }
        
        // Verificar vacaciones
        const vacation = await Vacation.findOne({
          where: {
            employeeId: employee.id,
            startDate: { [Op.lte]: dateStr },
            endDate: { [Op.gte]: dateStr },
            status: 'approved'
          }
        });
        
        // Calcular diferencia y estado
        const difference = workedMinutes - estimatedMinutes;
        let status = 'normal';
        
        if (vacation) {
          status = 'vacaciones';
        } else if (estimatedMinutes > 0 && workedMinutes === 0 && dayRecords.length === 0) {
          status = 'ausencia';
        } else if (estimatedMinutes > 0 && firstCheckin) {
          // Verificar llegada tarde (más de 10 minutos)
          const scheduledStart = effectiveSchedule?.startTime || 
                                effectiveSchedule?.data?.templateDay?.morningStart;
          if (scheduledStart) {
            const scheduled = new Date(`${dateStr}T${scheduledStart}`);
            const actual = new Date(firstCheckin);
            const lateMinutes = (actual - scheduled) / (1000 * 60);
            if (lateMinutes > 10) {
              status = 'llegada_tarde';
            }
          }
        }
        
        if (difference < -30 && status === 'normal') {
          status = 'horas_insuficientes';
        } else if (difference > 60 && status === 'normal') {
          status = 'horas_extra';
        }
        
        auditData.push({
          fecha: dateStr,
          empleado: employee.name,
          codigo: employee.employeeCode,
          email: employee.email,
          tipo_horario: scheduleType,
          horario_asignado: scheduleDetails,
          horas_estimadas: Math.floor(estimatedMinutes / 60) + ':' + String(Math.round(estimatedMinutes % 60)).padStart(2, '0'),
          primera_entrada: firstCheckin ? formatTime(firstCheckin) : '',
          ultima_salida: lastCheckout ? formatTime(lastCheckout) : '',
          horas_trabajadas: Math.floor(workedMinutes / 60) + ':' + String(Math.round(workedMinutes % 60)).padStart(2, '0'),
          diferencia_minutos: Math.round(difference),
          estado: status,
          num_fichajes: dayRecords.length,
          vacaciones: vacation ? vacation.type : '',
          notas: dayRecords.map(r => r.notes).filter(Boolean).join('; ')
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    if (format === 'json') {
      return res.json(auditData);
    }
    
    // Generar CSV
    const headers = [
      'Fecha', 'Empleado', 'Código', 'Email', 'Tipo Horario', 'Horario Asignado',
      'Horas Estimadas', 'Primera Entrada', 'Última Salida', 'Horas Trabajadas',
      'Diferencia (min)', 'Estado', 'Num Fichajes', 'Vacaciones', 'Notas'
    ];
    
    let csv = headers.join(',') + '\n';
    
    for (const row of auditData) {
      csv += [
        escapeCSV(row.fecha),
        escapeCSV(row.empleado),
        escapeCSV(row.codigo),
        escapeCSV(row.email),
        escapeCSV(row.tipo_horario),
        escapeCSV(row.horario_asignado),
        escapeCSV(row.horas_estimadas),
        escapeCSV(row.primera_entrada),
        escapeCSV(row.ultima_salida),
        escapeCSV(row.horas_trabajadas),
        escapeCSV(row.diferencia_minutos),
        escapeCSV(row.estado),
        escapeCSV(row.num_fichajes),
        escapeCSV(row.vacaciones),
        escapeCSV(row.notas)
      ].join(',') + '\n';
    }
    
    // Añadir BOM para Excel
    const bom = '\uFEFF';
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="auditoria_${formatDate(start)}_${formatDate(end)}.csv"`);
    res.send(bom + csv);
    
  } catch (error) {
    console.error('Error exporting audit data:', error);
    res.status(500).json({ error: 'Error al exportar datos de auditoría' });
  }
});

// GET /api/records/export/vacations - Exportar vacaciones
router.get('/export/vacations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { year, status } = req.query;
    
    const where = {};
    if (year) {
      where.startDate = { [Op.gte]: `${year}-01-01` };
      where.endDate = { [Op.lte]: `${year}-12-31` };
    }
    if (status) {
      where.status = status;
    }
    
    const vacations = await Vacation.findAll({
      where,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['name', 'employeeCode', 'email']
      }],
      order: [['startDate', 'DESC']]
    });
    
    const headers = ['Empleado', 'Código', 'Email', 'Tipo', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado', 'Motivo', 'Fecha Solicitud'];
    let csv = headers.join(',') + '\n';
    
    for (const v of vacations) {
      const days = Math.ceil((new Date(v.endDate) - new Date(v.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      csv += [
        escapeCSV(v.employee?.name),
        escapeCSV(v.employee?.employeeCode),
        escapeCSV(v.employee?.email),
        escapeCSV(v.type),
        escapeCSV(formatDate(v.startDate)),
        escapeCSV(formatDate(v.endDate)),
        escapeCSV(days),
        escapeCSV(v.status),
        escapeCSV(v.reason),
        escapeCSV(formatDate(v.createdAt))
      ].join(',') + '\n';
    }
    
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vacaciones_${year || 'todas'}.csv"`);
    res.send(bom + csv);
    
  } catch (error) {
    console.error('Error exporting vacations:', error);
    res.status(500).json({ error: 'Error al exportar vacaciones' });
  }
});

// GET /api/records/export/summary - Resumen mensual por empleado
router.get('/export/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const employees = await Employee.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'employeeCode', 'email'],
      order: [['name', 'ASC']]
    });
    
    const summaryData = [];
    
    for (const employee of employees) {
      // Obtener todos los registros del mes
      const records = await Record.findAll({
        where: {
          employeeId: employee.id,
          timestamp: { [Op.between]: [startDate, endDate] }
        },
        order: [['timestamp', 'ASC']]
      });
      
      // Calcular totales
      let totalWorkedMinutes = 0;
      let totalEstimatedMinutes = 0;
      let daysWorked = 0;
      let lateArrivals = 0;
      let absences = 0;
      let lastCheckin = null;
      
      // Agrupar por día
      const dayRecords = {};
      for (const record of records) {
        const day = formatDate(record.timestamp);
        if (!dayRecords[day]) dayRecords[day] = [];
        dayRecords[day].push(record);
      }
      
      // Procesar cada día del mes
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        const dayRecs = dayRecords[dateStr] || [];
        
        // Calcular horas trabajadas del día
        let dayWorked = 0;
        let dayLastCheckin = null;
        for (const r of dayRecs) {
          if (r.type === 'checkin') dayLastCheckin = r.timestamp;
          else if (r.type === 'checkout' && dayLastCheckin) {
            dayWorked += (new Date(r.timestamp) - new Date(dayLastCheckin)) / (1000 * 60);
            dayLastCheckin = null;
          }
        }
        
        if (dayWorked > 0) {
          totalWorkedMinutes += dayWorked;
          daysWorked++;
        }
        
        // Obtener horario estimado
        const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, dateStr);
        if (schedule && schedule.isWorkingDay) {
          const td = schedule.data?.templateDay;
          let dayEstimated = 0;
          
          if (td && td.isSplitSchedule && td.morningStart) {
            dayEstimated = calcMinutes(td.morningStart, td.morningEnd) + calcMinutes(td.afternoonStart, td.afternoonEnd);
          } else if (schedule.startTime && schedule.endTime) {
            dayEstimated = calcMinutes(schedule.startTime, schedule.endTime);
            if (schedule.breakStartTime && schedule.breakEndTime) {
              dayEstimated -= calcMinutes(schedule.breakStartTime, schedule.breakEndTime);
            }
          }
          
          totalEstimatedMinutes += dayEstimated;
          
          // Verificar ausencia
          if (dayEstimated > 0 && dayRecs.length === 0) {
            // Verificar si no está de vacaciones
            const vacation = await Vacation.findOne({
              where: {
                employeeId: employee.id,
                startDate: { [Op.lte]: dateStr },
                endDate: { [Op.gte]: dateStr },
                status: 'approved'
              }
            });
            if (!vacation) absences++;
          }
          
          // Verificar llegada tarde
          if (dayRecs.length > 0) {
            const firstCheckin = dayRecs.find(r => r.type === 'checkin');
            if (firstCheckin) {
              const scheduledStart = schedule.startTime || td?.morningStart;
              if (scheduledStart) {
                const scheduled = new Date(`${dateStr}T${scheduledStart}`);
                const actual = new Date(firstCheckin.timestamp);
                if ((actual - scheduled) / (1000 * 60) > 10) {
                  lateArrivals++;
                }
              }
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Obtener vacaciones del mes
      const vacationDays = await Vacation.count({
        where: {
          employeeId: employee.id,
          status: 'approved',
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate }
        }
      });
      
      summaryData.push({
        empleado: employee.name,
        codigo: employee.employeeCode,
        email: employee.email,
        dias_trabajados: daysWorked,
        horas_trabajadas: Math.floor(totalWorkedMinutes / 60) + ':' + String(Math.round(totalWorkedMinutes % 60)).padStart(2, '0'),
        horas_estimadas: Math.floor(totalEstimatedMinutes / 60) + ':' + String(Math.round(totalEstimatedMinutes % 60)).padStart(2, '0'),
        diferencia_horas: Math.floor((totalWorkedMinutes - totalEstimatedMinutes) / 60) + ':' + String(Math.abs(Math.round((totalWorkedMinutes - totalEstimatedMinutes) % 60))).padStart(2, '0'),
        llegadas_tarde: lateArrivals,
        ausencias: absences,
        dias_vacaciones: vacationDays
      });
    }
    
    const headers = ['Empleado', 'Código', 'Email', 'Días Trabajados', 'Horas Trabajadas', 'Horas Estimadas', 'Diferencia', 'Llegadas Tarde', 'Ausencias', 'Días Vacaciones'];
    let csv = headers.join(',') + '\n';
    
    for (const row of summaryData) {
      csv += [
        escapeCSV(row.empleado),
        escapeCSV(row.codigo),
        escapeCSV(row.email),
        escapeCSV(row.dias_trabajados),
        escapeCSV(row.horas_trabajadas),
        escapeCSV(row.horas_estimadas),
        escapeCSV(row.diferencia_horas),
        escapeCSV(row.llegadas_tarde),
        escapeCSV(row.ausencias),
        escapeCSV(row.dias_vacaciones)
      ].join(',') + '\n';
    }
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resumen_${monthNames[targetMonth]}_${targetYear}.csv"`);
    res.send(bom + csv);
    
  } catch (error) {
    console.error('Error exporting summary:', error);
    res.status(500).json({ error: 'Error al exportar resumen' });
  }
});

export default router;
