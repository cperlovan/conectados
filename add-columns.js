const sequelize = require('./backend/config/database');

async function addColumns() {
  try {
    await sequelize.query('ALTER TABLE "Receipts" ADD COLUMN IF NOT EXISTS "month" INTEGER');
    await sequelize.query('ALTER TABLE "Receipts" ADD COLUMN IF NOT EXISTS "year" INTEGER');
    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    process.exit();
  }
}

addColumns(); 