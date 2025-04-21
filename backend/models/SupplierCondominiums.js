const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierCondominiums = sequelize.define('SupplierCondominiums', {
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Suppliers',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Condominiums',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  tableName: 'SupplierCondominiums',
  timestamps: true
});

module.exports = SupplierCondominiums; 