const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definir el modelo User
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  movil: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'copropietario', 'ocupante', 'proveedor', 'superadmin'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'pending',
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Condominiums',
      key: 'id'
    },
    validate: {
      customValidator(value) {
        if (this.role !== 'superadmin' && !value) {
          throw new Error('condominiumId es requerido para roles no superadmin');
        }
      }
    }
  },
  credit_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0, // Crédito acumulado por pagos en exceso
  },
  authorized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email', 'condominiumId'],
    },
  ],
});

module.exports = User;