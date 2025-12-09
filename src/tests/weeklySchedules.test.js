/**
 * Tests para horarios semanales y plantillas
 * Verifica la correcta asignación y visualización de horarios
 */

import { describe, it, expect, beforeAll } from 'vitest';
import sequelize from '../config/database.js';
import { 
  Employee, 
  WeeklySchedule, 
  ScheduleTemplate, 
  ScheduleTemplateDay,
  Schedule
} from '../models/index.js';
import { WeeklyScheduleService } from '../services/weeklyScheduleService.js';

describe('Weekly Schedules Tests', () => {
  let testEmployees = [];
  let templates = [];
  
  beforeAll(async () => {
    await sequelize.authenticate();
    
    testEmployees = await Employee.findAll({
      where: { isActive: true },
      limit: 10
    });
    
    templates = await ScheduleTemplate.findAll({
      where: { isActive: true },
      include: [{
        model: ScheduleTemplateDay,
        as: 'templateDays'
      }]
    });
    
    console.log(`\n📋 Plantillas disponibles: ${templates.length}`);
    templates.forEach(t => {
      console.log(`   - ${t.name}: ${t.templateDays?.length || 0} días configurados`);
    });
  });

  describe('Plantillas de horario', () => {
    it('cada plantilla debe tener días configurados correctamente', async () => {
      for (const template of templates) {
        expect(template.templateDays).toBeDefined();
        
        console.log(`\n   Plantilla: ${template.name}`);
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        for (const day of template.templateDays || []) {
          const dayName = dayNames[day.dayOfWeek];
          
          if (day.isWorkingDay) {
            if (day.isSplitSchedule) {
              console.log(`      ${dayName}: 🌅 ${day.morningStart}-${day.morningEnd} | 🌆 ${day.afternoonStart}-${day.afternoonEnd}`);
              expect(day.morningStart).toBeDefined();
              expect(day.morningEnd).toBeDefined();
              expect(day.afternoonStart).toBeDefined();
              expect(day.afternoonEnd).toBeDefined();
            } else {
              console.log(`      ${dayName}: ${day.startTime} - ${day.endTime}`);
              expect(day.startTime).toBeDefined();
              expect(day.endTime).toBeDefined();
            }
          } else {
            console.log(`      ${dayName}: Día libre`);
          }
        }
      }
    });

    it('las horas totales de cada plantilla deben ser razonables', async () => {
      for (const template of templates) {
        let totalMinutes = 0;
        
        for (const day of template.templateDays || []) {
          if (day.isWorkingDay) {
            if (day.isSplitSchedule && day.morningStart && day.morningEnd && day.afternoonStart && day.afternoonEnd) {
              const morningStart = new Date(`1970-01-01T${day.morningStart}`);
              const morningEnd = new Date(`1970-01-01T${day.morningEnd}`);
              const afternoonStart = new Date(`1970-01-01T${day.afternoonStart}`);
              const afternoonEnd = new Date(`1970-01-01T${day.afternoonEnd}`);
              
              totalMinutes += (morningEnd - morningStart) / (1000 * 60);
              totalMinutes += (afternoonEnd - afternoonStart) / (1000 * 60);
            } else if (day.startTime && day.endTime) {
              const start = new Date(`1970-01-01T${day.startTime}`);
              const end = new Date(`1970-01-01T${day.endTime}`);
              let dayMinutes = (end - start) / (1000 * 60);
              
              if (day.breakStartTime && day.breakEndTime) {
                const breakStart = new Date(`1970-01-01T${day.breakStartTime}`);
                const breakEnd = new Date(`1970-01-01T${day.breakEndTime}`);
                dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
              }
              
              totalMinutes += dayMinutes;
            }
          }
        }
        
        const totalHours = totalMinutes / 60;
        console.log(`   ${template.name}: ${totalHours.toFixed(1)}h semanales`);
        
        // Una plantilla razonable debería tener entre 0 y 60 horas semanales
        expect(totalHours).toBeGreaterThanOrEqual(0);
        expect(totalHours).toBeLessThanOrEqual(60);
      }
    });
  });

  describe('Asignaciones semanales', () => {
    it('debe listar las asignaciones de la semana actual', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      
      console.log(`\n   Semana ${weekNumber} del ${year}:`);
      
      const assignments = await WeeklySchedule.findAll({
        where: { year, weekNumber },
        include: [
          { model: Employee, as: 'employee', attributes: ['name', 'employeeCode'] },
          { model: ScheduleTemplate, as: 'template', attributes: ['name'] }
        ]
      });
      
      console.log(`   Total asignaciones: ${assignments.length}`);
      
      for (const assignment of assignments) {
        console.log(`      ${assignment.employee?.name}: ${assignment.template?.name || 'Sin plantilla'}`);
        expect(assignment.employeeId).toBeDefined();
      }
    });

    it('cada empleado debe tener máximo una asignación por semana', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      
      for (const employee of testEmployees) {
        const assignments = await WeeklySchedule.findAll({
          where: {
            employeeId: employee.id,
            year,
            weekNumber
          }
        });
        
        expect(assignments.length).toBeLessThanOrEqual(1);
        
        if (assignments.length > 1) {
          console.log(`   ⚠️ ${employee.name}: Tiene ${assignments.length} asignaciones para la misma semana!`);
        }
      }
    });
  });

  describe('Horarios base vs Plantillas semanales', () => {
    it('debe comparar horario base con plantilla semanal asignada', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = WeeklySchedule.getWeekNumber(today);
      const dayOfWeek = today.getDay();
      
      console.log(`\n   Comparación para hoy (día ${dayOfWeek}):`);
      
      for (const employee of testEmployees) {
        // Horario base
        const baseSchedule = await Schedule.findOne({
          where: { employeeId: employee.id, dayOfWeek }
        });
        
        // Plantilla semanal
        const weeklySchedule = await WeeklySchedule.findOne({
          where: { employeeId: employee.id, year, weekNumber },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            include: [{
              model: ScheduleTemplateDay,
              as: 'templateDays',
              where: { dayOfWeek },
              required: false
            }]
          }]
        });
        
        const templateDay = weeklySchedule?.template?.templateDays?.[0];
        
        console.log(`\n   ${employee.name}:`);
        
        if (baseSchedule) {
          console.log(`      Base: ${baseSchedule.startTime || 'N/A'} - ${baseSchedule.endTime || 'N/A'}`);
        } else {
          console.log(`      Base: No configurado`);
        }
        
        if (templateDay) {
          if (templateDay.isSplitSchedule) {
            console.log(`      Plantilla: ${templateDay.morningStart}-${templateDay.morningEnd} + ${templateDay.afternoonStart}-${templateDay.afternoonEnd}`);
          } else {
            console.log(`      Plantilla: ${templateDay.startTime || 'N/A'} - ${templateDay.endTime || 'N/A'}`);
          }
        } else {
          console.log(`      Plantilla: No asignada`);
        }
        
        // Horario efectivo
        const effective = await WeeklyScheduleService.getEffectiveScheduleForDate(
          employee.id, 
          today.toISOString().split('T')[0]
        );
        console.log(`      Efectivo: ${effective.type} - ${effective.isWorkingDay ? 'Trabaja' : 'Libre'}`);
      }
    });
  });

  describe('Vista semanal completa', () => {
    it('debe generar vista semanal correcta para cada empleado', async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - daysToMonday);
      
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      
      for (const employee of testEmployees.slice(0, 3)) { // Solo 3 empleados para no saturar
        console.log(`\n   📅 ${employee.name}:`);
        
        let weeklyTotal = 0;
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const schedule = await WeeklyScheduleService.getEffectiveScheduleForDate(employee.id, dateStr);
          
          let dayMinutes = 0;
          let scheduleStr = 'Libre';
          
          if (schedule.isWorkingDay) {
            const templateDay = schedule.data?.templateDay;
            
            if (templateDay?.isSplitSchedule && templateDay.morningStart) {
              const ms = new Date(`1970-01-01T${templateDay.morningStart}`);
              const me = new Date(`1970-01-01T${templateDay.morningEnd}`);
              const as = new Date(`1970-01-01T${templateDay.afternoonStart}`);
              const ae = new Date(`1970-01-01T${templateDay.afternoonEnd}`);
              
              dayMinutes = ((me - ms) + (ae - as)) / (1000 * 60);
              scheduleStr = `${templateDay.morningStart.slice(0,5)}-${templateDay.morningEnd.slice(0,5)} + ${templateDay.afternoonStart.slice(0,5)}-${templateDay.afternoonEnd.slice(0,5)}`;
            } else if (schedule.startTime && schedule.endTime) {
              const start = new Date(`1970-01-01T${schedule.startTime}`);
              const end = new Date(`1970-01-01T${schedule.endTime}`);
              dayMinutes = (end - start) / (1000 * 60);
              
              if (schedule.breakStartTime && schedule.breakEndTime) {
                const bs = new Date(`1970-01-01T${schedule.breakStartTime}`);
                const be = new Date(`1970-01-01T${schedule.breakEndTime}`);
                dayMinutes -= (be - bs) / (1000 * 60);
              }
              
              scheduleStr = `${schedule.startTime.slice(0,5)}-${schedule.endTime.slice(0,5)}`;
            }
          }
          
          weeklyTotal += dayMinutes;
          const hours = Math.floor(dayMinutes / 60);
          const mins = Math.round(dayMinutes % 60);
          
          console.log(`      ${dayNames[i]}: ${scheduleStr} (${hours}h${mins > 0 ? ` ${mins}m` : ''})`);
        }
        
        const totalHours = Math.floor(weeklyTotal / 60);
        const totalMins = Math.round(weeklyTotal % 60);
        console.log(`      ────────────────────────────`);
        console.log(`      TOTAL: ${totalHours}h ${totalMins}m`);
      }
    });
  });
});
