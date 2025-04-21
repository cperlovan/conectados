'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Para PostgreSQL, necesitamos modificar el tipo ENUM
    // Primero creamos un nuevo tipo ENUM con los valores deseados
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'proveedor';
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'supplier';
    `);
    
    console.log('Valores proveedor y supplier añadidos al ENUM role en la tabla Users');
  },

  async down(queryInterface, Sequelize) {
    console.log('No se puede eliminar valores de un ENUM en PostgreSQL - operación no reversible');
    // En PostgreSQL no es posible eliminar valores de un tipo ENUM directamente
    // Se tendría que crear un nuevo tipo ENUM y migrar los datos
  }
}; 