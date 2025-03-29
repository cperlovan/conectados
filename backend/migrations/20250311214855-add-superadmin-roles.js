'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, obtener el tipo enum actual
    const query = `
      SELECT enum_range(NULL::enum_users_role)
    `;
    const [results] = await queryInterface.sequelize.query(query);
    
    // Si 'superadmin' no está en el enum, agregarlo
    if (!results[0].enum_range.includes('superadmin')) {
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'superadmin';
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No se puede eliminar un valor de enum en PostgreSQL
    // Se tendría que recrear el tipo completo sin el valor
  }
};
