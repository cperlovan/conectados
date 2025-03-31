const sequelize = require('./backend/config/database');
const Receipt = require('./backend/models/Receipt');

async function syncDatabase() {
  try {
    // Only alter the Receipts table to add the missing columns
    await Receipt.sync({ alter: true });
    console.log('Database synced successfully!');
  } catch (err) {
    console.error('Error syncing database:', err);
  } finally {
    process.exit();
  }
}

syncDatabase(); 