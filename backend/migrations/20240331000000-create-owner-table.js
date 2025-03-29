'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Owners', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      documentId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Número de documento de identidad'
      },
      documentType: {
        type: Sequelize.ENUM('dni', 'passport', 'foreign_id'),
        allowNull: false,
        defaultValue: 'dni'
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false
      },
      emergencyContact: {
        type: Sequelize.STRING,
        allowNull: true
      },
      residentType: {
        type: Sequelize.ENUM('resident', 'non_resident'),
        allowNull: false,
        defaultValue: 'resident'
      },
      occupationStatus: {
        type: Sequelize.ENUM('owner', 'tenant', 'both'),
        allowNull: false,
        defaultValue: 'owner'
      },
      condominiumId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Condominiums',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      additionalInfo: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Índices para optimizar búsquedas
    await queryInterface.addIndex('Owners', ['userId'], {
      name: 'owners_user_id_idx',
      unique: true
    });

    await queryInterface.addIndex('Owners', ['condominiumId'], {
      name: 'owners_condominium_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Owners');
  }
}; 