'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, actualizar los registros existentes que tengan 'approved' o 'rejected' a 'verified'
    await queryInterface.sequelize.query(`
      UPDATE "Payments"
      SET status = 'verified'
      WHERE status IN ('approved', 'rejected')
    `);

    // Luego, actualizar el enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Payments_status" ADD VALUE IF NOT EXISTS 'approved';
      ALTER TYPE "enum_Payments_status" ADD VALUE IF NOT EXISTS 'rejected';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No podemos eliminar valores del enum, así que solo actualizamos los registros
    await queryInterface.sequelize.query(`
      UPDATE "Payments"
      SET status = 'verified'
      WHERE status IN ('approved', 'rejected')
    `);
  }
}; 