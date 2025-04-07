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
const ReserveFundWithdrawal = require('./models/ReserveFundWithdrawal');
const Budget = require('./models/Budget');
const Invoice = require('./models/Invoice');
const Owner = require('./models/Owner');
const BudgetEconomicActivity = require('./models/BudgetEconomicActivity');
const ContactInfo = require('./models/ContactInfo');

// Relaciones 
Condominium.hasMany(User, { foreignKey: 'condominiumId' });
User.belongsTo(Condominium, { foreignKey: 'condominiumId' });

// Relación entre User y ContactInfo
User.hasOne(ContactInfo, { foreignKey: 'userId' });
ContactInfo.belongsTo(User, { foreignKey: 'userId' });

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

Receipt.hasOne(Payment, { 
  foreignKey: 'receiptId',
  as: 'payment'
});
Payment.belongsTo(Receipt, { 
  foreignKey: 'receiptId',
  as: 'receipt'
});



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

// Relación entre ReserveFund and ReserveFundWithdrawal
ReserveFund.hasMany(ReserveFundWithdrawal, { foreignKey: 'reserveFundId', as: 'withdrawals' });
ReserveFundWithdrawal.belongsTo(ReserveFund, { foreignKey: 'reserveFundId', as: 'reserveFund' });

// Relación entre Condominium and ReserveFundWithdrawal
Condominium.hasMany(ReserveFundWithdrawal, { foreignKey: 'condominiumId', as: 'fundWithdrawals' });
ReserveFundWithdrawal.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });

// backend/relations.js
// ... existing code ...

// Relación entre Budget and Supplier
Budget.belongsTo(Supplier, { 
  foreignKey: 'supplierId',
  as: 'supplier'
});
Supplier.hasMany(Budget, { 
  foreignKey: 'supplierId',
  as: 'supplierBudgets'
});

// Relación entre Budget and EconomicActivity
Budget.belongsToMany(EconomicActivity, {
  through: BudgetEconomicActivity,
  foreignKey: 'budgetId',
  otherKey: 'economicActivityId',
  as: 'economicActivities'
});

EconomicActivity.belongsToMany(Budget, {
  through: BudgetEconomicActivity,
  foreignKey: 'economicActivityId',
  otherKey: 'budgetId',
  as: 'budgets'
});

// Relación entre Budget and Condominium
Budget.belongsTo(Condominium, { 
  foreignKey: 'condominiumId',
  as: 'condominium'
});
Condominium.hasMany(Budget, { 
  foreignKey: 'condominiumId',
  as: 'budgets'
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

// Relación entre Receipt y Property (opcional)
Receipt.belongsTo(Property, { 
  foreignKey: 'propertyId', 
  as: 'property',
  required: false // Relación opcional para poder tener recibos sin propiedad
});
Property.hasMany(Receipt, { 
  foreignKey: 'propertyId', 
  as: 'receipts'
});

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
  ReserveFundWithdrawal,
  Budget,
  Invoice,
  Owner,
  Property,
  BudgetEconomicActivity,
  ContactInfo
};
