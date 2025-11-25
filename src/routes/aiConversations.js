import express from 'express';
import { AIConversation, Employee } from '../models/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todas las conversaciones del usuario actual
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    const conversations = await AIConversation.findAll({
      where: { employeeId },
      order: [['last_message_at', 'DESC']],
      attributes: ['id', 'title', 'userRole', 'lastMessageAt', 'createdAt']
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener conversaciones', details: error.message });
  }
});

// Obtener una conversación específica con todos sus mensajes
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.employee.id;
    
    const conversation = await AIConversation.findOne({
      where: { 
        id,
        employeeId 
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error al obtener conversación' });
  }
});

// Crear o actualizar una conversación
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { conversationId, messages, userRole } = req.body;
    const employeeId = req.employee.id;

    // Generar título del primer mensaje del usuario
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    const title = firstUserMessage 
      ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      : 'Nueva conversación';

    if (conversationId) {
      // Actualizar conversación existente
      const conversation = await AIConversation.findOne({
        where: { 
          id: conversationId,
          employeeId 
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversación no encontrada' });
      }

      conversation.messages = messages;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      res.json(conversation);
    } else {
      // Crear nueva conversación
      const conversation = await AIConversation.create({
        employeeId,
        title,
        messages,
        userRole: userRole || 'employee',
        lastMessageAt: new Date()
      });

      res.status(201).json(conversation);
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Error al guardar conversación' });
  }
});

// Eliminar una conversación
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.employee.id;
    
    const conversation = await AIConversation.findOne({
      where: { 
        id,
        employeeId 
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    await conversation.destroy();

    res.json({ message: 'Conversación eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

// Eliminar todas las conversaciones del usuario
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    await AIConversation.destroy({
      where: { employeeId }
    });

    res.json({ message: 'Todas las conversaciones eliminadas correctamente' });
  } catch (error) {
    console.error('Error deleting all conversations:', error);
    res.status(500).json({ error: 'Error al eliminar conversaciones' });
  }
});

export default router;
