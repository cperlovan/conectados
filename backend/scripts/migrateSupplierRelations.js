const { Supplier, SupplierCondominiums } = require('../models/Supplier');
const sequelize = require('../config/database');

async function migrateSupplierRelations() {
  try {
    // Establecer conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente');

    // Obtener todos los proveedores existentes
    const suppliers = await Supplier.findAll();
    console.log(`Se encontraron ${suppliers.length} proveedores para migrar`);

    // Migrar cada proveedor
    for (const supplier of suppliers) {
      const { id, condominiumId } = supplier;
      
      if (!condominiumId) {
        console.log(`El proveedor ID ${id} no tiene condominiumId, se omite`);
        continue;
      }

      console.log(`Procesando proveedor ID ${id} con condominio ID ${condominiumId}`);

      try {
        // Verificar si ya existe la relación usando una consulta directa
        const [existingRelations] = await sequelize.query(
          `SELECT * FROM "SupplierCondominiums" WHERE "supplierId" = ${id} AND "condominiumId" = ${condominiumId}`
        );

        if (existingRelations.length > 0) {
          console.log(`La relación para el proveedor ID ${id} con condominio ID ${condominiumId} ya existe`);
        } else {
          // Crear la relación many-to-many usando una consulta directa
          await sequelize.query(
            `INSERT INTO "SupplierCondominiums" ("supplierId", "condominiumId", "createdAt", "updatedAt") 
             VALUES (${id}, ${condominiumId}, NOW(), NOW())`
          );
          console.log(`Relación creada para proveedor ID ${id} con condominio ID ${condominiumId}`);
        }
      } catch (err) {
        console.error(`Error procesando proveedor ${id}:`, err);
      }
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

migrateSupplierRelations(); 