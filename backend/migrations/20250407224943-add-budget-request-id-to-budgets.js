'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Budgets', 'budgetRequestId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'BudgetRequests',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Budgets', 'budgetRequestId');
  }
};
