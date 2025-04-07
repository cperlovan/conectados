const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'anuled', 'partial'),
    defaultValue: 'pending',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  pending_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
  },
  credit_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
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
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Properties',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1, 
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Receipt;