'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Properties', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Número o identificador de la propiedad'
      },
      type: {
        type: Sequelize.ENUM('apartment', 'house', 'commercial', 'parking', 'storage'),
        allowNull: false,
        defaultValue: 'apartment'
      },
      size: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Tamaño en metros cuadrados'
      },
      aliquot: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Porcentaje de alícuota para el cálculo de gastos'
      },
      floor: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Piso en el que se encuentra la propiedad'
      },
      block: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Bloque o torre en la que se encuentra la propiedad'
      },
      status: {
        type: Sequelize.ENUM('occupied', 'vacant', 'under_maintenance'),
        allowNull: false,
        defaultValue: 'occupied'
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Owners',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      additionalInfo: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Información adicional como características, observaciones, etc.'
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
    await queryInterface.addIndex('Properties', ['ownerId'], {
      name: 'properties_owner_id_idx'
    });

    await queryInterface.addIndex('Properties', ['condominiumId'], {
      name: 'properties_condominium_id_idx'
    });

    await queryInterface.addIndex('Properties', ['number', 'condominiumId'], {
      name: 'properties_number_condominium_unique_idx',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Properties');
  }
}; 