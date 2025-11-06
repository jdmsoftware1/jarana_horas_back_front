/**
 * Modelo de Log de Accesos
 * Registra todos los accesos al sistema para monitoreo y auditoría
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AccessLog = sequelize.define('AccessLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Usuario que accedió
  employeeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'employees',  // Nombre de tabla en minúscula
      key: 'id'
    }
  },
  
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email del usuario (para accesos con Google)'
  },
  
  // Tipo de acceso
  accessType: {
    type: DataTypes.ENUM(
      'login',
      'logout',
      'google_login',
      'pin_login',
      'totp_login',
      'failed_login',
      'token_refresh',
      'unauthorized_attempt'
    ),
    allowNull: false,
    defaultValue: 'login'
  },
  
  // Información de la petición
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Geolocalización (opcional)
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Información adicional
  device: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'web, mobile, kiosk, etc.'
  },
  
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Estado del acceso
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Metadata adicional
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  
  // Timestamps
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'access_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['employeeId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['accessType']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['ipAddress']
    },
    {
      fields: ['success']
    }
  ]
});

/**
 * Método estático para registrar un acceso
 */
AccessLog.logAccess = async function(data) {
  try {
    return await this.create({
      employeeId: data.employeeId || null,
      email: data.email || null,
      accessType: data.accessType || 'login',
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      device: data.device || 'web',
      browser: data.browser || null,
      os: data.os || null,
      success: data.success !== false,
      failureReason: data.failureReason || null,
      metadata: data.metadata || {},
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging access:', error);
    // No lanzar error para no interrumpir el flujo principal
    return null;
  }
};

/**
 * Método estático para obtener estadísticas de accesos
 */
AccessLog.getStats = async function(filters = {}) {
  const where = {};
  
  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  
  if (filters.startDate && filters.endDate) {
    where.timestamp = {
      [sequelize.Sequelize.Op.between]: [filters.startDate, filters.endDate]
    };
  }
  
  if (filters.accessType) {
    where.accessType = filters.accessType;
  }
  
  const [totalAccesses, successfulAccesses, failedAccesses] = await Promise.all([
    this.count({ where }),
    this.count({ where: { ...where, success: true } }),
    this.count({ where: { ...where, success: false } })
  ]);
  
  return {
    total: totalAccesses,
    successful: successfulAccesses,
    failed: failedAccesses,
    successRate: totalAccesses > 0 ? (successfulAccesses / totalAccesses * 100).toFixed(2) : 0
  };
};

/**
 * Método estático para detectar actividad sospechosa
 */
AccessLog.getSuspiciousActivity = async function(timeWindowMinutes = 15) {
  const timeAgo = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  // Buscar múltiples intentos fallidos desde la misma IP
  const suspiciousIPs = await this.findAll({
    attributes: [
      'ipAddress',
      [sequelize.fn('COUNT', sequelize.col('id')), 'attempts']
    ],
    where: {
      timestamp: {
        [sequelize.Sequelize.Op.gte]: timeAgo
      },
      success: false
    },
    group: ['ipAddress'],
    having: sequelize.literal('COUNT(id) >= 5'),
    raw: true
  });
  
  return suspiciousIPs;
};

export default AccessLog;
