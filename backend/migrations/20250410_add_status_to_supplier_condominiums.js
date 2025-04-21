'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SupplierCondominiums', 'status', {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    });
    
    console.log('Columna status añadida a la tabla SupplierCondominiums');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('SupplierCondominiums', 'status');
    
    console.log('Columna status eliminada de la tabla SupplierCondominiums');
  }
}; 