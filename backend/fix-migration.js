const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect
  }
);

async function fixMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully.');
    
    // Check if the migration exists in SequelizeMeta
    const [result] = await sequelize.query(
      "SELECT * FROM \"SequelizeMeta\" WHERE name = '20250409160822-create-supplier-condominiums-table.js'"
    );
    
    if (result.length === 0) {
      // Add the migration to SequelizeMeta
      await sequelize.query(
        "INSERT INTO \"SequelizeMeta\" (name) VALUES ('20250409160822-create-supplier-condominiums-table.js')"
      );
      console.log('Migration marked as completed successfully!');
    } else {
      console.log('Migration is already marked as completed.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

fixMigration(); 