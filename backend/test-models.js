const sequelize = require('./config/database');
const BudgetRequest = require('./models/BudgetRequest');
const Supplier = require('./models/Supplier');
const EconomicActivity = require('./models/EconomicActivity');
const User = require('./models/User');
const Condominium = require('./models/Condominium');
const { Supplier: SupplierModel, SupplierCondominium } = require('./models/Supplier');

// Load relationships
require('./relations');

async function testModels() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Check models
    console.log('Models defined in sequelize:');
    const models = Object.keys(sequelize.models);
    console.log(models);

    // Check BudgetRequest associations
    console.log('\nBudgetRequest associations:');
    console.log(Object.keys(BudgetRequest.associations));

    // Check model table names
    console.log('\nTable names:');
    console.log('BudgetRequest:', BudgetRequest.tableName);
    
    if (SupplierModel) {
      console.log('Supplier:', SupplierModel.tableName);
    }
    
    if (SupplierCondominium) {
      console.log('SupplierCondominium:', SupplierCondominium.tableName);
    }

    // Exit
    process.exit(0);
  } catch (error) {
    console.error('Error testing models:', error);
    process.exit(1);
  }
}

testModels(); 