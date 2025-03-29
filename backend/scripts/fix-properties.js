'use strict';

const sequelize = require('../config/database');
const { Property } = require('../relations');

async function fixProperties() {
  try {
    console.log('Buscando propiedades sin número...');
    
    // Buscar todas las propiedades que no tienen número
    const properties = await Property.findAll({
      where: {
        number: null
      }
    });
    
    console.log(`Se encontraron ${properties.length} propiedades sin número`);
    
    if (properties.length === 0) {
      console.log('No hay propiedades que necesiten ser actualizadas');
      return;
    }
    
    // Actualizar cada propiedad con un número basado en su ID
    for (const property of properties) {
      const propertyNumber = `PROP-${property.id}`;
      
      console.log(`Actualizando propiedad ID ${property.id} con número ${propertyNumber}`);
      
      await property.update({
        number: propertyNumber
      });
    }
    
    console.log('Todas las propiedades han sido actualizadas exitosamente');
  } catch (error) {
    console.error('Error al actualizar propiedades:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar la función
fixProperties(); 