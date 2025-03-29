'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Actualizar tabla Users
    const userColumns = await queryInterface.describeTable('Users');
    
    if (!userColumns.status) {
      await queryInterface.addColumn('Users', 'status', {
        type: Sequelize.ENUM('active', 'inactive', 'pending'),
        defaultValue: 'pending',
        allowNull: false
      });
    }

    if (!userColumns.lastLogin) {
      await queryInterface.addColumn('Users', 'lastLogin', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'copropietario', 'super_admin', 'administracion', 'proveedor', 'ocupantes'),
      defaultValue: 'copropietario'
    });

    // Actualizar tabla Condominiums
    const condominiumColumns = await queryInterface.describeTable('Condominiums');
    
    if (!condominiumColumns.status) {
      await queryInterface.addColumn('Condominiums', 'status', {
        type: Sequelize.ENUM('active', 'inactive', 'pending'),
        defaultValue: 'pending',
        allowNull: false
      });
    }

    if (!condominiumColumns.currency) {
      await queryInterface.addColumn('Condominiums', 'currency', {
        type: Sequelize.STRING,
        defaultValue: 'USD',
        allowNull: false
      });
    }

    if (!condominiumColumns.timezone) {
      await queryInterface.addColumn('Condominiums', 'timezone', {
        type: Sequelize.STRING,
        defaultValue: 'UTC',
        allowNull: false
      });
    }

    if (!condominiumColumns.description) {
      await queryInterface.addColumn('Condominiums', 'description', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!condominiumColumns.rules) {
      await queryInterface.addColumn('Condominiums', 'rules', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    if (!condominiumColumns.settings) {
      await queryInterface.addColumn('Condominiums', 'settings', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    // Eliminar columna numberProperties si existe
    if (condominiumColumns.numberProperties) {
      await queryInterface.removeColumn('Condominiums', 'numberProperties');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir cambios en Users
    const userColumns = await queryInterface.describeTable('Users');
    
    if (userColumns.status) {
      await queryInterface.removeColumn('Users', 'status');
    }
    
    if (userColumns.lastLogin) {
      await queryInterface.removeColumn('Users', 'lastLogin');
    }
    
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'copropietario'),
      defaultValue: 'copropietario'
    });

    // Revertir cambios en Condominiums
    const condominiumColumns = await queryInterface.describeTable('Condominiums');
    
    if (condominiumColumns.status) {
      await queryInterface.removeColumn('Condominiums', 'status');
    }
    
    if (condominiumColumns.currency) {
      await queryInterface.removeColumn('Condominiums', 'currency');
    }
    
    if (condominiumColumns.timezone) {
      await queryInterface.removeColumn('Condominiums', 'timezone');
    }
    
    if (condominiumColumns.description) {
      await queryInterface.removeColumn('Condominiums', 'description');
    }
    
    if (condominiumColumns.rules) {
      await queryInterface.removeColumn('Condominiums', 'rules');
    }
    
    if (condominiumColumns.settings) {
      await queryInterface.removeColumn('Condominiums', 'settings');
    }

    // Restaurar columna numberProperties si no existe
    if (!condominiumColumns.numberProperties) {
      await queryInterface.addColumn('Condominiums', 'numberProperties', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
  }
};
