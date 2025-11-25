import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { Document, Employee } from '../models/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar carpeta de uploads
const uploadsPath = path.join(__dirname, '../../uploads/documents');

// Asegurar que la carpeta existe
await fs.mkdir(uploadsPath, { recursive: true });

// Configurar multer para upload de documentos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, Word e imágenes'));
    }
  }
});

// ============================================
// RUTAS PARA EMPLEADOS → ADMIN
// ============================================

// Empleado sube un documento al admin
router.post('/employee-to-admin', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const { title, description, documentType, priority } = req.body;
    const senderId = req.employee.id;

    // Validar campos requeridos
    if (!title || !documentType) {
      // Eliminar archivo si falla la validación
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Título y tipo de documento son requeridos' });
    }

    // Crear documento en la base de datos
    const document = await Document.create({
      title,
      description: description || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType,
      direction: 'employee_to_admin',
      senderId,
      recipientId: null, // null = para cualquier admin
      status: 'pending',
      priority: priority || 'normal'
    });

    // Cargar información del remitente
    const documentWithSender = await Document.findByPk(document.id, {
      include: [
        { model: Employee, as: 'sender', attributes: ['id', 'name', 'email', 'employeeCode'] }
      ]
    });

    res.status(201).json({
      message: 'Documento subido correctamente',
      document: documentWithSender
    });
  } catch (error) {
    console.error('Error uploading employee document:', error);
    // Intentar eliminar el archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after error:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Error al subir el documento' });
  }
});

// Empleado obtiene sus documentos enviados
router.get('/employee-to-admin/my-documents', authMiddleware, async (req, res) => {
  try {
    const senderId = req.employee.id;
    const { status } = req.query;

    const where = {
      senderId,
      direction: 'employee_to_admin'
    };

    if (status) {
      where.status = status;
    }

    const documents = await Document.findAll({
      where,
      include: [
        { model: Employee, as: 'reviewer', attributes: ['id', 'name', 'employeeCode'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// ============================================
// RUTAS PARA ADMIN → EMPLEADOS
// ============================================

// Admin sube un documento para empleado(s)
router.post('/admin-to-employee', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (req.employee.role !== 'admin') {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(403).json({ error: 'Solo administradores pueden enviar documentos' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const { title, description, documentType, recipientId, priority, expiresAt } = req.body;
    const senderId = req.employee.id;

    if (!title || !documentType) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Título y tipo de documento son requeridos' });
    }

    // Crear documento
    const document = await Document.create({
      title,
      description: description || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType,
      direction: 'admin_to_employee',
      senderId,
      recipientId: recipientId || null, // null = para todos
      status: 'approved', // Los documentos del admin están pre-aprobados
      priority: priority || 'normal',
      expiresAt: expiresAt || null
    });

    const documentWithRelations = await Document.findByPk(document.id, {
      include: [
        { model: Employee, as: 'sender', attributes: ['id', 'name', 'employeeCode'] },
        { model: Employee, as: 'recipient', attributes: ['id', 'name', 'employeeCode'] }
      ]
    });

    res.status(201).json({
      message: 'Documento enviado correctamente',
      document: documentWithRelations
    });
  } catch (error) {
    console.error('Error uploading admin document:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Error al enviar el documento' });
  }
});

// Empleado obtiene documentos que le enviaron
router.get('/admin-to-employee/my-documents', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.employee.id;

    const documents = await Document.findAll({
      where: {
        direction: 'admin_to_employee',
        [Op.or]: [
          { recipientId: employeeId },
          { recipientId: null } // Documentos para todos
        ]
      },
      include: [
        { model: Employee, as: 'sender', attributes: ['id', 'name', 'employeeCode'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching employee received documents:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// ============================================
// RUTAS PARA ADMIN (GESTIÓN)
// ============================================

// Admin obtiene todos los documentos con filtros avanzados
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores' });
    }

    const { employeeId, documentType, month, year, direction, search } = req.query;
    
    const where = {};
    
    // Filtro por dirección
    if (direction) {
      where.direction = direction;
    }
    
    // Filtro por tipo de documento
    if (documentType) {
      where.documentType = documentType;
    }
    
    // Filtro por empleado (sender o recipient según dirección)
    if (employeeId) {
      if (direction === 'employee_to_admin') {
        where.senderId = employeeId;
      } else if (direction === 'admin_to_employee') {
        // Si se especifica un empleado, mostrar documentos para ese empleado o generales
        where[Op.or] = [
          { recipientId: employeeId },
          { recipientId: null } // Documentos para todos
        ];
      }
    }
    // Si NO se especifica employeeId, el admin ve TODOS los documentos (no aplicar filtro)
    
    // Filtro por mes y año
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // Búsqueda por texto en título o descripción
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const documents = await Document.findAll({
      where,
      include: [
        { model: Employee, as: 'sender', attributes: ['id', 'name', 'email', 'employeeCode'] },
        { model: Employee, as: 'recipient', attributes: ['id', 'name', 'email', 'employeeCode'], required: false },
        { model: Employee, as: 'reviewer', attributes: ['id', 'name', 'employeeCode'], required: false }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching all documents:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// Admin obtiene todos los documentos pendientes de empleados
router.get('/pending-from-employees', authMiddleware, async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores' });
    }

    const documents = await Document.findAll({
      where: {
        direction: 'employee_to_admin',
        status: 'pending'
      },
      include: [
        { 
          model: Employee, 
          as: 'sender', 
          attributes: ['id', 'name', 'email', 'employeeCode'],
          required: false
        }
      ],
      order: [
        ['created_at', 'DESC']
      ]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener documentos pendientes', details: error.message });
  }
});

// Admin revisa un documento (aprobar/rechazar)
router.patch('/:id/review', authMiddleware, async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden revisar documentos' });
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected', 'reviewed'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    document.status = status;
    document.reviewNotes = reviewNotes || null;
    document.reviewedAt = new Date();
    document.reviewedBy = req.employee.id;
    await document.save();

    const updatedDocument = await Document.findByPk(id, {
      include: [
        { model: Employee, as: 'sender', attributes: ['id', 'name', 'employeeCode'] },
        { model: Employee, as: 'reviewer', attributes: ['id', 'name', 'employeeCode'] }
      ]
    });

    res.json({
      message: 'Documento revisado correctamente',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error reviewing document:', error);
    res.status(500).json({ error: 'Error al revisar documento' });
  }
});

// Marcar documento como leído
router.patch('/:id/mark-read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.employee.id;

    const document = await Document.findOne({
      where: {
        id,
        direction: 'admin_to_employee',
        [Op.or]: [
          { recipientId: employeeId },
          { recipientId: null }
        ]
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    if (!document.readAt) {
      document.readAt = new Date();
      await document.save();
    }

    res.json({ message: 'Documento marcado como leído' });
  } catch (error) {
    console.error('Error marking document as read:', error);
    res.status(500).json({ error: 'Error al marcar documento' });
  }
});

// Descargar documento
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.employee.id;
    const userRole = req.employee.role;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Verificar permisos
    const canAccess = 
      userRole === 'admin' ||
      document.senderId === userId ||
      document.recipientId === userId ||
      (document.direction === 'admin_to_employee' && document.recipientId === null);

    if (!canAccess) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este documento' });
    }

    // Verificar que el archivo existe
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Error al descargar documento' });
  }
});

// Eliminar documento
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.employee.id;
    const userRole = req.employee.role;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Solo el remitente o un admin pueden eliminar
    if (userRole !== 'admin' && document.senderId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este documento' });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    // Eliminar registro de BD
    await document.destroy();

    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

export default router;
