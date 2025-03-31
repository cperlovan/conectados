const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReserveFundWithdrawal = sequelize.define('ReserveFundWithdrawal', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  approvedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documentReference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reserveFundId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ReserveFunds',
      key: 'id',
    },
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Condominiums',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'rejected', 'cancelled'),
    defaultValue: 'completed',
  },
});

module.exports = ReserveFundWithdrawal; 