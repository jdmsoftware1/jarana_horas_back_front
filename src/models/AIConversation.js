import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const AIConversation = sequelize.define('AIConversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Título generado automáticamente del primer mensaje'
  },
  messages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de mensajes [{role: "user"|"assistant", content: string, timestamp: date}]'
  },
  userRole: {
    type: DataTypes.ENUM('admin', 'employee'),
    allowNull: false,
    defaultValue: 'employee',
    field: 'user_role'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_message_at'
  }
}, {
  tableName: 'ai_conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['employee_id']
    },
    {
      fields: ['last_message_at']
    },
    {
      fields: ['user_role']
    }
  ]
});
