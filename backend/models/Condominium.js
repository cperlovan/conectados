const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definir el modelo Condominium
const Condominium = sequelize.define('Condominium', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial'),
    allowNull: false,
  },
  rif: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'pending',
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    allowNull: false,
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rules: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'Condominiums',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['rif'],
    },
  ],
});

// Exportar el modelo
module.exports = Condominium;