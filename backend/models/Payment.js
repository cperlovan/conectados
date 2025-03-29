const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('bank_transfer', 'credit_card', 'mobile_payment'),
    allowNull: false,
  },
  receiptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Receipts',
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
    type: DataTypes.ENUM('pending', 'verified', 'anuled'),
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  payment_details: {
    type: DataTypes.JSONB, // Campo JSONB para almacenar datos adicionales
    allowNull: true,       // Permitir valores nulos si no se proporcionan detalles
  },
});

module.exports = Payment;