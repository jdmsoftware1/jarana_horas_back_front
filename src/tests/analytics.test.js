/**
 * Tests para Analytics - Comparación horas estimadas vs trabajadas
 */
import { describe, it, expect, beforeAll } from 'vitest';
import sequelize from '../config/database.js';
import { Employee, Record, WeeklySchedule, ScheduleTemplate, ScheduleTemplateDay } from '../models/index.js';
import { WeeklyScheduleService } from '../services/weeklyScheduleService.js';
import { Op } from 'sequelize';

const calcMinutes = (start, end) => {
  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  return (e - s) / (1000 * 60);
};

describe('Analytics Tests', () => {
  let employees = [];
  
  beforeAll(async () => {
    await sequelize.authenticate();
    employees = await Employee.findAll({ where: { isActive: true } });
    console.log(`\n📊 Empleados para analytics: ${employees.length}`);
  });

  describe('Horas Estimadas vs Trabajadas - HOY', () => {
    it('debe calcular correctamente para cada empleado', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log(`\n📅 Análisis para HOY (${todayStr}):\n`);
      
      for (const emp of employees) {
        // Horas estimadas
        const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(emp.id, todayStr);
        let estimatedMin = 0;
        
        if (schedule?.isWorkingDay) {
          const td = schedule.data?.templateDay;
          if (td?.isSplitSchedule && td.morningStart) {
            estimatedMin = calcMinutes(td.morningStart, td.morningEnd) + calcMinutes(td.afternoonStart, td.afternoonEnd);
          } else if (schedule.startTime && schedule.endTime) {
            estimatedMin = calcMinutes(schedule.startTime, schedule.endTime);
            if (schedule.breakStartTime && schedule.breakEndTime) {
              estimatedMin -= calcMinutes(schedule.breakStartTime, schedule.breakEndTime);
            }
          }
        }
        
        // Horas trabajadas
        const records = await Record.findAll({
          where: { employeeId: emp.id, timestamp: { [Op.gte]: today.setHours(0,0,0,0), [Op.lt]: tomorrow } },
          order: [['timestamp', 'ASC']]
        });
        
        let workedMin = 0, lastIn = null;
        for (const r of records) {
          if (r.type === 'checkin') lastIn = r.timestamp;
          else if (r.type === 'checkout' && lastIn) {
            workedMin += (new Date(r.timestamp) - new Date(lastIn)) / (1000 * 60);
            lastIn = null;
          }
        }
        
        const estH = Math.floor(estimatedMin / 60);
        const estM = Math.round(estimatedMin % 60);
        const worH = Math.floor(workedMin / 60);
        const worM = Math.round(workedMin % 60);
        const diff = workedMin - estimatedMin;
        const diffH = Math.floor(Math.abs(diff) / 60);
        const diffM = Math.round(Math.abs(diff) % 60);
        
        console.log(`${emp.name}:`);
        console.log(`  Estimado: ${estH}h ${estM}m | Trabajado: ${worH}h ${worM}m | ${diff >= 0 ? '+' : '-'}${diffH}h ${diffM}m`);
        console.log(`  Fuente: ${schedule?.type || 'ninguno'}`);
        
        expect(estimatedMin).toBeGreaterThanOrEqual(0);
        expect(workedMin).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Horas Estimadas vs Trabajadas - SEMANA', () => {
    it('debe calcular correctamente para cada empleado', async () => {
      const today = new Date();
      const dow = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      console.log(`\n📆 Análisis SEMANA (${startOfWeek.toISOString().split('T')[0]} - ${endOfWeek.toISOString().split('T')[0]}):\n`);
      
      for (const emp of employees) {
        // Horas estimadas semana
        let estimatedMin = 0;
        const curr = new Date(startOfWeek);
        while (curr < endOfWeek) {
          const dateStr = curr.toISOString().split('T')[0];
          const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(emp.id, dateStr);
          
          if (schedule?.isWorkingDay) {
            const td = schedule.data?.templateDay;
            if (td?.isSplitSchedule && td.morningStart) {
              estimatedMin += calcMinutes(td.morningStart, td.morningEnd) + calcMinutes(td.afternoonStart, td.afternoonEnd);
            } else if (schedule.startTime && schedule.endTime) {
              let dm = calcMinutes(schedule.startTime, schedule.endTime);
              if (schedule.breakStartTime && schedule.breakEndTime) {
                dm -= calcMinutes(schedule.breakStartTime, schedule.breakEndTime);
              }
              estimatedMin += dm;
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
        
        // Horas trabajadas semana
        const records = await Record.findAll({
          where: { employeeId: emp.id, timestamp: { [Op.gte]: startOfWeek, [Op.lt]: endOfWeek } },
          order: [['timestamp', 'ASC']]
        });
        
        let workedMin = 0, lastIn = null;
        for (const r of records) {
          if (r.type === 'checkin') lastIn = r.timestamp;
          else if (r.type === 'checkout' && lastIn) {
            workedMin += (new Date(r.timestamp) - new Date(lastIn)) / (1000 * 60);
            lastIn = null;
          }
        }
        
        const estH = Math.floor(estimatedMin / 60);
        const estM = Math.round(estimatedMin % 60);
        const worH = Math.floor(workedMin / 60);
        const worM = Math.round(workedMin % 60);
        const diff = workedMin - estimatedMin;
        const diffH = Math.floor(Math.abs(diff) / 60);
        const diffM = Math.round(Math.abs(diff) % 60);
        const pct = estimatedMin > 0 ? Math.round((workedMin / estimatedMin) * 100) : 0;
        
        console.log(`${emp.name}:`);
        console.log(`  Estimado: ${estH}h ${estM}m | Trabajado: ${worH}h ${worM}m | ${diff >= 0 ? '+' : '-'}${diffH}h ${diffM}m (${pct}%)`);
        
        expect(estimatedMin).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Verificación de plantillas asignadas', () => {
    it('debe mostrar plantilla asignada vs horas calculadas', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNum = WeeklySchedule.getWeekNumber(today);
      
      console.log(`\n📋 Plantillas semana ${weekNum}:\n`);
      
      for (const emp of employees) {
        const ws = await WeeklySchedule.findOne({
          where: { employeeId: emp.id, year, weekNumber: weekNum },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            include: [{ model: ScheduleTemplateDay, as: 'templateDays' }]
          }]
        });
        
        if (ws?.template) {
          let templateMin = 0;
          const days = ws.template.templateDays || [];
          
          for (const d of days) {
            if (d.isWorkingDay) {
              if (d.isSplitSchedule && d.morningStart) {
                templateMin += calcMinutes(d.morningStart, d.morningEnd) + calcMinutes(d.afternoonStart, d.afternoonEnd);
              } else if (d.startTime && d.endTime) {
                let dm = calcMinutes(d.startTime, d.endTime);
                if (d.breakStartTime && d.breakEndTime) dm -= calcMinutes(d.breakStartTime, d.breakEndTime);
                templateMin += dm;
              }
            }
          }
          
          const h = Math.floor(templateMin / 60);
          const m = Math.round(templateMin % 60);
          console.log(`${emp.name}: "${ws.template.name}" = ${h}h ${m}m/semana`);
        } else {
          console.log(`${emp.name}: Sin plantilla asignada`);
        }
      }
    });
  });
});
