const User = require('./models/User');
const Condominium = require('./models/Condominium');
const Property = require('./models/Property');
const Receipt = require('./models/Receipt');
const Payment = require('./models/Payment');
const { Supplier, SupplierCondominium } = require('./models/Supplier');
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
const BudgetRequest = require('./models/BudgetRequest');
const BudgetRequestSupplier = require('./models/BudgetRequestSupplier');
const BudgetRequestEconomicActivity = require('./models/BudgetRequestEconomicActivity');
const SupplierPayment = require('./models/SupplierPayment');
const SupplierCondominiums = require('./models/SupplierCondominiums');

// Comentando importaciones de modelos que no existen actualmente
// const ProductSubCategory = require('./models/ProductSubCategory');
// const ProductCategory = require('./models/ProductCategory');
// const PaymentMethod = require('./models/PaymentMethod');
// const UploadedDocument = require('./models/UploadedDocument');
// const Building = require('./models/Building');
// const Unit = require('./models/Unit');
// const ProductPhoto = require('./models/ProductPhoto');
// const Product = require('./models/Product');
// const Order = require('./models/Order');
// const OrderProduct = require('./models/OrderProduct');
// const PaymentOrder = require('./models/PaymentOrder');
// const PaymentOrderFiles = require('./models/PaymentOrderFiles');
// const Notification = require('./models/Notification');

// Relaciones 
Condominium.hasMany(User, { foreignKey: 'condominiumId' });
User.belongsTo(Condominium, { foreignKey: 'condominiumId' });

User.hasMany(Receipt, { foreignKey: 'userId' });
Receipt.belongsTo(User, { foreignKey: 'userId' });

// Agregar relación con creator (que es diferente a userId)
Receipt.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Receipt, { as: 'createdReceipts', foreignKey: 'creatorId' });

// Eliminar relación directa entre User y Property
// User.hasMany(Property, { foreignKey: 'userId' });
// Property.belongsTo(User, { foreignKey: 'userId' });

Condominium.hasMany(Receipt, { foreignKey: 'condominiumId' });
Receipt.belongsTo(Condominium, { foreignKey: 'condominiumId' });

Condominium.hasMany(Payment, { foreignKey: 'condominiumId' });
Payment.belongsTo(Condominium, { foreignKey: 'condominiumId' });

User.hasMany(Payment, { foreignKey: 'userId' }); 
Payment.belongsTo(User, { foreignKey: 'userId' });

// Relación inicial entre Payment y Receipt
Receipt.hasOne(Payment, { 
  foreignKey: 'receiptId',
  as: 'paymentRecord'
});
Payment.belongsTo(Receipt, { 
  foreignKey: 'receiptId',
  as: 'receiptData'
});

// Relaciones entre Condominium y BankAccount
Condominium.hasMany(BankAccount, { foreignKey: 'condominiumId' });
BankAccount.belongsTo(Condominium, { foreignKey: 'condominiumId' });

// Relaciones entre Condominium y ReserveFund
Condominium.hasMany(ReserveFund, { foreignKey: 'condominiumId' });
ReserveFund.belongsTo(Condominium, { foreignKey: 'condominiumId' });


Condominium.hasMany(Expense, { foreignKey: 'condominiumId' });
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

Supplier.belongsToMany(EconomicActivity, {
  through: SupplierEconomicActivity,
  foreignKey: 'supplierId',
  otherKey: 'economicActivityId',
});

EconomicActivity.belongsToMany(Supplier, {
  through: SupplierEconomicActivity,
  foreignKey: 'economicActivityId',
  otherKey: 'supplierId',
});

// Relación entre User and Supplier
User.hasOne(Supplier, { foreignKey: 'userId' });
Supplier.belongsTo(User, { foreignKey: 'userId' });

// Relaciones many-to-many entre Supplier y Condominium usando SupplierCondominiums
Supplier.belongsToMany(Condominium, {
  through: SupplierCondominiums,
  foreignKey: 'supplierId'
});

Condominium.belongsToMany(Supplier, {
  through: SupplierCondominiums,
  foreignKey: 'condominiumId'
});

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
Invoice.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(Invoice, { foreignKey: 'supplierId', as: 'invoices' });

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

// Relaciones entre BudgetRequest y Condominium
BudgetRequest.belongsTo(Condominium, {
  as: 'condominium',
  foreignKey: 'condominiumId'
});

Condominium.hasMany(BudgetRequest, {
  as: 'budgetRequests',
  foreignKey: 'condominiumId'
});

// Relaciones entre BudgetRequest y Supplier
BudgetRequest.belongsToMany(Supplier, {
  through: BudgetRequestSupplier,
  as: 'suppliers',
  foreignKey: 'budgetRequestId',
  otherKey: 'supplierId'
});

Supplier.belongsToMany(BudgetRequest, {
  through: BudgetRequestSupplier,
  as: 'budgetRequests',
  foreignKey: 'supplierId',
  otherKey: 'budgetRequestId'
});

// Relaciones entre BudgetRequest y EconomicActivity
BudgetRequest.belongsToMany(EconomicActivity, {
  through: BudgetRequestEconomicActivity,
  as: 'economicActivities',
  foreignKey: 'budgetRequestId',
  otherKey: 'economicActivityId'
});

