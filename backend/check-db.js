require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: process.env.DB_PORT || 5432,
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  }
});

async function checkDatabase() {
  try {
    // Verificar la conexión
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente');

    // Verificar la estructura de la tabla Suppliers
    const [suppliers] = await sequelize.query('SELECT * FROM "Suppliers" WHERE id = 11');
    console.log('Proveedor con ID 11:', suppliers);

    // Verificar la estructura de la tabla Budgets
    const [budgetConstraints] = await sequelize.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'Budgets';
    `);
    console.log('Restricciones de llave foránea en la tabla Budgets:', budgetConstraints);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase(); 