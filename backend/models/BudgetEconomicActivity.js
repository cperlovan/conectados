const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BudgetEconomicActivity = sequelize.define(
  'BudgetEconomicActivity',
  {
    budgetId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Budgets',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    economicActivityId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'EconomicActivities',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'BudgetEconomicActivities',
    timestamps: true,
  }
);

module.exports = BudgetEconomicActivity; 