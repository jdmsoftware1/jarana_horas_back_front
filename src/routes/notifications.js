import express from 'express';
import notificationService from '../services/notificationService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== TOKENS ====================

/**
 * POST /api/notifications/register-token
 * Registrar token de push para el empleado autenticado
 */
router.post('/register-token', authMiddleware, async (req, res) => {
  try {
    const { token, platform, deviceInfo } = req.body;
    const employeeId = req.user.id;
    
    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }
    
    const pushToken = await notificationService.registerToken(
      employeeId,
      token,
      platform || 'android',
      deviceInfo
    );
    
    res.json({ 
      success: true, 
      message: 'Token registrado correctamente',
      tokenId: pushToken.id 
    });
  } catch (error) {
    console.error('Error registrando token:', error);
    res.status(500).json({ error: 'Error registrando token' });
  }
});

/**
 * POST /api/notifications/unregister-token
 * Desactivar token (logout)
 */
router.post('/unregister-token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const employeeId = req.user.id;
    
    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }
    
    await notificationService.deactivateToken(employeeId, token);
    
    res.json({ success: true, message: 'Token desactivado' });
  } catch (error) {
    console.error('Error desactivando token:', error);
    res.status(500).json({ error: 'Error desactivando token' });
  }
});

// ==================== NOTIFICACIONES ====================

/**
 * GET /api/notifications
 * Obtener notificaciones del empleado autenticado
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await notificationService.getEmployeeNotifications(
      employeeId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      notifications: result.rows,
      total: result.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error obteniendo notificaciones' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Obtener cantidad de notificaciones no leídas
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const count = await notificationService.getUnreadCount(employeeId);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    res.status(500).json({ error: 'Error obteniendo conteo' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marcar notificación como leída
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    
    const notification = await notificationService.markAsRead(id, employeeId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({ error: 'Error marcando como leída' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marcar todas las notificaciones como leídas
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { Notification } = await import('../models/Notification.js');
    
    await Notification.update(
      { status: 'read', readAt: new Date() },
      { where: { employeeId, readAt: null } }
    );
    
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({ error: 'Error marcando todas como leídas' });
  }
});

// ==================== ADMIN: ENVIAR NOTIFICACIONES ====================

/**
 * POST /api/notifications/send
 * Enviar notificación a un empleado (solo admin)
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden enviar notificaciones' });
    }
    
    const { employeeId, type, title, body, data } = req.body;
    
    if (!employeeId || !title || !body) {
      return res.status(400).json({ error: 'employeeId, title y body son requeridos' });
    }
    
    const notification = await notificationService.sendToEmployee(
      employeeId,
      type || 'general',
      title,
      body,
      data || {}
    );
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error enviando notificación' });
  }
});

/**
 * POST /api/notifications/send-bulk
 * Enviar notificación a múltiples empleados (solo admin)
 */
router.post('/send-bulk', authMiddleware, async (req, res) => {
  try {
    // Verificar que es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden enviar notificaciones' });
    }
    
    const { employeeIds, type, title, body, data } = req.body;
    
    if (!employeeIds || !Array.isArray(employeeIds) || !title || !body) {
      return res.status(400).json({ error: 'employeeIds (array), title y body son requeridos' });
    }
    
    const results = await notificationService.sendToMultiple(
      employeeIds,
      type || 'general',
      title,
      body,
      data || {}
    );
    
    res.json({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    });
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    res.status(500).json({ error: 'Error enviando notificaciones' });
  }
});

// ==================== TEST ENDPOINT ====================

/**
 * POST /api/notifications/test
 * Endpoint de prueba para verificar que las notificaciones funcionan
 * Solo disponible en desarrollo
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    
    // Crear notificación de prueba
    const notification = await notificationService.sendToEmployee(
      employeeId,
      'general',
      '🧪 Notificación de Prueba',
      'Si ves esto, las notificaciones funcionan correctamente!',
      { test: true, timestamp: new Date().toISOString() }
    );
    
    res.json({ 
      success: true, 
      message: 'Notificación de prueba enviada',
      notification,
      note: 'Si no recibes la notificación push, verifica que tienes un token registrado y Firebase configurado'
    });
  } catch (error) {
    console.error('Error en test de notificación:', error);
    res.status(500).json({ error: 'Error enviando notificación de prueba', details: error.message });
  }
});

/**
 * GET /api/notifications/debug
 * Ver estado del sistema de notificaciones (solo desarrollo)
 */
router.get('/debug', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { PushToken, Notification } = await import('../models/index.js');
    
    // Obtener tokens del usuario
    const tokens = await PushToken.findAll({
      where: { employeeId },
      attributes: ['id', 'token', 'platform', 'isActive', 'lastUsedAt', 'createdAt']
    });
    
    // Obtener últimas 5 notificaciones
    const notifications = await Notification.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'type', 'title', 'status', 'sentAt', 'readAt', 'createdAt']
    });
    
    // Verificar Firebase
    const firebaseConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    
    res.json({
      employeeId,
      tokens: {
        total: tokens.length,
        active: tokens.filter(t => t.isActive).length,
        list: tokens
      },
      notifications: {
        recent: notifications
      },
      firebase: {
        configured: firebaseConfigured,
        note: firebaseConfigured 
          ? 'Firebase Admin SDK configurado' 
          : 'FIREBASE_SERVICE_ACCOUNT no configurado - las notificaciones se guardan pero no se envían'
      }
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({ error: 'Error obteniendo debug info', details: error.message });
  }
});

export default router;
