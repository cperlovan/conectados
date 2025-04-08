'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the column already exists
    const tableInfo = await queryInterface.describeTable('Condominiums');
    if (!tableInfo.logo) {
      await queryInterface.addColumn('Condominiums', 'logo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Condominiums', 'logo');
  }
}; 