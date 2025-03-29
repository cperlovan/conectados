const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierEconomicActivity = sequelize.define(
  'SupplierEconomicActivity',
  {
    supplierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Suppliers', // Nombre del modelo Supplier
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    economicActivityId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'EconomicActivities', // Nombre del modelo EconomicActivity
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'SupplierEconomicActivity', // Nombre de la tabla en la base de datos
    timestamps: true, // Habilita createdAt y updatedAt
  }
);

module.exports = SupplierEconomicActivity;