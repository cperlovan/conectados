'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SupplierEconomicActivity', {
      supplierId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Suppliers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      economicActivityId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'EconomicActivities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Agregar índice compuesto para evitar duplicados
    await queryInterface.addIndex('SupplierEconomicActivity', ['supplierId', 'economicActivityId'], {
      unique: true,
      name: 'unique_supplier_economic_activity',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SupplierEconomicActivity');
  },
};
