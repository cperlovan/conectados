'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, eliminar la restricción NOT NULL
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "condominiumId" DROP NOT NULL;
    `);

    // Luego, actualizar la columna con las referencias
    await queryInterface.changeColumn('Users', 'condominiumId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Condominiums',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir los cambios
    await queryInterface.changeColumn('Users', 'condominiumId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Condominiums',
        key: 'id'
      }
    });
  }
}; 