'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('SupplierCondominiums', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      supplierId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Suppliers',
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('SupplierCondominiums', ['supplierId']);
    await queryInterface.addIndex('SupplierCondominiums', ['condominiumId']);
    await queryInterface.addIndex('SupplierCondominiums', ['supplierId', 'condominiumId'], {
      unique: true,
      name: 'supplier_condominium_unique'
    });

    // Add data from the existing suppliers to create the many-to-many relationships
    const suppliers = await queryInterface.sequelize.query(
      'SELECT id, "condominiumId" FROM "Suppliers"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length > 0) {
      const supplierCondominiums = suppliers.map(supplier => ({
        supplierId: supplier.id,
        condominiumId: supplier.condominiumId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('SupplierCondominiums', supplierCondominiums);
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('SupplierCondominiums');
  }
};