EconomicActivity.belongsToMany(BudgetRequest, {
  through: BudgetRequestEconomicActivity,
  as: 'budgetRequests',
  foreignKey: 'economicActivityId',
  otherKey: 'budgetRequestId'
});

// Relaciones entre BudgetRequest y Budget
BudgetRequest.hasMany(Budget, {
  as: 'budgets',
  foreignKey: 'budgetRequestId'
});

Budget.belongsTo(BudgetRequest, {
  as: 'budgetRequest',
  foreignKey: 'budgetRequestId'
});

// Relaciones para SupplierPayment
SupplierPayment.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
Invoice.hasMany(SupplierPayment, { as: 'supplierPayments', foreignKey: 'invoiceId' });

SupplierPayment.belongsTo(Supplier, { as: 'supplier', foreignKey: 'supplierId' });
Supplier.hasMany(SupplierPayment, { as: 'supplierPayments', foreignKey: 'supplierId' });

SupplierPayment.belongsTo(Condominium, { as: 'condominium', foreignKey: 'condominiumId' });
Condominium.hasMany(SupplierPayment, { as: 'supplierPayments', foreignKey: 'condominiumId' });

// Define relationships
// Las siguientes relaciones ya están definidas arriba, así que las comentamos para evitar duplicados
// User - Condominium
// User.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });
// Condominium.hasMany(User, { foreignKey: 'condominiumId', as: 'users' });

// User - Supplier 
// User.hasOne(Supplier, { foreignKey: 'userId' });
// Supplier.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Supplier - EconomicActivity (Many-to-Many) - Ya definido arriba
// Supplier.belongsToMany(EconomicActivity, { 
//   through: SupplierEconomicActivity,
//   foreignKey: 'supplierId', 
//   otherKey: 'economicActivityId'
// });
// EconomicActivity.belongsToMany(Supplier, { 
//   through: SupplierEconomicActivity,
//   foreignKey: 'economicActivityId', 
//   otherKey: 'supplierId'
// });

// Payment - User (Creator)
Payment.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Payment, { as: 'createdPayments', foreignKey: 'creatorId' });

// Payment - Supplier
Payment.belongsTo(Supplier, { as: 'supplier', foreignKey: 'supplierId' });
Supplier.hasMany(Payment, { as: 'paymentRecords', foreignKey: 'supplierId' });

// Payment - Receipt (en la parte inferior del archivo)
Payment.belongsTo(Receipt, { as: 'receiptInfo', foreignKey: 'receiptId' });
Receipt.hasOne(Payment, { as: 'paymentInfo', foreignKey: 'receiptId' });

// Payment - Condominium
Payment.belongsTo(Condominium, { as: 'condominium', foreignKey: 'condominiumId' });
Condominium.hasMany(Payment, { as: 'payments', foreignKey: 'condominiumId' });

// Receipt - User (Creator) - Ya está definido arriba
// Receipt.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
// User.hasMany(Receipt, { as: 'createdReceipts', foreignKey: 'creatorId' });

// Receipt - Supplier - Ya está definido arriba
// Receipt.belongsTo(Supplier, { as: 'supplier', foreignKey: 'supplierId' });
// Supplier.hasMany(Receipt, { as: 'receipts', foreignKey: 'supplierId' });

// Receipt - Condominium - Ya está definido arriba
// Receipt.belongsTo(Condominium, { as: 'condominium', foreignKey: 'condominiumId' });
// Condominium.hasMany(Receipt, { as: 'receipts', foreignKey: 'condominiumId' });

// Condominium - UploadedDocument
// Condominium.hasMany(UploadedDocument, { foreignKey: 'condominiumId', as: 'documents' });
// UploadedDocument.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });

// User - UploadedDocument
// User.hasMany(UploadedDocument, { foreignKey: 'userId', as: 'documents' });
// UploadedDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Supplier - UploadedDocument
// Supplier.hasMany(UploadedDocument, { foreignKey: 'supplierId', as: 'documents' });
// UploadedDocument.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Condominium - Building
// Condominium.hasMany(Building, { foreignKey: 'condominiumId', as: 'buildings' });
// Building.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });

// Building - Unit
// Building.hasMany(Unit, { foreignKey: 'buildingId', as: 'units' });
// Unit.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

// Unit - User
// Unit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(Unit, { foreignKey: 'userId', as: 'units' });

// Order - User
// Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// Order - Supplier
// Order.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
// Supplier.hasMany(Order, { foreignKey: 'supplierId', as: 'orders' });

// PaymentOrder - Order
// PaymentOrder.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
// Order.hasOne(PaymentOrder, { foreignKey: 'orderId', as: 'paymentOrder' });

// PaymentOrder - PaymentOrderFiles
// PaymentOrder.hasMany(PaymentOrderFiles, { foreignKey: 'paymentOrderId', as: 'files' });
// PaymentOrderFiles.belongsTo(PaymentOrder, { foreignKey: 'paymentOrderId', as: 'paymentOrder' });

// Notification - User
// Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Notification - Supplier
// Notification.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
// Supplier.hasMany(Notification, { foreignKey: 'supplierId', as: 'notifications' });

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
  BudgetRequest,
  BudgetRequestSupplier,
  BudgetRequestEconomicActivity,
  SupplierPayment,
  // PaymentMethod,
  // UploadedDocument,
  // Building,
  // Unit,
  // Order,
  // PaymentOrder,
  // PaymentOrderFiles,
  // Notification
};
