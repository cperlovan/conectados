// Script para arreglar las relaciones entre proveedores y condominios
const { Supplier, SupplierCondominiums } = require('../models/Supplier');
const Condominium = require('../models/Condominium');
const sequelize = require('../config/database');

async function fixSupplierCondominiums() {
  try {
    console.log('Iniciando proceso de reparación de relaciones proveedor-condominio...');
    
    // Obtener todos los proveedores
    const suppliers = await Supplier.findAll({
      attributes: ['id', 'userId', 'name', 'condominiumId'],
    });
    
    console.log(`Se encontraron ${suppliers.length} proveedores para procesar.`);
    
    // Para cada proveedor, verificar si tiene la relación en SupplierCondominiums
    for (const supplier of suppliers) {
      // Verificar si ya existe la relación
      const existingRelation = await SupplierCondominiums.findOne({
        where: {
          supplierId: supplier.id,
          condominiumId: supplier.condominiumId
        }
      });
      
      if (!existingRelation) {
        console.log(`Creando relación para proveedor ID: ${supplier.id}, con condominio ID: ${supplier.condominiumId}`);
        
        // Crear la relación
        await SupplierCondominiums.create({
          supplierId: supplier.id,
          condominiumId: supplier.condominiumId,
          status: 'active'
        });
        
        console.log(`Relación creada exitosamente.`);
      } else {
        console.log(`La relación ya existe para proveedor ID: ${supplier.id}, con condominio ID: ${supplier.condominiumId}`);
      }
    }
    
    console.log('Proceso completado exitosamente.');
  } catch (error) {
    console.error('Error al reparar relaciones:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar la función
fixSupplierCondominiums(); 