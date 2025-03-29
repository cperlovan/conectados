const User = require('./User');
const Condominium = require('./Condominium');
const Budget = require('./Budget');
const EconomicActivity = require('./EconomicActivity');
const Owner = require('./Owner');
const Property = require('./Property');

// Relaciones entre User y Condominium
User.belongsTo(Condominium, { foreignKey: 'condominiumId' });
Condominium.hasMany(User, { foreignKey: 'condominiumId' });

// Relaciones entre Budget y User (proveedor)
Budget.belongsTo(User, {
  as: 'supplier',
  foreignKey: 'supplierId'
});

User.hasMany(Budget, {
  as: 'budgets',
  foreignKey: 'supplierId'
});

// Relaciones entre Budget y EconomicActivity
Budget.belongsToMany(EconomicActivity, {
  through: 'BudgetEconomicActivities',
  as: 'economicActivities',
  foreignKey: 'budgetId',
  otherKey: 'economicActivityId'
});

EconomicActivity.belongsToMany(Budget, {
  through: 'BudgetEconomicActivities',
  as: 'budgets',
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

module.exports = {
  User,
  Condominium,
  Budget,
  EconomicActivity,
  Owner,
  Property
}; 