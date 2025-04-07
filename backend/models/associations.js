const User = require('./User');
const Condominium = require('./Condominium');
const Budget = require('./Budget');
const EconomicActivity = require('./EconomicActivity');
const Owner = require('./Owner');
const Property = require('./Property');
const Receipt = require('./Receipt');
const ContactInfo = require('./ContactInfo');
const Supplier = require('./Supplier');

// Relaciones entre User y Condominium
User.belongsTo(Condominium, { foreignKey: 'condominiumId' });
Condominium.hasMany(User, { foreignKey: 'condominiumId' });

// Relaciones entre User y ContactInfo
User.hasOne(ContactInfo, { foreignKey: 'userId' });
ContactInfo.belongsTo(User, { foreignKey: 'userId' });

// Relaciones entre Budget y Supplier
Budget.belongsTo(Supplier, {
  as: 'supplier',
  foreignKey: 'supplierId'
});

Supplier.hasMany(Budget, {
  as: 'supplierBudgets',
  foreignKey: 'supplierId'
});

// Relaciones entre Budget y EconomicActivity
Budget.belongsToMany(EconomicActivity, {
  through: 'BudgetEconomicActivities',
  as: 'budgetEconomicActivities',
  foreignKey: 'budgetId',
  otherKey: 'economicActivityId'
});

EconomicActivity.belongsToMany(Budget, {
  through: 'BudgetEconomicActivities',
  as: 'budgetActivities',
  foreignKey: 'economicActivityId',
  otherKey: 'budgetId'
});

// Relaciones entre Owner y User
Owner.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Owner, { foreignKey: 'userId' });

// Relaciones entre Owner y Condominium
Owner.belongsTo(Condominium, { foreignKey: 'condominiumId' });
Condominium.hasMany(Owner, { foreignKey: 'condominiumId' });

// Relaciones entre Owner y Property
Owner.hasMany(Property, { foreignKey: 'ownerId' });
Property.belongsTo(Owner, { foreignKey: 'ownerId' });

// Relaciones entre Receipt y Property
Receipt.belongsTo(Property, { foreignKey: 'propertyId' });
Property.hasMany(Receipt, { foreignKey: 'propertyId' });

// Relaciones entre Receipt y User
Receipt.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Receipt, { foreignKey: 'userId' });

function setupAssociations() {
  // Asociación entre User y Receipt
  User.hasMany(Receipt, { foreignKey: 'userId' });
  Receipt.belongsTo(User, { foreignKey: 'userId' });
}

module.exports = {
  User,
  Condominium,
  Budget,
  EconomicActivity,
  Owner,
  Property,
  ContactInfo,
  setupAssociations
}; 