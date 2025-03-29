'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Owner extends Model {}

Owner.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Número de documento de identidad'
  },
  documentType: {
    type: DataTypes.ENUM('dni', 'passport', 'foreign_id'),
    allowNull: false,
    defaultValue: 'dni'
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emergencyContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  residentType: {
    type: DataTypes.ENUM('resident', 'non_resident'),
    allowNull: false,
    defaultValue: 'resident'
  },
  occupationStatus: {
    type: DataTypes.ENUM('owner', 'tenant', 'both'),
    allowNull: false,
    defaultValue: 'owner'
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Condominiums',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  additionalInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Owner',
  tableName: 'Owners',
  timestamps: true
});

module.exports = Owner; 