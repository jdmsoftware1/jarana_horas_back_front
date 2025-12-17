import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  type: {
    type: DataTypes.ENUM(
      'check_in_reminder',      // Recordatorio de fichaje
      'schedule_assigned',      // Nuevo horario asignado
      'document_pending',       // Documento pendiente de revisar
      'absence_status',         // Estado de ausencia (aprobada/rechazada)
      'shift_ending',           // Turno terminando pronto
      'weekly_summary',         // Resumen semanal
      'general'                 // Notificación general
    ),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos adicionales para la notificación (ej: scheduleId, documentId)',
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
    defaultValue: 'pending',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['employee_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

export default Notification;
