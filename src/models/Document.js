import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type'
  },
  // Tipo de documento
  documentType: {
    type: DataTypes.ENUM(
      'baja_medica',        // Baja médica
      'justificante',       // Justificante general
      'certificado',        // Certificado
      'nomina',            // Nómina
      'contrato',          // Contrato
      'politica',          // Política de empresa
      'notificacion',      // Notificación oficial
      'otro'               // Otros
    ),
    allowNull: false,
    field: 'document_type'
  },
  // Dirección del documento
  direction: {
    type: DataTypes.ENUM('employee_to_admin', 'admin_to_employee'),
    allowNull: false
  },
  // Remitente (quien envía)
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  // Destinatario (quien recibe) - puede ser null si es para todos los empleados
  recipientId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'recipient_id',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  // Estado del documento
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  // Notas del revisor
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_notes'
  },
  // Fecha de revisión
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at'
  },
  // Quien revisó
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  // Fecha de lectura (para documentos admin->employee)
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  // Prioridad
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    allowNull: false
  },
  // Fecha de expiración (opcional)
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['sender_id']
    },
    {
      fields: ['recipient_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['direction']
    },
    {
      fields: ['document_type']
    },
    {
      fields: ['created_at']
    }
  ]
});
