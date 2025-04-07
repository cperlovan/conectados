const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definir el modelo Condominium
const Condominium = sequelize.define('Condominium', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rif: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rules: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  }
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