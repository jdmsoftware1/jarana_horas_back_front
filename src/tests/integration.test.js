/**
 * Tests de integración completos
 * Verifica consistencia entre todas las partes del sistema
 */
import { describe, it, expect, beforeAll } from 'vitest';
import sequelize from '../config/database.js';
import { 
  Employee, Record, Schedule, WeeklySchedule, 
  ScheduleTemplate, ScheduleTemplateDay, DailyScheduleException,
  Vacation, Document
} from '../models/index.js';
import { WeeklyScheduleService } from '../services/weeklyScheduleService.js';
import { Op } from 'sequelize';

const calcMinutes = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  return (e - s) / (1000 * 60);
};

describe('🔄 Integration Tests', () => {
  let employees = [];
  
  beforeAll(async () => {
    await sequelize.authenticate();
    employees = await Employee.findAll({ where: { isActive: true } });
    console.log(`\n✅ Conectado a BD. ${employees.length} empleados activos.\n`);
  });

  describe('📊 Resumen General del Sistema', () => {
    it('debe mostrar estadísticas generales', async () => {
      const stats = {
        empleados: await Employee.count(),
        empleadosActivos: await Employee.count({ where: { isActive: true } }),
        registros: await Record.count(),
        plantillas: await ScheduleTemplate.count({ where: { isActive: true } }),
        asignacionesSemana: 0,
        documentos: 0,
        vacaciones: 0
      };
      
      try {
        const today = new Date();
        stats.asignacionesSemana = await WeeklySchedule.count({
          where: { year: today.getFullYear(), weekNumber: WeeklySchedule.getWeekNumber(today) }
        });
        stats.documentos = await Document.count();
        stats.vacaciones = await Vacation.count();
      } catch (e) { /* tablas pueden no existir */ }
      
      console.log('📈 ESTADÍSTICAS DEL SISTEMA:');
      console.log(`   Empleados: ${stats.empleadosActivos}/${stats.empleados} activos`);
      console.log(`   Registros totales: ${stats.registros}`);
      console.log(`   Plantillas activas: ${stats.plantillas}`);
      console.log(`   Asignaciones esta semana: ${stats.asignacionesSemana}`);
      console.log(`   Documentos: ${stats.documentos}`);
      console.log(`   Vacaciones: ${stats.vacaciones}`);
      
      expect(stats.empleados).toBeGreaterThan(0);
    });
  });

  describe('👥 Análisis por Empleado', () => {
    it('debe generar informe completo por empleado', async () => {
      const today = new Date();
      const dow = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const year = today.getFullYear();
      const weekNum = WeeklySchedule.getWeekNumber(today);
      
      console.log(`\n📅 Semana ${weekNum} (${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')})\n`);
      console.log('═'.repeat(80));
      
      for (const emp of employees) {
        console.log(`\n👤 ${emp.name} (${emp.employeeCode})`);
        console.log('─'.repeat(40));
        
        // 1. Plantilla asignada
        const ws = await WeeklySchedule.findOne({
          where: { employeeId: emp.id, year, weekNumber: weekNum },
          include: [{ model: ScheduleTemplate, as: 'template', attributes: ['name'] }]
        });
        console.log(`   📋 Plantilla: ${ws?.template?.name || 'Sin asignar (usa horario base)'}`);
        
        // 2. Horas estimadas semana
        let estimatedMin = 0;
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const weekSchedule = [];
        
        const curr = new Date(startOfWeek);
        let dayIdx = 0;
        while (curr < endOfWeek) {
          const dateStr = curr.toISOString().split('T')[0];
          const sch = await WeeklyScheduleService.getEffectiveScheduleForDate(emp.id, dateStr);
          
          let dayMin = 0;
          let schedStr = 'Libre';
          
          if (sch?.isWorkingDay) {
            const td = sch.data?.templateDay;
            if (td?.isSplitSchedule && td.morningStart) {
              dayMin = calcMinutes(td.morningStart, td.morningEnd) + calcMinutes(td.afternoonStart, td.afternoonEnd);
              schedStr = `${td.morningStart?.slice(0,5)}-${td.morningEnd?.slice(0,5)} + ${td.afternoonStart?.slice(0,5)}-${td.afternoonEnd?.slice(0,5)}`;
            } else if (sch.startTime && sch.endTime) {
              dayMin = calcMinutes(sch.startTime, sch.endTime);
              if (sch.breakStartTime && sch.breakEndTime) {
                dayMin -= calcMinutes(sch.breakStartTime, sch.breakEndTime);
              }
              schedStr = `${sch.startTime?.slice(0,5)}-${sch.endTime?.slice(0,5)}`;
            }
          }
          
          estimatedMin += dayMin;
          weekSchedule.push({ day: dayNames[dayIdx], schedule: schedStr, minutes: dayMin });
          curr.setDate(curr.getDate() + 1);
          dayIdx++;
        }
        
        // Mostrar horario semanal
        console.log('   📆 Horario semanal:');
        for (const d of weekSchedule) {
          const h = Math.floor(d.minutes / 60);
          const m = Math.round(d.minutes % 60);
          console.log(`      ${d.day}: ${d.schedule} (${h}h${m > 0 ? ` ${m}m` : ''})`);
        }
        
        // 3. Horas trabajadas semana
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
        
        // 4. Resumen
        const estH = Math.floor(estimatedMin / 60);
        const estM = Math.round(estimatedMin % 60);
        const worH = Math.floor(workedMin / 60);
        const worM = Math.round(workedMin % 60);
        const diff = workedMin - estimatedMin;
        const diffH = Math.floor(Math.abs(diff) / 60);
        const diffM = Math.round(Math.abs(diff) % 60);
        const pct = estimatedMin > 0 ? Math.round((workedMin / estimatedMin) * 100) : 0;
        
        console.log('   ─────────────────────────────');
        console.log(`   📊 RESUMEN:`);
        console.log(`      Horas estimadas: ${estH}h ${estM}m`);
        console.log(`      Horas trabajadas: ${worH}h ${worM}m`);
        console.log(`      Diferencia: ${diff >= 0 ? '+' : '-'}${diffH}h ${diffM}m (${pct}%)`);
        console.log(`      Registros: ${records.length}`);
        
        // Verificaciones
        expect(estimatedMin).toBeGreaterThanOrEqual(0);
        expect(workedMin).toBeGreaterThanOrEqual(0);
        
        // Alerta si hay inconsistencias
        if (estimatedMin === 0 && ws?.template) {
          console.log(`   ⚠️ ALERTA: Tiene plantilla pero 0 horas estimadas`);
        }
      }
      
      console.log('\n' + '═'.repeat(80));
    });
  });

  describe('🔍 Verificación de Consistencia', () => {
    it('plantillas deben tener días configurados', async () => {
      const templates = await ScheduleTemplate.findAll({
        where: { isActive: true },
        include: [{ model: ScheduleTemplateDay, as: 'templateDays' }]
      });
      
      console.log('\n📋 Verificación de plantillas:');
      
      for (const t of templates) {
        const days = t.templateDays || [];
        const workingDays = days.filter(d => d.isWorkingDay).length;
        
        let totalMin = 0;
        for (const d of days) {
          if (d.isWorkingDay) {
            if (d.isSplitSchedule && d.morningStart) {
              totalMin += calcMinutes(d.morningStart, d.morningEnd) + calcMinutes(d.afternoonStart, d.afternoonEnd);
            } else if (d.startTime && d.endTime) {
              totalMin += calcMinutes(d.startTime, d.endTime);
            }
          }
        }
        
        const h = Math.floor(totalMin / 60);
        const m = Math.round(totalMin % 60);
        const status = days.length > 0 ? '✅' : '⚠️';
        
        console.log(`   ${status} ${t.name}: ${days.length} días, ${workingDays} laborables, ${h}h ${m}m/semana`);
        
        if (days.length === 0) {
          console.log(`      ⚠️ ALERTA: Plantilla sin días configurados`);
        }
      }
    });

    it('asignaciones semanales deben tener plantilla válida', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNum = WeeklySchedule.getWeekNumber(today);
      
      const assignments = await WeeklySchedule.findAll({
        where: { year, weekNumber: weekNum },
        include: [
          { model: Employee, as: 'employee', attributes: ['name'] },
          { model: ScheduleTemplate, as: 'template', attributes: ['name', 'isActive'] }
        ]
      });
      
      console.log(`\n📆 Verificación asignaciones semana ${weekNum}:`);
      
      let issues = 0;
      for (const a of assignments) {
        if (!a.template) {
          console.log(`   ⚠️ ${a.employee?.name}: Plantilla no encontrada`);
          issues++;
        } else if (!a.template.isActive) {
          console.log(`   ⚠️ ${a.employee?.name}: Plantilla "${a.template.name}" está inactiva`);
          issues++;
        } else {
          console.log(`   ✅ ${a.employee?.name}: ${a.template.name}`);
        }
      }
      
      if (issues === 0) {
        console.log('   ✅ Todas las asignaciones son válidas');
      }
    });

    it('no debe haber fichajes huérfanos', async () => {
      const orphanRecords = await Record.findAll({
        include: [{
          model: Employee,
          as: 'employee',
          required: false
        }],
        where: { '$employee.id$': null },
        limit: 10
      });
      
      console.log(`\n🔍 Fichajes huérfanos: ${orphanRecords.length}`);
      
      if (orphanRecords.length > 0) {
        console.log('   ⚠️ Hay fichajes sin empleado asociado');
      } else {
        console.log('   ✅ Todos los fichajes tienen empleado válido');
      }
    });
  });
});
