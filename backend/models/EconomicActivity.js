const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EconomicActivity = sequelize.define('EconomicActivity', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT, // Texto largo para descripciones detalladas
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active', // Por defecto, las actividades son activas
  },
});

module.exports = EconomicActivity;