import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

export const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'employee_code'
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'pin_hash'
  },
  role: {
    type: DataTypes.ENUM('admin', 'employee'),
    defaultValue: 'employee',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  totpSecret: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'totp_secret'
  },
  qrCodeUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_url'
  },
  // Campos para Google OAuth (solo admin)
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'google_id'
  },
  profilePhoto: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'profile_photo'
  },
  authMethod: {
    type: DataTypes.ENUM('pin', 'totp', 'google'),
    defaultValue: 'pin',
    allowNull: false,
    field: 'auth_method'
  }
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (employee) => {
      if (employee.pin) {
        employee.pin = await bcrypt.hash(employee.pin, 12);
      }
    },
    beforeUpdate: async (employee) => {
      if (employee.changed('pin') && employee.pin) {
        employee.pin = await bcrypt.hash(employee.pin, 12);
      }
    }
  }
});

// Instance methods
Employee.prototype.validatePin = async function(pin) {
  if (!this.pin) return false;
  return await bcrypt.compare(pin, this.pin);
};

Employee.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.pin;
  delete values.totpSecret;
  return values;
};
