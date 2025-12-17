import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PushToken = sequelize.define('PushToken', {
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
  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false,
    defaultValue: 'android',
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'device_info',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at',
  },
}, {
  tableName: 'push_tokens',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'token'],
    },
    {
      fields: ['employee_id'],
    },
    {
      fields: ['is_active'],
    },
  ],
});

export default PushToken;
