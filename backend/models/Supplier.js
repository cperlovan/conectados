const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const SupplierCondominiums = require("./SupplierCondominiums");

const Supplier = sequelize.define("Supplier", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("individual", "company"),
    allowNull: false,
  },
  contactInfo: {
    type: DataTypes.JSONB, // Almacena datos como teléfono, correo, dirección, etc.
    allowNull: true,
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Condominiums",
      key: "id",
    },
  },
});

// Tabla intermedia para la relación muchos a muchos entre Supplier y EconomicActivity
const SupplierEconomicActivity = sequelize.define('SupplierEconomicActivity', {
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
});

module.exports = {
  Supplier,
  SupplierCondominiums,
  SupplierEconomicActivity
};