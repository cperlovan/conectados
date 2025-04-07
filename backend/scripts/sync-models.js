const sequelize = require('../config/database');
const Condominium = require('../models/Condominium');

async function syncModels() {
  try {
    // Sincronizar solo el modelo Condominium
    await Condominium.sync({ alter: true });
    console.log('✅ Modelo Condominium sincronizado exitosamente');
  } catch (error) {
    console.error('❌ Error al sincronizar el modelo:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

syncModels(); 