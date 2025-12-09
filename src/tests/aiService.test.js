/**
 * Tests para el servicio de IA
 */
import { describe, it, expect, beforeAll } from 'vitest';
import sequelize from '../config/database.js';
import { Employee, Record, Schedule, WeeklySchedule, ScheduleTemplate } from '../models/index.js';
import { Op } from 'sequelize';

const calculateHours = async (employeeId, startDate, endDate) => {
  const records = await Record.findAll({
    where: { employeeId, timestamp: { [Op.gte]: startDate, [Op.lt]: endDate } },
    order: [['timestamp', 'ASC']]
  });
  let totalMinutes = 0, lastCheckin = null;
  for (const record of records) {
    if (record.type === 'checkin') lastCheckin = record.timestamp;
    else if (record.type === 'checkout' && lastCheckin) {
      totalMinutes += (new Date(record.timestamp) - new Date(lastCheckin)) / (1000 * 60);
      lastCheckin = null;
    }
  }
  return { hours: Math.floor(totalMinutes / 60), minutes: Math.round(totalMinutes % 60), totalMinutes: Math.round(totalMinutes) };
};

describe('AI Service Tests', () => {
  let employees = [];
  beforeAll(async () => {
    await sequelize.authenticate();
    employees = await Employee.findAll({ where: { isActive: true }, limit: 5 });
  });

  it('calcula horas trabajadas hoy', async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    for (const emp of employees) {
      const h = await calculateHours(emp.id, today, tomorrow);
      console.log(`${emp.name}: ${h.hours}h ${h.minutes}m hoy`);
      expect(h.totalMinutes).toBeGreaterThanOrEqual(0);
    }
  });

  it('calcula horas trabajadas esta semana', async () => {
    const today = new Date();
    const dow = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    for (const emp of employees) {
      const h = await calculateHours(emp.id, startOfWeek, endOfWeek);
      console.log(`${emp.name}: ${h.hours}h ${h.minutes}m semana`);
      expect(h.totalMinutes).toBeGreaterThanOrEqual(0);
    }
  });

  it('detecta contexto de mensajes', () => {
    const detect = (msg) => {
      const l = msg.toLowerCase();
      if (l.includes('hora') && l.includes('hoy')) return 'hours_today';
      if (l.includes('hora') && l.includes('semana')) return 'hours_week';
      if (l.includes('horario')) return 'schedule';
      return 'general';
    };
    expect(detect('¿Cuántas horas hoy?')).toBe('hours_today');
    expect(detect('Horas esta semana')).toBe('hours_week');
    expect(detect('Mi horario')).toBe('schedule');
  });
});
