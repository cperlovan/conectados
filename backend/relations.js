const User = require('./models/User');
const Condominium = require('./models/Condominium');
const Property = require('./models/Property');
const Receipt = require('./models/Receipt');
const Payment = require('./models/Payment');
const Supplier = require('./models/Supplier');
const EconomicActivity = require('./models/EconomicActivity');
const BankAccount = require('./models/BankAccount');
const ReserveFund = require('./models/ReserveFund');
const Expense = require('./models/Expense');
const SupplierEconomicActivity = require('./models/SupplierEconomicActivity');
const ReserveFundContribution = require('./models/ReserveFundContribution');
const Budget = require('./models/Budget');
const Invoice = require('./models/Invoice');
const Owner = require('./models/Owner');

// Relaciones 
Condominium.hasMany(User, { foreignKey: 'condominiumId' });
User.belongsTo(Condominium, { foreignKey: 'condominiumId' });

User.hasMany(Receipt, { foreignKey: 'userId' });
Receipt.belongsTo(User, { foreignKey: 'userId' });

// Eliminar relación directa entre User y Property
// User.hasMany(Property, { foreignKey: 'userId' });
// Property.belongsTo(User, { foreignKey: 'userId' });

Condominium.hasMany(Receipt, { foreignKey: 'condominiumId' });
Receipt.belongsTo(Condominium, { foreignKey: 'condominiumId' });

Condominium.hasMany(Payment, { foreignKey: 'condominiumId' });
Payment.belongsTo(Condominium, { foreignKey: 'condominiumId' });

User.hasMany(Payment, { foreignKey: 'userId' }); 
Payment.belongsTo(User, { foreignKey: 'userId' });

Receipt.hasOne(Payment, { foreignKey: 'receiptId' });
Payment.belongsTo(Receipt, { foreignKey: 'receiptId' });



// Relaciones entre Condominium y BankAccount
Condominium.hasMany(BankAccount, { foreignKey: 'condominiumId' });
BankAccount.belongsTo(Condominium, { foreignKey: 'condominiumId' });

// Relaciones entre Condominium y ReserveFund
Condominium.hasMany(ReserveFund, { foreignKey: 'condominiumId' });
ReserveFund.belongsTo(Condominium, { foreignKey: 'condominiumId' });


// Relación entre Condominium y Expense
Condominium.hasMany(Expense, { foreignKey: 'condominiumId' });
Expense.belongsTo(Condominium, { foreignKey: 'condominiumId' });

// Relación entre Supplier y Expense
Supplier.hasMany(Expense, { foreignKey: 'supplierId' });
Expense.belongsTo(Supplier, { foreignKey: 'supplierId' });

// Relación entre Condominium y Property
Condominium.hasMany(Property, { foreignKey: 'condominiumId' });
Property.belongsTo(Condominium, { foreignKey: 'condominiumId' });


// Relación muchos a muchos entre Supplier y EconomicActivity
    Supplier.belongsToMany(EconomicActivity, {
    through: SupplierEconomicActivity, // Usa el modelo explícito
    foreignKey: 'supplierId', // Nombre explícito de la clave foránea
    otherKey: 'economicActivityId', // Clave foránea para EconomicActivity
  });
  
  EconomicActivity.belongsToMany(Supplier, {
    through: SupplierEconomicActivity, // Usa el modelo explícito
    foreignKey: 'economicActivityId', // Nombre explícito de la clave foránea
    otherKey: 'supplierId', // Clave foránea para Supplier
  });


// Relación entre User and Supplier
User.hasOne(Supplier, { foreignKey: 'userId' });
Supplier.belongsTo(User, { foreignKey: 'userId' }); 

// Relación entre ReserveFund and ReserveFundContribution
ReserveFund.hasMany(ReserveFundContribution, { foreignKey: 'reserveFundId' });
ReserveFundContribution.belongsTo(ReserveFund, { foreignKey: 'reserveFundId' });


// backend/relations.js
// ... existing code ...

// Relación entre Budget and Supplier
Budget.belongsTo(Supplier, { 
  foreignKey: 'supplierId',
  as: 'budgetSupplier'
});
Supplier.hasMany(Budget, { 
  foreignKey: 'supplierId',
  as: 'budgets'
});

// Relación entre Budget and EconomicActivity
Budget.belongsToMany(EconomicActivity, {
  through: 'BudgetEconomicActivities',
  foreignKey: 'budgetId',
  otherKey: 'economicActivityId',
  as: 'budgetEconomicActivities'
});

EconomicActivity.belongsToMany(Budget, {
  through: 'BudgetEconomicActivities',
  foreignKey: 'economicActivityId',
  otherKey: 'budgetId',
  as: 'budgetActivities'
});

// Relación entre Invoice and Budget
Invoice.belongsTo(Budget, { foreignKey: 'budgetId' });
Budget.hasMany(Invoice, { foreignKey: 'budgetId' });

// Relación entre Invoice and Supplier
Invoice.belongsTo(Supplier, { foreignKey: 'supplierId' });
Supplier.hasMany(Invoice, { foreignKey: 'supplierId' });

// Relación entre Invoice and Condominium
Invoice.belongsTo(Condominium, { foreignKey: 'condominiumId' });
Condominium.hasMany(Invoice, { foreignKey: 'condominiumId' });

// Relaciones entre Owner y User
User.hasOne(Owner, { foreignKey: 'userId', as: 'ownerProfile' });
Owner.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relaciones entre Owner y Condominium
Owner.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });
Condominium.hasMany(Owner, { foreignKey: 'condominiumId', as: 'owners' });

// Relaciones entre Owner y Property
Owner.hasMany(Property, { foreignKey: 'ownerId', as: 'properties' });
Property.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

// Relaciones entre Property y Condominium
Property.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });
Condominium.hasMany(Property, { foreignKey: 'condominiumId', as: 'properties' });

// Relación entre Receipt y Property
Receipt.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Property.hasMany(Receipt, { foreignKey: 'propertyId', as: 'receipts' });

module.exports = {
  User,
  Condominium,
  Receipt,
  Payment,
  Expense,
  EconomicActivity,
  Supplier,
  BankAccount,
  ReserveFund,
  ReserveFundContribution,
  Budget,
  Invoice,
  Owner,
  Property
};
