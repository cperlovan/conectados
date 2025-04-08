const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BudgetRequestEconomicActivity = sequelize.define(
  'BudgetRequestEconomicActivity',
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
    tableName: 'BudgetRequestEconomicActivities',
    timestamps: true,
  }
);

module.exports = BudgetRequestEconomicActivity; 