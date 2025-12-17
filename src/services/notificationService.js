import admin from 'firebase-admin';
import PushToken from '../models/PushToken.js';
import Notification from '../models/Notification.js';

// Inicializar Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;
  
  try {
    // Firebase se inicializa con credenciales desde variable de entorno
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK inicializado');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT no configurado - notificaciones deshabilitadas');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
  }
};

// Inicializar al cargar el módulo
initializeFirebase();

class NotificationService {
  
  /**
   * Registrar token de push para un empleado
   */
  async registerToken(employeeId, token, platform = 'android', deviceInfo = null) {
    try {
      // Buscar si ya existe este token para este empleado
      const existing = await PushToken.findOne({
        where: { employeeId, token }
      });
      
      if (existing) {
        // Actualizar último uso
        await existing.update({ 
          isActive: true, 
          lastUsedAt: new Date(),
          deviceInfo 
        });
        return existing;
      }
      
      // Crear nuevo registro
      const pushToken = await PushToken.create({
        employeeId,
        token,
        platform,
        deviceInfo,
        isActive: true,
        lastUsedAt: new Date(),
      });
      
      console.log(`📱 Token registrado para empleado ${employeeId}`);
      return pushToken;
    } catch (error) {
      console.error('Error registrando token:', error);
      throw error;
    }
  }
  
  /**
   * Desactivar token (logout o token inválido)
   */
  async deactivateToken(employeeId, token) {
    try {
      await PushToken.update(
        { isActive: false },
        { where: { employeeId, token } }
      );
      console.log(`📱 Token desactivado para empleado ${employeeId}`);
    } catch (error) {
      console.error('Error desactivando token:', error);
    }
  }
  
  /**
   * Obtener tokens activos de un empleado
   */
  async getActiveTokens(employeeId) {
    return await PushToken.findAll({
      where: { employeeId, isActive: true }
    });
  }
  
  /**
   * Enviar notificación a un empleado
   */
  async sendToEmployee(employeeId, type, title, body, data = {}) {
    try {
      // Crear registro de notificación
      const notification = await Notification.create({
        employeeId,
        type,
        title,
        body,
        data,
        status: 'pending',
      });
      
      // Obtener tokens activos
      const tokens = await this.getActiveTokens(employeeId);
      
      if (tokens.length === 0) {
        await notification.update({ 
          status: 'failed', 
          errorMessage: 'No hay tokens activos' 
        });
        console.log(`⚠️ No hay tokens para empleado ${employeeId}`);
        return notification;
      }
      
      // Si Firebase no está inicializado, solo guardar la notificación
      if (!firebaseInitialized) {
        await notification.update({ 
          status: 'failed', 
          errorMessage: 'Firebase no inicializado' 
        });
        return notification;
      }
      
      // Enviar a todos los dispositivos del empleado
      const tokenStrings = tokens.map(t => t.token);
      
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          type,
          notificationId: notification.id,
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
        },
        tokens: tokenStrings,
      };
      
      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Procesar respuestas
      let successCount = 0;
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          successCount++;
        } else {
          // Si el token es inválido, desactivarlo
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            this.deactivateToken(employeeId, tokenStrings[idx]);
          }
        }
      });
      
      // Actualizar estado de la notificación
      await notification.update({
        status: successCount > 0 ? 'sent' : 'failed',
        sentAt: new Date(),
        errorMessage: successCount === 0 ? 'Todos los envíos fallaron' : null,
      });
      
      console.log(`📤 Notificación enviada a ${employeeId}: ${successCount}/${tokens.length} exitosos`);
      return notification;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      throw error;
    }
  }
  
  /**
   * Enviar notificación a múltiples empleados
   */
  async sendToMultiple(employeeIds, type, title, body, data = {}) {
    const results = [];
    for (const employeeId of employeeIds) {
      try {
        const result = await this.sendToEmployee(employeeId, type, title, body, data);
        results.push({ employeeId, success: true, notification: result });
      } catch (error) {
        results.push({ employeeId, success: false, error: error.message });
      }
    }
    return results;
  }
  
  // ==================== NOTIFICACIONES ESPECÍFICAS ====================
  
  /**
   * Recordatorio de fichaje (llamado por cron job)
   */
  async sendCheckInReminder(employeeId, scheduledTime) {
    return this.sendToEmployee(
      employeeId,
      'check_in_reminder',
      '⏰ ¡No olvides fichar!',
      `Tu turno empezó a las ${scheduledTime}. Recuerda registrar tu entrada.`,
      { action: 'open_checkin' }
    );
  }
  
  /**
   * Nuevo horario asignado
   */
  async sendScheduleAssigned(employeeId, weekNumber, year, templateName) {
    return this.sendToEmployee(
      employeeId,
      'schedule_assigned',
      '📅 Nuevo horario asignado',
      `Se te ha asignado el horario "${templateName}" para la semana ${weekNumber} de ${year}.`,
      { action: 'open_schedule', weekNumber, year }
    );
  }
  
  /**
   * Documento pendiente de revisar
   */
  async sendDocumentPending(employeeId, documentTitle, documentId) {
    return this.sendToEmployee(
      employeeId,
      'document_pending',
      '📄 Nuevo documento disponible',
      `Tienes un nuevo documento: "${documentTitle}"`,
      { action: 'open_document', documentId }
    );
  }
  
  /**
   * Estado de ausencia actualizado
   */
  async sendAbsenceStatus(employeeId, status, absenceType, startDate) {
    const statusText = status === 'approved' ? 'aprobada ✅' : 'rechazada ❌';
    return this.sendToEmployee(
      employeeId,
      'absence_status',
      `Solicitud ${statusText}`,
      `Tu solicitud de ${absenceType} para el ${startDate} ha sido ${statusText}.`,
      { action: 'open_absences', status }
    );
  }
  
  /**
   * Recordatorio de fin de turno
   */
  async sendShiftEndingReminder(employeeId, endTime) {
    return this.sendToEmployee(
      employeeId,
      'shift_ending',
      '🔔 Tu turno termina pronto',
      `Tu turno termina a las ${endTime}. No olvides fichar la salida.`,
      { action: 'open_checkin' }
    );
  }
  
  // ==================== CONSULTAS ====================
  
  /**
   * Obtener notificaciones de un empleado
   */
  async getEmployeeNotifications(employeeId, limit = 50, offset = 0) {
    return await Notification.findAndCountAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }
  
  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId, employeeId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, employeeId }
    });
    
    if (notification && !notification.readAt) {
      await notification.update({ 
        status: 'read',
        readAt: new Date() 
      });
    }
    
    return notification;
  }
  
  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(employeeId) {
    return await Notification.count({
      where: { 
        employeeId, 
        readAt: null,
        status: 'sent'
      }
    });
  }
}

export default new NotificationService();
