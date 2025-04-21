'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if SupplierCondominia table exists
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT to_regclass('public."SupplierCondominia"')`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      const tableExistsResult = tableExists[0].to_regclass;
      
      if (tableExistsResult) {
        console.log('SupplierCondominia table exists, dropping it...');
        await queryInterface.dropTable('SupplierCondominia');
        console.log('SupplierCondominia table dropped successfully.');
      } else {
        console.log('SupplierCondominia table does not exist, no need to drop.');
      }
      
      // Make sure all suppliers have appropriate entries in SupplierCondominiums
      const suppliers = await queryInterface.sequelize.query(
        `SELECT id, "condominiumId" FROM "Suppliers" WHERE "condominiumId" IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log(`Found ${suppliers.length} suppliers with condominiumId.`);
      
      for (const supplier of suppliers) {
        // Check if there's already an entry in SupplierCondominiums
        const existingRelation = await queryInterface.sequelize.query(
          `SELECT * FROM "SupplierCondominiums" WHERE "supplierId" = ${supplier.id} AND "condominiumId" = ${supplier.condominiumId}`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        
        if (existingRelation.length === 0) {
          console.log(`Creating relationship for supplierId=${supplier.id}, condominiumId=${supplier.condominiumId}`);
          await queryInterface.sequelize.query(
            `INSERT INTO "SupplierCondominiums" ("supplierId", "condominiumId", "createdAt", "updatedAt") 
             VALUES (${supplier.id}, ${supplier.condominiumId}, NOW(), NOW())`,
            { type: Sequelize.QueryTypes.INSERT }
          );
        } else {
          console.log(`Relationship already exists for supplierId=${supplier.id}, condominiumId=${supplier.condominiumId}`);
        }
      }
    } catch (error) {
      console.error('Error in migration:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration just cleans up data, no specific rollback needed
    console.log('No rollback needed for this migration');
  }
};
