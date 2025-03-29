const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReserveFundContribution = sequelize.define('ReserveFundContribution', {
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
});

module.exports = ReserveFundContribution;