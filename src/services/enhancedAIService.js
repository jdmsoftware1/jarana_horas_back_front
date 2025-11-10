import OpenAI from 'openai';
import embeddingService from './embeddingService.js';
import sequelize from '../config/database.js';
import { Employee, Record, Schedule, Vacation, WeeklySchedule, ScheduleTemplate } from '../models/index.js';
import { Op } from 'sequelize';

class EnhancedAIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY no configurada');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    await embeddingService.initialize();
    this.initialized = true;
    console.log('✅ Enhanced AI Service inicializado');
  }

  async chat(message, userId = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.openai) {
      return {
        response: "⚠️ Error en el servidor: El servicio de IA no está disponible. Configure OPENAI_API_KEY o póngase en contacto con el administrador.",
        type: 'error'
      };
    }

    try {
      // 1. Buscar documentos relevantes usando embeddings
      const relevantDocs = await embeddingService.searchSimilarDocuments(message, 3);
      
      // 2. Obtener datos de la base de datos si es necesario
      const dbContext = await this.getDatabaseContext(message);
      
      // 3. Construir contexto enriquecido
      let context = this.buildContext(relevantDocs, dbContext);
      
      // 4. Generar respuesta con GPT
      const response = await this.generateResponse(message, context);
      
      return {
        response: response,
        type: 'success',
        sources: relevantDocs.map(d => d.source),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error en chat:', error);
      return {
        response: "⚠️ Error en el servidor: No se pudo procesar tu mensaje. Por favor, reinicie el sistema o póngase en contacto con el administrador.",
        type: 'error',
        error: error.message
      };
    }
  }

  buildContext(relevantDocs, dbContext) {
    let context = '';

    // Añadir documentos relevantes
    if (relevantDocs.length > 0) {
      context += '=== DOCUMENTACIÓN RELEVANTE ===\n\n';
      relevantDocs.forEach((doc, i) => {
        context += `Documento ${i + 1} (${doc.source}, similitud: ${(doc.similarity * 100).toFixed(1)}%):\n`;
        context += doc.content + '\n\n';
      });
    }

    // Añadir datos de la base de datos
    if (dbContext) {
      context += '=== DATOS DE LA BASE DE DATOS ===\n\n';
      context += dbContext + '\n\n';
    }

    return context;
  }

  async getDatabaseContext(message) {
    const messageLower = message.toLowerCase();
    let context = '';

    try {
      // Detectar consultas sobre horas trabajadas
      if (messageLower.includes('hora') || messageLower.includes('trabaj') || 
          messageLower.includes('extra') || messageLower.includes('déficit') ||
          messageLower.includes('deficit') || messageLower.includes('cumplimiento')) {
        context += await this.getHoursContext(message, messageLower);
      }
      
      // Detectar qué tipo de información se solicita
      if (messageLower.includes('empleado') || messageLower.includes('trabajador')) {
        const employees = await Employee.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'employeeCode', 'email', 'role'],
          limit: 50
        });
        context += `Total de empleados activos: ${employees.length}\n`;
        context += `Empleados: ${employees.map(e => `${e.name} (${e.employeeCode})`).join(', ')}\n\n`;
      }

      if (messageLower.includes('tarde') || messageLower.includes('retraso') || messageLower.includes('puntualidad')) {
        // Obtener registros de la última semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const records = await Record.findAll({
          where: {
            timestamp: { [Op.gte]: oneWeekAgo },
            type: 'checkin'
          },
          include: [{
            model: Employee,
            as: 'employee',
            attributes: ['id', 'name', 'employeeCode']
          }],
          order: [['timestamp', 'DESC']],
          limit: 100
        });

        // Obtener horarios para comparar
        const schedules = await Schedule.findAll({
          attributes: ['employeeId', 'dayOfWeek', 'startTime']
        });

        const scheduleMap = {};
        schedules.forEach(s => {
          if (!scheduleMap[s.employeeId]) scheduleMap[s.employeeId] = {};
          scheduleMap[s.employeeId][s.dayOfWeek] = s.startTime;
        });

        // Analizar retrasos
        const lateArrivals = [];
        records.forEach(record => {
          const dayOfWeek = new Date(record.timestamp).getDay();
          const employeeSchedule = scheduleMap[record.employeeId];
          
          if (employeeSchedule && employeeSchedule[dayOfWeek]) {
            const scheduledTime = employeeSchedule[dayOfWeek];
            const actualTime = new Date(record.timestamp).toTimeString().slice(0, 5);
            
            if (actualTime > scheduledTime) {
              lateArrivals.push({
                employee: record.employee.name,
                date: new Date(record.timestamp).toLocaleDateString('es-ES'),
                scheduled: scheduledTime,
                actual: actualTime
              });
            }
          }
        });

        if (lateArrivals.length > 0) {
          context += `Llegadas tarde esta semana: ${lateArrivals.length}\n`;
          lateArrivals.slice(0, 10).forEach(late => {
            context += `- ${late.employee}: ${late.date}, esperado ${late.scheduled}, llegó ${late.actual}\n`;
          });
          context += '\n';
        } else {
          context += 'No se detectaron llegadas tarde esta semana.\n\n';
        }
      }

      if (messageLower.includes('vacacion') || messageLower.includes('ausencia')) {
        const vacations = await Vacation.findAll({
          where: {
            startDate: { [Op.gte]: new Date() }
          },
          include: [{
            model: Employee,
            as: 'employee',
            attributes: ['name', 'employeeCode']
          }],
          order: [['startDate', 'ASC']],
          limit: 20
        });

        context += `Próximas vacaciones: ${vacations.length}\n`;
        vacations.forEach(v => {
          context += `- ${v.employee.name}: ${new Date(v.startDate).toLocaleDateString('es-ES')} a ${new Date(v.endDate).toLocaleDateString('es-ES')} (${v.status})\n`;
        });
        context += '\n';
      }

      if (messageLower.includes('horario') || messageLower.includes('plantilla') || messageLower.includes('turno')) {
        const templates = await ScheduleTemplate.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'description'],
          limit: 20
        });

        context += `Plantillas de horario disponibles: ${templates.length}\n`;
        templates.forEach(t => {
          context += `- ${t.name}: ${t.description || 'Sin descripción'}\n`;
        });
        context += '\n';
      }

      // Estadísticas generales si no se detectó nada específico
      if (!context) {
        const [employeeCount, recordCount, vacationCount] = await Promise.all([
          Employee.count({ where: { isActive: true } }),
          Record.count(),
          Vacation.count()
        ]);

        context += `Estadísticas del sistema:\n`;
        context += `- Empleados activos: ${employeeCount}\n`;
        context += `- Total de registros: ${recordCount}\n`;
        context += `- Total de vacaciones: ${vacationCount}\n\n`;
      }

    } catch (error) {
      console.error('Error obteniendo contexto de BD:', error);
      context += 'Error al obtener datos de la base de datos.\n';
    }

    return context;
  }

  async generateResponse(message, context) {
    const systemPrompt = `Eres un asistente de IA para el sistema de gestión de empleados JARANA.

Tu trabajo es ayudar a responder preguntas sobre:
- Empleados y su información
- Registros de entrada/salida
- Horarios y plantillas
- Vacaciones y ausencias
- Estadísticas y reportes
- **Horas trabajadas** (reales vs estimadas, horas extra, déficits)

IMPORTANTE:
- Usa la información del contexto proporcionado para dar respuestas precisas
- Si no tienes información suficiente, dilo claramente
- Sé conciso y directo
- Usa formato claro con listas cuando sea apropiado
- Responde siempre en español
- Para consultas de horas, presenta la información de forma clara y estructurada
- Usa emojis cuando sea apropiado: ✅ (horas extra), ⚠️ (déficit), 📊 (estadísticas)

EJEMPLOS DE CONSULTAS QUE PUEDES RESPONDER:
- "¿Cuántas horas trabajó Juan hoy?"
- "¿Quién hizo más horas esta semana?"
- "¿Qué empleados tienen horas extra este mes?"
- "¿Hay empleados con déficit de horas?"
- "Muéstrame el ranking de horas trabajadas"

Contexto disponible:
${context}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0].message.content;
  }

  async getHoursContext(message, messageLower) {
    let context = '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // Obtener todos los empleados activos
      const employees = await Employee.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'employeeCode']
      });

      // Función helper para calcular horas trabajadas
      const calculateHours = async (employeeId, startDate, endDate) => {
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

      // Función para calcular horas estimadas
      const calculateEstimatedHours = async (employeeId, startDate, endDate) => {
        let totalMinutes = 0;
        const currentDate = new Date(startDate);

        while (currentDate < endDate) {
          const dayOfWeek = currentDate.getDay();
          
          const schedule = await Schedule.findOne({
            where: { employeeId, dayOfWeek }
          });

          if (schedule && schedule.isWorkingDay && schedule.startTime && schedule.endTime) {
            const start = new Date(`1970-01-01T${schedule.startTime}`);
            const end = new Date(`1970-01-01T${schedule.endTime}`);
            let dayMinutes = (end - start) / (1000 * 60);

            if (schedule.breakStartTime && schedule.breakEndTime) {
              const breakStart = new Date(`1970-01-01T${schedule.breakStartTime}`);
              const breakEnd = new Date(`1970-01-01T${schedule.breakEndTime}`);
              dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
            }

            totalMinutes += dayMinutes;
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
          hours: Math.floor(totalMinutes / 60),
          minutes: Math.round(totalMinutes % 60),
          totalMinutes: Math.round(totalMinutes)
        };
      };

      // Detectar si pregunta por un empleado específico
      let specificEmployee = null;
      for (const emp of employees) {
        const nameParts = emp.name.toLowerCase().split(' ');
        if (nameParts.some(part => messageLower.includes(part))) {
          specificEmployee = emp;
          break;
        }
      }

      // Detectar período (hoy, semana, mes)
      const isToday = messageLower.includes('hoy') || messageLower.includes('día');
      const isWeek = messageLower.includes('semana');
      const isMonth = messageLower.includes('mes');

      if (specificEmployee) {
        // Consulta sobre un empleado específico
        context += `=== HORAS TRABAJADAS: ${specificEmployee.name} ===\n\n`;

        if (isToday || (!isWeek && !isMonth)) {
          const todayEnd = new Date(today);
          todayEnd.setDate(today.getDate() + 1);
          const actual = await calculateHours(specificEmployee.id, today, todayEnd);
          const estimated = await calculateEstimatedHours(specificEmployee.id, today, todayEnd);
          
          context += `HOY (${today.toLocaleDateString('es-ES')}):\n`;
          context += `- Horas trabajadas: ${actual.hours}h ${actual.minutes}m\n`;
          context += `- Horas estimadas: ${estimated.hours}h ${estimated.minutes}m\n`;
          const diff = actual.totalMinutes - estimated.totalMinutes;
          if (diff > 0) {
            context += `- Horas extra: +${Math.floor(diff / 60)}h ${diff % 60}m\n`;
          } else if (diff < 0) {
            context += `- Déficit: -${Math.floor(Math.abs(diff) / 60)}h ${Math.abs(diff) % 60}m\n`;
          }
          context += '\n';
        }

        if (isWeek) {
          const weekEnd = new Date(startOfWeek);
          weekEnd.setDate(startOfWeek.getDate() + 7);
          const actual = await calculateHours(specificEmployee.id, startOfWeek, weekEnd);
          const estimated = await calculateEstimatedHours(specificEmployee.id, startOfWeek, weekEnd);
          
          context += `ESTA SEMANA:\n`;
          context += `- Horas trabajadas: ${actual.hours}h ${actual.minutes}m\n`;
          context += `- Horas estimadas: ${estimated.hours}h ${estimated.minutes}m\n`;
          const diff = actual.totalMinutes - estimated.totalMinutes;
          if (diff > 0) {
            context += `- Horas extra: +${Math.floor(diff / 60)}h ${diff % 60}m\n`;
          } else if (diff < 0) {
            context += `- Déficit: -${Math.floor(Math.abs(diff) / 60)}h ${Math.abs(diff) % 60}m\n`;
          }
          context += '\n';
        }

        if (isMonth) {
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const actual = await calculateHours(specificEmployee.id, startOfMonth, monthEnd);
          const estimated = await calculateEstimatedHours(specificEmployee.id, startOfMonth, monthEnd);
          
          context += `ESTE MES:\n`;
          context += `- Horas trabajadas: ${actual.hours}h ${actual.minutes}m\n`;
          context += `- Horas estimadas: ${estimated.hours}h ${estimated.minutes}m\n`;
          const diff = actual.totalMinutes - estimated.totalMinutes;
          if (diff > 0) {
            context += `- Horas extra: +${Math.floor(diff / 60)}h ${diff % 60}m\n`;
          } else if (diff < 0) {
            context += `- Déficit: -${Math.floor(Math.abs(diff) / 60)}h ${Math.abs(diff) % 60}m\n`;
          }
          context += '\n';
        }
      } else {
        // Consulta general sobre todos los empleados
        context += `=== RESUMEN DE HORAS TRABAJADAS ===\n\n`;

        const period = isMonth ? 'mes' : isWeek ? 'semana' : 'hoy';
        const startDate = isMonth ? startOfMonth : isWeek ? startOfWeek : today;
        const endDate = isMonth ? new Date(now.getFullYear(), now.getMonth() + 1, 1) :
                       isWeek ? new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000) :
                       new Date(today.getTime() + 24 * 60 * 60 * 1000);

        context += `Período: ${period.toUpperCase()}\n\n`;

        const employeeStats = [];
        for (const emp of employees.slice(0, 10)) { // Limitar a 10 empleados
          const actual = await calculateHours(emp.id, startDate, endDate);
          const estimated = await calculateEstimatedHours(emp.id, startDate, endDate);
          const diff = actual.totalMinutes - estimated.totalMinutes;
          
          employeeStats.push({
            name: emp.name,
            actual: actual.totalMinutes,
            estimated: estimated.totalMinutes,
            diff: diff,
            actualFormatted: `${actual.hours}h ${actual.minutes}m`,
            diffFormatted: diff >= 0 ? `+${Math.floor(diff / 60)}h ${diff % 60}m` : `-${Math.floor(Math.abs(diff) / 60)}h ${Math.abs(diff) % 60}m`
          });
        }

        // Ordenar por horas trabajadas si se pregunta por ranking
        if (messageLower.includes('más') || messageLower.includes('ranking') || messageLower.includes('quién')) {
          employeeStats.sort((a, b) => b.actual - a.actual);
          context += `RANKING DE HORAS TRABAJADAS:\n`;
          employeeStats.forEach((stat, i) => {
            context += `${i + 1}. ${stat.name}: ${stat.actualFormatted}\n`;
          });
        } else if (messageLower.includes('extra')) {
          // Mostrar solo los que tienen horas extra
          const withOvertime = employeeStats.filter(s => s.diff > 0).sort((a, b) => b.diff - a.diff);
          context += `EMPLEADOS CON HORAS EXTRA:\n`;
          if (withOvertime.length > 0) {
            withOvertime.forEach(stat => {
              context += `- ${stat.name}: ${stat.diffFormatted}\n`;
            });
          } else {
            context += `No hay empleados con horas extra en este período.\n`;
          }
        } else if (messageLower.includes('déficit') || messageLower.includes('deficit')) {
          // Mostrar solo los que tienen déficit
          const withDeficit = employeeStats.filter(s => s.diff < 0).sort((a, b) => a.diff - b.diff);
          context += `EMPLEADOS CON DÉFICIT DE HORAS:\n`;
          if (withDeficit.length > 0) {
            withDeficit.forEach(stat => {
              context += `- ${stat.name}: ${stat.diffFormatted}\n`;
            });
          } else {
            context += `No hay empleados con déficit de horas en este período.\n`;
          }
        } else {
          // Mostrar resumen general
          context += `RESUMEN GENERAL:\n`;
          employeeStats.forEach(stat => {
            context += `- ${stat.name}: ${stat.actualFormatted} (${stat.diff >= 0 ? 'Extra' : 'Déficit'}: ${stat.diffFormatted})\n`;
          });
        }
        context += '\n';
      }

    } catch (error) {
      console.error('Error obteniendo contexto de horas:', error);
      context += 'Error al calcular horas trabajadas.\n';
    }

    return context;
  }

  async executeSQL(query) {
    try {
      const [results] = await sequelize.query(query);
      return results;
    } catch (error) {
      console.error('Error ejecutando SQL:', error);
      throw error;
    }
  }
}

const enhancedAIService = new EnhancedAIService();

export default enhancedAIService;
