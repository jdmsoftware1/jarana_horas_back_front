import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const AbsenceCategory = sequelize.define('AbsenceCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Código único para identificar la categoría (ej: PATERNITY_LEAVE, REST_48H)'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#3B82F6',
    comment: 'Color hexadecimal para mostrar en el calendario'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '📅',
    comment: 'Emoji o icono para representar la categoría'
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'requires_approval',
    comment: 'Si requiere aprobación del administrador'
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
    field: 'is_paid',
    comment: 'Si es pagado (null = depende del caso)'
  },
  maxDaysPerYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_days_per_year',
    comment: 'Máximo de días permitidos por año (null = sin límite)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Si la categoría está activa y disponible para usar'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
    comment: 'Orden de visualización'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system',
    comment: 'Si es una categoría del sistema (no se puede eliminar)'
  }
}, {
  tableName: 'absence_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    }
  ]
});

// Static method to get default categories
AbsenceCategory.getDefaultCategories = function() {
  return [
    {
      name: 'Vacaciones',
      code: 'VACATION',
      description: 'Días de vacaciones anuales',
      color: '#10B981',
      icon: '🏖️',
      requiresApproval: true,
      isPaid: true,
      isSystem: true,
      sortOrder: 1
    },
    {
      name: 'Baja médica',
      code: 'SICK_LEAVE',
      description: 'Ausencia por enfermedad',
      color: '#EF4444',
      icon: '🏥',
      requiresApproval: false,
      isPaid: true,
      isSystem: true,
      sortOrder: 2
    },
    {
      name: 'Asunto personal',
      code: 'PERSONAL',
      description: 'Asuntos personales',
      color: '#F59E0B',
      icon: '👤',
      requiresApproval: true,
      isPaid: false,
      isSystem: true,
      sortOrder: 3
    },
    {
      name: 'Baja maternal',
      code: 'MATERNITY',
      description: 'Permiso de maternidad',
      color: '#EC4899',
      icon: '👶',
      requiresApproval: false,
      isPaid: true,
      isSystem: true,
      sortOrder: 4
    },
    {
      name: 'Baja paternal',
      code: 'PATERNITY',
      description: 'Permiso de paternidad',
      color: '#8B5CF6',
      icon: '👨‍👶',
      requiresApproval: false,
      isPaid: true,
      isSystem: true,
      sortOrder: 5
    },
    {
      name: 'Reposo 48h',
      code: 'REST_48H',
      description: 'Reposo médico de 48 horas',
      color: '#F97316',
      icon: '🛏️',
      requiresApproval: false,
      isPaid: true,
      isSystem: false,
      sortOrder: 6
    },
    {
      name: 'Día libre empresa',
      code: 'COMPANY_DAY_OFF',
      description: 'Día libre concedido por la empresa',
      color: '#06B6D4',
      icon: '🎁',
      requiresApproval: false,
      isPaid: true,
      isSystem: false,
      sortOrder: 7
    },
    {
      name: 'Otro',
      code: 'OTHER',
      description: 'Otros tipos de ausencia',
      color: '#6B7280',
      icon: '📋',
      requiresApproval: true,
      isPaid: null,
      isSystem: true,
      sortOrder: 99
    }
  ];
};
