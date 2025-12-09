/**
 * Tests para cálculo de horas trabajadas vs estimadas
 * Verifica que los horarios semanales, plantillas y excepciones se calculen correctamente
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WeeklyScheduleService } from '../services/weeklyScheduleService.js';
import sequelize from '../config/database.js';
import { 
  Employee, 
  Schedule, 
  WeeklySchedule, 
  ScheduleTemplate, 
  ScheduleTemplateDay,
  DailyScheduleException,
  Record 
} from '../models/index.js';

// Helper para calcular minutos entre dos tiempos
const calculateMinutes = (startTime, endTime) => {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return (end - start) / (1000 * 60);
};

// Helper para calcular horas estimadas usando el servicio
const calculateEstimatedHoursForRange = async (employeeId, startDate, endDate) => {
  let totalMinutes = 0;
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate < end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      const effectiveSchedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employeeId, dateStr);
      
      if (effectiveSchedule && effectiveSchedule.isWorkingDay) {
        const templateDay = effectiveSchedule.data?.templateDay;
        
        if (templateDay && templateDay.isSplitSchedule && 
            templateDay.morningStart && templateDay.morningEnd && 
            templateDay.afternoonStart && templateDay.afternoonEnd) {
          // Turno partido
          const morningMinutes = calculateMinutes(templateDay.morningStart, templateDay.morningEnd);
          const afternoonMinutes = calculateMinutes(templateDay.afternoonStart, templateDay.afternoonEnd);
          totalMinutes += morningMinutes + afternoonMinutes;
        } else if (effectiveSchedule.startTime && effectiveSchedule.endTime) {
          // Horario regular
          let dayMinutes = calculateMinutes(effectiveSchedule.startTime, effectiveSchedule.endTime);
          
          if (effectiveSchedule.breakStartTime && effectiveSchedule.breakEndTime) {
            dayMinutes -= calculateMinutes(effectiveSchedule.breakStartTime, effectiveSchedule.breakEndTime);
          }
          
          totalMinutes += dayMinutes;
        }
      }
    } catch (error) {
      console.error(`Error getting schedule for ${dateStr}:`, error);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: Math.round(totalMinutes % 60),
    totalMinutes: Math.round(totalMinutes)
  };
};

describe('Hours Calculation Tests', () => {
  let testEmployees = [];
  
  beforeAll(async () => {
    // Conectar a la base de datos
    await sequelize.authenticate();
    
    // Obtener empleados activos para tests
    testEmployees = await Employee.findAll({
      where: { isActive: true },
      limit: 10
    });
    
    console.log(`\n📋 Empleados cargados para tests: ${testEmployees.length}`);
    testEmployees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.employeeCode})`);
    });
  });

  afterAll(async () => {
    // No cerrar la conexión para permitir otros tests
  });

  describe('WeeklyScheduleService.getEffectiveScheduleForDate', () => {
    it('debe retornar horario efectivo para cada empleado hoy', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      for (const employee of testEmployees) {
        const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, today);
        
        expect(schedule).toBeDefined();
        expect(schedule).toHaveProperty('type');
        expect(schedule).toHaveProperty('isWorkingDay');
        expect(['daily_exception', 'weekly_template', 'regular_schedule', 'no_schedule']).toContain(schedule.type);
        
        console.log(`   ${employee.name}: ${schedule.type} - ${schedule.isWorkingDay ? 'Día laboral' : 'Día libre'}`);
        
        if (schedule.isWorkingDay && schedule.startTime) {
          console.log(`      Horario: ${schedule.startTime} - ${schedule.endTime}`);
        }
      }
    });

    it('debe priorizar excepciones diarias sobre plantillas semanales', async () => {
      // Este test verifica la jerarquía de prioridades
      for (const employee of testEmployees) {
        const today = new Date().toISOString().split('T')[0];
        
        // Verificar si hay excepción para hoy
        const exception = await DailyScheduleException.findOne({
          where: {
            employeeId: employee.id,
            date: today,
            isActive: true
          }
        });
        
        const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, today);
        
        if (exception) {
          expect(schedule.type).toBe('daily_exception');
          console.log(`   ${employee.name}: Tiene excepción diaria para hoy`);
        }
      }
    });

    it('debe usar plantilla semanal cuando existe para la semana actual', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      
      console.log(`\n   Semana actual: ${weekNumber} del año ${year}`);
      
      for (const employee of testEmployees) {
        const weeklySchedule = await WeeklySchedule.findOne({
          where: {
            employeeId: employee.id,
            year,
            weekNumber
          },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            attributes: ['name']
          }]
        });
        
        if (weeklySchedule) {
          console.log(`   ${employee.name}: Plantilla "${weeklySchedule.template?.name || 'Sin nombre'}"`);
          
          const dateStr = today.toISOString().split('T')[0];
          const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, dateStr);
          
          // Si no hay excepción, debería usar la plantilla semanal
          const hasException = await DailyScheduleException.findOne({
            where: { employeeId: employee.id, date: dateStr, isActive: true }
          });
          
          if (!hasException) {
            expect(schedule.type).toBe('weekly_template');
          }
        } else {
          console.log(`   ${employee.name}: Sin plantilla semanal asignada`);
        }
      }
    });
  });

  describe('Cálculo de horas estimadas por período', () => {
    it('debe calcular correctamente las horas estimadas para hoy', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      console.log(`\n   Fecha: ${todayStr}`);
      
      for (const employee of testEmployees) {
        const estimated = await calculateEstimatedHoursForRange(employee.id, todayStr, tomorrowStr);
        
        console.log(`   ${employee.name}: ${estimated.hours}h ${estimated.minutes}m estimadas hoy`);
        
        expect(estimated.totalMinutes).toBeGreaterThanOrEqual(0);
        expect(estimated.totalMinutes).toBeLessThanOrEqual(24 * 60); // Max 24 horas
      }
    });

    it('debe calcular correctamente las horas estimadas para la semana actual', async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];
      
      console.log(`\n   Semana: ${startStr} a ${endStr}`);
      
      for (const employee of testEmployees) {
        const estimated = await calculateEstimatedHoursForRange(employee.id, startStr, endStr);
        
        console.log(`   ${employee.name}: ${estimated.hours}h ${estimated.minutes}m estimadas esta semana`);
        
        expect(estimated.totalMinutes).toBeGreaterThanOrEqual(0);
        expect(estimated.totalMinutes).toBeLessThanOrEqual(7 * 24 * 60); // Max 168 horas
      }
    });

    it('debe manejar correctamente turnos partidos', async () => {
      // Buscar empleados con turnos partidos esta semana
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      
      const employeesWithSplitShift = [];
      
      for (const employee of testEmployees) {
        const weeklySchedule = await WeeklySchedule.findOne({
          where: { employeeId: employee.id, year, weekNumber },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            include: [{
              model: ScheduleTemplateDay,
              as: 'templateDays',
              where: { isSplitSchedule: true },
              required: false
            }]
          }]
        });
        
        if (weeklySchedule?.template?.templateDays?.length > 0) {
          employeesWithSplitShift.push({
            employee,
            templateDays: weeklySchedule.template.templateDays
          });
        }
      }
      
      console.log(`\n   Empleados con turno partido: ${employeesWithSplitShift.length}`);
      
      for (const { employee, templateDays } of employeesWithSplitShift) {
        for (const day of templateDays) {
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const morningMinutes = calculateMinutes(day.morningStart, day.morningEnd);
          const afternoonMinutes = calculateMinutes(day.afternoonStart, day.afternoonEnd);
          const totalDayMinutes = morningMinutes + afternoonMinutes;
          
          console.log(`   ${employee.name} - ${dayNames[day.dayOfWeek]}:`);
          console.log(`      Mañana: ${day.morningStart} - ${day.morningEnd} (${Math.round(morningMinutes)}min)`);
          console.log(`      Tarde: ${day.afternoonStart} - ${day.afternoonEnd} (${Math.round(afternoonMinutes)}min)`);
          console.log(`      Total: ${Math.floor(totalDayMinutes/60)}h ${Math.round(totalDayMinutes%60)}m`);
          
          expect(morningMinutes).toBeGreaterThan(0);
          expect(afternoonMinutes).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Consistencia entre horarios y horas estimadas', () => {
    it('las horas estimadas deben coincidir con la suma de los días de la plantilla', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      
      for (const employee of testEmployees) {
        const weeklySchedule = await WeeklySchedule.findOne({
          where: { employeeId: employee.id, year, weekNumber },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            include: [{
              model: ScheduleTemplateDay,
              as: 'templateDays'
            }]
          }]
        });
        
        if (weeklySchedule?.template?.templateDays) {
          // Calcular total desde la plantilla directamente
          let expectedMinutes = 0;
          
          for (const day of weeklySchedule.template.templateDays) {
            if (day.isWorkingDay) {
              if (day.isSplitSchedule && day.morningStart && day.morningEnd && day.afternoonStart && day.afternoonEnd) {
                expectedMinutes += calculateMinutes(day.morningStart, day.morningEnd);
                expectedMinutes += calculateMinutes(day.afternoonStart, day.afternoonEnd);
              } else if (day.startTime && day.endTime) {
                let dayMinutes = calculateMinutes(day.startTime, day.endTime);
                if (day.breakStartTime && day.breakEndTime) {
                  dayMinutes -= calculateMinutes(day.breakStartTime, day.breakEndTime);
                }
                expectedMinutes += dayMinutes;
              }
            }
          }
          
          // Calcular usando el servicio
          const dayOfWeek = today.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - daysToMonday);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          
          const calculated = await calculateEstimatedHoursForRange(
            employee.id, 
            startOfWeek.toISOString().split('T')[0],
            endOfWeek.toISOString().split('T')[0]
          );
          
          const expectedHours = Math.floor(expectedMinutes / 60);
          const expectedMins = Math.round(expectedMinutes % 60);
          
          console.log(`   ${employee.name}:`);
          console.log(`      Plantilla: ${expectedHours}h ${expectedMins}m`);
          console.log(`      Calculado: ${calculated.hours}h ${calculated.minutes}m`);
          
          // Permitir diferencia de 1 minuto por redondeo
          expect(Math.abs(calculated.totalMinutes - expectedMinutes)).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});

describe('Records and Actual Hours Tests', () => {
  let testEmployees = [];
  
  beforeAll(async () => {
    testEmployees = await Employee.findAll({
      where: { isActive: true },
      limit: 10
    });
  });

  describe('Cálculo de horas trabajadas reales', () => {
    it('debe calcular correctamente las horas trabajadas hoy', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log(`\n   Registros de hoy:`);
      
      for (const employee of testEmployees) {
        const records = await Record.findAll({
          where: {
            employeeId: employee.id,
            timestamp: {
              [sequelize.Sequelize.Op.gte]: today,
              [sequelize.Sequelize.Op.lt]: tomorrow
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
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        
        if (records.length > 0) {
          console.log(`   ${employee.name}: ${hours}h ${minutes}m (${records.length} registros)`);
        }
        
        expect(totalMinutes).toBeGreaterThanOrEqual(0);
      }
    });

    it('debe detectar fichajes sin cerrar', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log(`\n   Fichajes sin cerrar:`);
      
      for (const employee of testEmployees) {
        const lastRecord = await Record.findOne({
          where: {
            employeeId: employee.id,
            timestamp: {
              [sequelize.Sequelize.Op.gte]: today,
              [sequelize.Sequelize.Op.lt]: tomorrow
            }
          },
          order: [['timestamp', 'DESC']]
        });
        
        if (lastRecord && lastRecord.type === 'checkin') {
          console.log(`   ⚠️ ${employee.name}: Entrada sin salida a las ${new Date(lastRecord.timestamp).toLocaleTimeString('es-ES')}`);
        }
      }
    });
  });
});
