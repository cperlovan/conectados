'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'credit_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'credit_amount');
  }
}; 