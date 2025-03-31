const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config/database');
const Umzug = require('umzug');

// Crear la instancia de Sequelize
const sequelize = config;

// Configurar Umzug para manejar las migraciones
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, './migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

// Ejecutar las migraciones pendientes
(async () => {
  try {
    await umzug.up();
    console.log('Todas las migraciones han sido ejecutadas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al ejecutar las migraciones:', error);
    process.exit(1);
  }
})(); 