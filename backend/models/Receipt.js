const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'anuled'),
    defaultValue: 'pending',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  pending_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0, // Inicialmente igual al monto total del recibo
  },
  credit_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0, // Crédito acumulado por pagos en exceso
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Por defecto los recibos no son visibles
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
    allowNull: true, // Puede ser null en algunos casos
    references: {
      model: 'Properties',
      key: 'id',
    },
    onDelete: 'SET NULL', // Si se elimina la propiedad, se mantiene el recibo pero sin propiedad
    onUpdate: 'CASCADE', // Si se actualiza el ID de la propiedad, actualizar la referencia
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