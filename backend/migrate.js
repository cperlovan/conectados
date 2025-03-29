'use strict';

const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('./config/database');

const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, sequelize.constructor),
        down: async () => migration.down(context, sequelize.constructor),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Función específica para ejecutar la migración de propiedad
const updatePropertyTable = async () => {
  try {
    console.log('Ejecutando migración específica para actualizar la tabla Property...');
    const migration = require('./migrations/20240401000000-update-property-table.js');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('Migración completada correctamente.');
  } catch (error) {
    console.error('Error al ejecutar la migración de Property:', error);
    throw error;
  }
};

// Función específica para ejecutar la migración de aliquot en Properties
const updatePropertyAliquot = async () => {
  try {
    console.log('Ejecutando migración específica para actualizar la columna aliquot en Property...');
    const migration = require('./migrations/20240402000000-update-property-aliquot.js');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('Migración de aliquot completada correctamente.');
  } catch (error) {
    console.error('Error al ejecutar la migración de aliquot en Property:', error);
    throw error;
  }
};

// Función específica para corregir referencias en la tabla Properties
const fixPropertyReferences = async () => {
  try {
    console.log('Ejecutando migración específica para corregir referencias en Properties...');
    const migration = require('./migrations/20240403000000-fix-property-references.js');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('Migración de corrección de referencias en Properties completada correctamente.');
  } catch (error) {
    console.error('Error al ejecutar la migración de corrección de referencias en Properties:', error);
    throw error;
  }
};

// Display migration status
const status = async () => {
  console.log('Migration status:');
  
  const executed = await umzug.executed();
  const pending = await umzug.pending();
  
  console.log('Executed migrations:', executed.map(m => m.name));
  console.log('Pending migrations:', pending.map(m => m.name));
};

// Execute all pending migrations
const migrate = async () => {
  await umzug.up();
  console.log('All migrations executed successfully');
};

// Execute a specific migration
const migrateOne = async (migrationName) => {
  await umzug.up({ to: migrationName });
  console.log(`Migration ${migrationName} executed successfully`);
};

// Revert the last executed migration
const revert = async () => {
  await umzug.down();
  console.log('Last migration reverted successfully');
};

// Revert all migrations
const revertAll = async () => {
  await umzug.down({ to: 0 });
  console.log('All migrations reverted successfully');
};

const printUsage = () => {
  console.log(`
    Usage: node migrate.js [command]
    
    Commands:
      status                  - Show migration status
      up, migrate             - Run all pending migrations
      migrate [name]          - Run migrations up to and including [name]
      down, revert            - Revert the last executed migration
      revert-all              - Revert all migrations
      update-property-table   - Update the Property table specifically
      update-property-aliquot - Update the aliquot column in the Property table
      fix-property-references - Fix property references in the Properties table
  `);
};

const main = async () => {
  const cmd = process.argv[2] || '';
  const migrationName = process.argv[3];
  
  try {
    switch (cmd.toLowerCase()) {
      case 'status':
        await status();
        break;
      case 'up':
      case 'migrate':
        if (migrationName) {
          await migrateOne(migrationName);
        } else {
          await migrate();
        }
        break;
      case 'down':
      case 'revert':
        await revert();
        break;
      case 'revert-all':
        await revertAll();
        break;
      case 'update-property-table':
        await updatePropertyTable();
        break;
      case 'update-property-aliquot':
        await updatePropertyAliquot();
        break;
      case 'fix-property-references':
        await fixPropertyReferences();
        break;
      default:
        printUsage();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error executing migrations:', err);
    process.exit(1);
  }
};

// Run the main function
main(); 