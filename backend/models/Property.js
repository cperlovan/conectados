'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Property extends Model {}

Property.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Número o identificador de la propiedad'
  },
  type: {
    type: DataTypes.ENUM('apartment', 'house', 'commercial', 'parking', 'storage'),
    allowNull: false,
    defaultValue: 'apartment'
  },
  size: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Tamaño en metros cuadrados'
  },
  aliquot: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Porcentaje de alícuota para el cálculo de gastos'
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Piso en el que se encuentra la propiedad'
  },
  block: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Bloque o torre en la que se encuentra la propiedad'
  },
  status: {
    type: DataTypes.ENUM('occupied', 'vacant', 'under_maintenance', 'active'),
    allowNull: false,
    defaultValue: 'occupied'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Owners',
      key: 'id'
    }
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Condominiums',
      key: 'id'
    }
  },
  additionalInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Información adicional como características, observaciones, etc.'
  }
}, {
  sequelize,
  modelName: 'Property',
  tableName: 'Properties',
  timestamps: true
});

module.exports = Property;