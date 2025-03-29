'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Agregar la columna permitiendo NULL inicialmente
    await queryInterface.addColumn('Budgets', 'condominiumId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Condominiums',
        key: 'id'
      }
    });

    // 2. Actualizar los registros existentes con el condominiumId del proveedor
    await queryInterface.sequelize.query(`
      UPDATE "Budgets" b
      SET "condominiumId" = s."condominiumId"
      FROM "Suppliers" s
      WHERE b."supplierId" = s.id
    `);

    // 3. Hacer la columna NOT NULL
    await queryInterface.changeColumn('Budgets', 'condominiumId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Condominiums',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Budgets', 'condominiumId');
  }
}; 