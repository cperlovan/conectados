'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Receipts', 'propertyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Properties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Receipts', 'propertyId');
  }
}; 