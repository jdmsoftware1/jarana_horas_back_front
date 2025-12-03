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

  async chat(message, userId = null, userRole = 'employee', conversationHistory = []) {
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
      const dbContext = await this.getDatabaseContext(message, conversationHistory, userRole, userId);
      
      // 3. Construir contexto enriquecido
      let context = this.buildContext(relevantDocs, dbContext);
      
      // 4. Generar respuesta con GPT (con historial)
      const response = await this.generateResponse(message, context, conversationHistory, userRole);
      
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

  async getDatabaseContext(message, conversationHistory = [], userRole = 'employee', userId = null) {
    const messageLower = message.toLowerCase();
    let context = '';

    try {
      // Detectar si hace referencia a la conversación anterior
      let employeeFromHistory = null;
      if (conversationHistory.length > 0) {
        // Buscar el último empleado mencionado en el historial
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const historyMessage = conversationHistory[i];
          if (historyMessage.role === 'user') {
            const employees = await Employee.findAll({
              where: { isActive: true },
              attributes: ['id', 'name', 'employeeCode']
            });
            
            for (const emp of employees) {
              const nameParts = emp.name.toLowerCase().split(' ');
              if (nameParts.some(part => historyMessage.content.toLowerCase().includes(part))) {
                employeeFromHistory = emp;
                break;
              }
            }
            if (employeeFromHistory) break;
          }
        }
      }
      
      // Detectar consultas sobre horarios asignados
      if (messageLower.includes('horario') || messageLower.includes('turno') || 
          messageLower.includes('cuándo trabaja') || messageLower.includes('cuando trabaja') ||
          messageLower.includes('qué días') || messageLower.includes('que dias')) {
        context += await this.getScheduleContext(message, messageLower, employeeFromHistory, userRole, userId);
      }
      
      // Detectar consultas sobre horas trabajadas
      if (messageLower.includes('hora') || messageLower.includes('trabaj') || 
          messageLower.includes('extra') || messageLower.includes('déficit') ||
          messageLower.includes('deficit') || messageLower.includes('cumplimiento') ||
          messageLower.includes('mes') || messageLower.includes('semana') || messageLower.includes('hoy')) {
        context += await this.getHoursContext(message, messageLower, employeeFromHistory, userRole, userId);
      }
      
      // Detectar qué tipo de información se solicita
      if (messageLower.includes('empleado') || messageLower.includes('trabajador')) {
        // Para administradores: mostrar todos los empleados
        // Para empleados: solo mostrar su propia información
        if (userRole === 'admin' || userRole === 'supervisor') {
          const employees = await Employee.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'employeeCode', 'email', 'role'],
            limit: 50
          });
          context += `Total de empleados activos: ${employees.length}\n`;
          context += `Empleados: ${employees.map(e => `${e.name} (${e.employeeCode})`).join(', ')}\n\n`;
        } else if (userId) {
          // Empleado: solo su información
          const employee = await Employee.findByPk(userId, {
            attributes: ['id', 'name', 'employeeCode', 'email', 'role']
          });
          if (employee) {
            context += `Tu información:\n`;
            context += `- Nombre: ${employee.name}\n`;
            context += `- Código: ${employee.employeeCode}\n`;
            context += `- Email: ${employee.email}\n\n`;
          }
        }
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

  async generateResponse(message, context, conversationHistory = [], userRole = 'employee') {
    // Generar prompt diferente según el rol
    let systemPrompt;
    
    if (userRole === 'admin' || userRole === 'supervisor') {
      // Prompt para administradores: más abierto y completo
      systemPrompt = `Eres un asistente de IA avanzado para el sistema de gestión de empleados JARANA.

Como ADMINISTRADOR, tienes acceso completo a toda la información del sistema y puedes responder preguntas sobre:
- 👥 **Todos los empleados**: información personal, roles, contactos
- 📊 **Análisis y estadísticas**: rendimiento, comparativas, tendencias
- ⏰ **Registros de entrada/salida**: de cualquier empleado o equipo
- 📅 **Horarios asignados**: turnos, plantillas, modificaciones
- 🏖️ **Vacaciones y ausencias**: solicitudes, aprobaciones, balances
- 📈 **Horas trabajadas**: reales vs estimadas, horas extra, déficits de todos los empleados
- 🔍 **Reportes personalizados**: cualquier consulta sobre el sistema
- ⚠️ **Alertas y anomalías**: retrasos, ausencias, patrones irregulares

CAPACIDADES AMPLIADAS:
- Responde cualquier pregunta sobre empleados, datos, estadísticas o funcionamiento del software
- Proporciona análisis comparativos entre empleados
- Genera insights y recomendaciones basadas en los datos
- Explica funcionalidades del sistema
- Ayuda con la toma de decisiones administrativas
- Ofrece información detallada sin restricciones

IMPORTANTE:
- Usa toda la información del contexto proporcionado para dar respuestas completas y precisas
- **MANTÉN CONTEXTO**: Si el usuario pregunta "¿y este mes?" después de hablar de un empleado, asume que se refiere al mismo empleado
- Sé proactivo: si detectas información relevante adicional, menciónala
- Usa formato claro con listas, tablas o estructuras cuando sea apropiado
- Responde siempre en español
- Usa emojis para mejorar la claridad: ✅ (positivo), ⚠️ (alerta), 📊 (estadísticas), 👤 (empleado)

EJEMPLOS DE CONSULTAS QUE PUEDES RESPONDER:
- "¿Qué empleados llegaron tarde esta semana?"
- "Muéstrame las estadísticas de horas trabajadas del equipo"
- "¿Quién tiene más horas extra este mes?"
- "Analiza el rendimiento de todos los empleados"
- "¿Cómo funciona el sistema de vacaciones?"
- "Dame un resumen del estado del equipo"
- "¿Qué empleados tienen déficit de horas?"
- "Explícame cómo asignar horarios"

Contexto disponible:
${context}`;
    } else {
      // Prompt para empleados: restringido a información personal
      systemPrompt = `Eres un asistente de IA personal para el sistema de gestión de empleados JARANA.

Como EMPLEADO, puedes consultar tu información personal:
- 👤 **Tu información**: datos personales, código de empleado
- ⏰ **Tus registros**: entradas y salidas
- 📅 **Tu horario**: turnos asignados, días laborables
- 🏖️ **Tus vacaciones**: solicitudes, días disponibles, estado
- 📊 **Tus horas trabajadas**: horas reales, estimadas, extras o déficit
- ❓ **Ayuda general**: cómo usar el sistema, funcionalidades disponibles

RESTRICCIONES:
- Solo puedes acceder a TU información personal
- No puedes ver datos de otros empleados
- No tienes acceso a estadísticas generales del equipo

IMPORTANTE:
- Usa la información del contexto proporcionado para dar respuestas precisas sobre TU información
- Si preguntas sobre otros empleados, te recordaré que solo puedes ver tus propios datos
- Sé conciso y directo
- Usa formato claro con listas cuando sea apropiado
- Responde siempre en español
- Usa emojis cuando sea apropiado: ✅ (positivo), ⚠️ (alerta), 📊 (estadísticas)

EJEMPLOS DE CONSULTAS QUE PUEDES RESPONDER:
- "¿Cuántas horas trabajé esta semana?"
- "¿He fichado entrada hoy?"
- "¿Cuál es mi horario de mañana?"
- "¿Cuántos días de vacaciones me quedan?"
- "Quiero solicitar vacaciones del 15 al 20 de enero"
- "¿Tengo horas extra este mes?"
- "¿Cómo solicito vacaciones?"

Contexto disponible:
${context}`;
    }

    // Construir array de mensajes incluyendo historial
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Añadir historial de conversación (últimos 5 mensajes para no exceder límites)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      messages.push(...recentHistory);
    }

    // Añadir mensaje actual
    messages.push({ role: 'user', content: message });

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0].message.content;
  }

  async getHoursContext(message, messageLower, employeeFromHistory = null, userRole = 'employee', userId = null) {
    let context = '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    // Calcular el lunes de esta semana correctamente (domingo = 0, lunes = 1, etc.)
    // Si es domingo (0), retroceder 6 días; si no, retroceder (día - 1) días
    const dayOfWeekForHours = today.getDay();
    const daysToMondayHours = dayOfWeekForHours === 0 ? 6 : dayOfWeekForHours - 1;
    startOfWeek.setDate(today.getDate() - daysToMondayHours);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // Obtener empleados según el rol
      let employees;
      if (userRole === 'admin' || userRole === 'supervisor') {
        // Administradores pueden ver todos los empleados
        employees = await Employee.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'employeeCode']
        });
      } else if (userId) {
        // Empleados solo pueden ver su propia información
        const employee = await Employee.findByPk(userId, {
          attributes: ['id', 'name', 'employeeCode']
        });
        employees = employee ? [employee] : [];
      } else {
        employees = [];
      }

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
      let specificEmployee = employeeFromHistory; // Usar el del historial si existe
      
      // Si no hay empleado del historial, buscar en el mensaje actual
      if (!specificEmployee) {
        for (const emp of employees) {
          const nameParts = emp.name.toLowerCase().split(' ');
          if (nameParts.some(part => messageLower.includes(part))) {
            specificEmployee = emp;
            break;
          }
        }
      }
      
      // Para empleados, forzar que solo vean su propia información
      if (userRole === 'employee' && userId && specificEmployee && specificEmployee.id !== userId) {
        specificEmployee = employees[0]; // Forzar a su propio empleado
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

  async getScheduleContext(message, messageLower, employeeFromHistory = null, userRole = 'employee', userId = null) {
    let context = '';

    try {
      // Obtener empleados según el rol
      let employees;
      if (userRole === 'admin' || userRole === 'supervisor') {
        // Administradores pueden ver todos los empleados
        employees = await Employee.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'employeeCode']
        });
      } else if (userId) {
        // Empleados solo pueden ver su propia información
        const employee = await Employee.findByPk(userId, {
          attributes: ['id', 'name', 'employeeCode']
        });
        employees = employee ? [employee] : [];
      } else {
        employees = [];
      }

      // Detectar si pregunta por un empleado específico
      let specificEmployee = employeeFromHistory;
      
      if (!specificEmployee) {
        for (const emp of employees) {
          const nameParts = emp.name.toLowerCase().split(' ');
          if (nameParts.some(part => messageLower.includes(part))) {
            specificEmployee = emp;
            break;
          }
        }
      }
      
      // Para empleados, forzar que solo vean su propia información
      if (userRole === 'employee' && userId && specificEmployee && specificEmployee.id !== userId) {
        specificEmployee = employees[0]; // Forzar a su propio empleado
      }

      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      if (specificEmployee) {
        // Consulta sobre un empleado específico
        context += `=== HORARIO ASIGNADO: ${specificEmployee.name} ===\n\n`;

        // Obtener horario base del empleado
        const schedules = await Schedule.findAll({
          where: { employeeId: specificEmployee.id },
          order: [['dayOfWeek', 'ASC']]
        });

        if (schedules.length > 0) {
          context += `HORARIO SEMANAL:\n`;
          
          schedules.forEach(schedule => {
            const dayName = daysOfWeek[schedule.dayOfWeek];
            
            if (schedule.isWorkingDay) {
              context += `\n${dayName}:\n`;
              context += `  - Entrada: ${schedule.startTime}\n`;
              context += `  - Salida: ${schedule.endTime}\n`;
              
              if (schedule.breakStartTime && schedule.breakEndTime) {
                context += `  - Descanso: ${schedule.breakStartTime} - ${schedule.breakEndTime}\n`;
              }
              
              // Calcular horas del día
              const start = new Date(`1970-01-01T${schedule.startTime}`);
              const end = new Date(`1970-01-01T${schedule.endTime}`);
              let dayMinutes = (end - start) / (1000 * 60);
              
              if (schedule.breakStartTime && schedule.breakEndTime) {
                const breakStart = new Date(`1970-01-01T${schedule.breakStartTime}`);
                const breakEnd = new Date(`1970-01-01T${schedule.breakEndTime}`);
                dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
              }
              
              const hours = Math.floor(dayMinutes / 60);
              const minutes = Math.round(dayMinutes % 60);
              context += `  - Total: ${hours}h ${minutes}m\n`;
            } else {
              context += `\n${dayName}: DÍA LIBRE\n`;
            }
          });

          // Calcular total semanal
          let totalWeekMinutes = 0;
          schedules.forEach(schedule => {
            if (schedule.isWorkingDay && schedule.startTime && schedule.endTime) {
              const start = new Date(`1970-01-01T${schedule.startTime}`);
              const end = new Date(`1970-01-01T${schedule.endTime}`);
              let dayMinutes = (end - start) / (1000 * 60);
              
              if (schedule.breakStartTime && schedule.breakEndTime) {
                const breakStart = new Date(`1970-01-01T${schedule.breakStartTime}`);
                const breakEnd = new Date(`1970-01-01T${schedule.breakEndTime}`);
                dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
              }
              
              totalWeekMinutes += dayMinutes;
            }
          });

          const totalHours = Math.floor(totalWeekMinutes / 60);
          const totalMinutes = Math.round(totalWeekMinutes % 60);
          context += `\nTOTAL SEMANAL: ${totalHours}h ${totalMinutes}m\n`;
        } else {
          context += `${specificEmployee.name} no tiene horario asignado.\n`;
        }

        // Verificar si tiene plantilla asignada
        const { WeeklySchedule, ScheduleTemplate } = await import('../models/index.js');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentWeek = this.getWeekNumber(now);

        const weeklySchedule = await WeeklySchedule.findOne({
          where: {
            employeeId: specificEmployee.id,
            year: currentYear,
            weekNumber: currentWeek
          },
          include: [{
            model: ScheduleTemplate,
            as: 'template',
            attributes: ['name', 'description']
          }]
        });

        if (weeklySchedule && weeklySchedule.template) {
          context += `\nPLANTILLA ACTUAL: ${weeklySchedule.template.name}\n`;
          if (weeklySchedule.template.description) {
            context += `Descripción: ${weeklySchedule.template.description}\n`;
          }
        }

        context += '\n';
      } else {
        // Consulta general sobre horarios
        context += `=== RESUMEN DE HORARIOS ===\n\n`;
        
        const employeesWithSchedules = [];
        for (const emp of employees) {
          const schedules = await Schedule.findAll({
            where: { employeeId: emp.id, isWorkingDay: true }
          });

          if (schedules.length > 0) {
            let totalWeekMinutes = 0;
            let hasBreak = false;
            let morningShift = false;
            let afternoonShift = false;
            let splitShift = false;
            
            schedules.forEach(schedule => {
              if (schedule.startTime && schedule.endTime) {
                const start = new Date(`1970-01-01T${schedule.startTime}`);
                const end = new Date(`1970-01-01T${schedule.endTime}`);
                let dayMinutes = (end - start) / (1000 * 60);
                
                // Detectar tipo de turno
                const startHour = parseInt(schedule.startTime.split(':')[0]);
                const endHour = parseInt(schedule.endTime.split(':')[0]);
                
                if (schedule.breakStartTime && schedule.breakEndTime) {
                  hasBreak = true;
                  splitShift = true;
                  const breakStart = new Date(`1970-01-01T${schedule.breakStartTime}`);
                  const breakEnd = new Date(`1970-01-01T${schedule.breakEndTime}`);
                  dayMinutes -= (breakEnd - breakStart) / (1000 * 60);
                }
                
                // Turno de mañana: empieza antes de las 10 y termina antes de las 16
                if (startHour < 10 && endHour <= 16 && !hasBreak) {
                  morningShift = true;
                }
                
                // Turno de tarde: empieza después de las 13
                if (startHour >= 13) {
                  afternoonShift = true;
                }
                
                totalWeekMinutes += dayMinutes;
              }
            });

            const totalHours = Math.floor(totalWeekMinutes / 60);
            const totalMinutes = Math.round(totalWeekMinutes % 60);
            
            let shiftType = 'Completo';
            if (splitShift) shiftType = 'Partido';
            else if (morningShift) shiftType = 'Mañana';
            else if (afternoonShift) shiftType = 'Tarde';
            
            employeesWithSchedules.push({
              name: emp.name,
              workingDays: schedules.length,
              totalHours: `${totalHours}h ${totalMinutes}m`,
              totalMinutes: totalWeekMinutes,
              shiftType: shiftType
            });
          }
        }

        // Detectar qué tipo de consulta es
        if (messageLower.includes('40 horas') || messageLower.includes('40h')) {
          const fullTime = employeesWithSchedules.filter(emp => {
            const hours = Math.floor(emp.totalMinutes / 60);
            return hours >= 38 && hours <= 42; // Rango de 38-42 horas
          });
          
          if (fullTime.length > 0) {
            context += `EMPLEADOS CON JORNADA COMPLETA (≈40 HORAS):\n`;
            fullTime.forEach(emp => {
              context += `- ${emp.name}: ${emp.totalHours} semanales\n`;
            });
          } else {
            context += `No hay empleados con jornada de 40 horas semanales.\n`;
          }
        } else if (messageLower.includes('mañana') || messageLower.includes('manana')) {
          const morningEmployees = employeesWithSchedules.filter(emp => emp.shiftType === 'Mañana');
          
          if (morningEmployees.length > 0) {
            context += `EMPLEADOS CON TURNO DE MAÑANA:\n`;
            morningEmployees.forEach(emp => {
              context += `- ${emp.name}: ${emp.totalHours} semanales\n`;
            });
          } else {
            context += `No hay empleados con turno de mañana exclusivo.\n`;
          }
        } else if (messageLower.includes('tarde')) {
          const afternoonEmployees = employeesWithSchedules.filter(emp => emp.shiftType === 'Tarde');
          
          if (afternoonEmployees.length > 0) {
            context += `EMPLEADOS CON TURNO DE TARDE:\n`;
            afternoonEmployees.forEach(emp => {
              context += `- ${emp.name}: ${emp.totalHours} semanales\n`;
            });
          } else {
            context += `No hay empleados con turno de tarde exclusivo.\n`;
          }
        } else if (messageLower.includes('partido')) {
          const splitEmployees = employeesWithSchedules.filter(emp => emp.shiftType === 'Partido');
          
          if (splitEmployees.length > 0) {
            context += `EMPLEADOS CON TURNO PARTIDO:\n`;
            splitEmployees.forEach(emp => {
              context += `- ${emp.name}: ${emp.totalHours} semanales\n`;
            });
          } else {
            context += `No hay empleados con turno partido.\n`;
          }
        } else {
          // Resumen general con tipo de turno
          if (employeesWithSchedules.length > 0) {
            context += `EMPLEADOS CON HORARIO ASIGNADO:\n`;
            employeesWithSchedules.slice(0, 10).forEach(emp => {
              context += `- ${emp.name}: ${emp.workingDays} días/semana, ${emp.totalHours} semanales (Turno ${emp.shiftType})\n`;
            });
          } else {
            context += `No hay empleados con horarios asignados.\n`;
          }
        }
        
        context += '\n';
      }

    } catch (error) {
      console.error('Error obteniendo contexto de horarios:', error);
      context += 'Error al obtener información de horarios.\n';
    }

    return context;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
