const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BudgetRequestSupplier = sequelize.define(
  'BudgetRequestSupplier',
  {
    budgetRequestId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'BudgetRequests',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    supplierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Suppliers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'BudgetRequestSuppliers',
    timestamps: true,
  }
);

module.exports = BudgetRequestSupplier; 