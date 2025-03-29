'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero agregar la columna permitiendo valores nulos
    await queryInterface.addColumn('Budgets', 'supplierId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });

    // Aquí puedes agregar lógica para actualizar los registros existentes si es necesario
    // Por ejemplo, si tienes una forma de determinar el supplierId para registros existentes
    
    // Después de actualizar los registros, hacer la columna NOT NULL
    await queryInterface.changeColumn('Budgets', 'supplierId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Budgets', 'supplierId');
  }
}; 