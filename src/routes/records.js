import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Record, Employee } from '../models/index.js';
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

export default router;
