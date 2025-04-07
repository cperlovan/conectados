'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, crear un nuevo tipo enum con todos los valores
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Receipts_status" ADD VALUE IF NOT EXISTS 'partial';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No podemos eliminar valores de un enum en PostgreSQL
    // La mejor opción es no hacer nada en el rollback
  }
}; 