const sequelize = require('./config/database');

(async () => {
  try {
    // Obtener el queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Verificar si la columna ya existe
    const tableInfo = await queryInterface.describeTable('Users');
    
    if (!tableInfo.pending_amount) {
      // Añadir la columna pending_amount si no existe
      await queryInterface.addColumn('Users', 'pending_amount', {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      });
      console.log('Columna pending_amount añadida con éxito a la tabla Users');
    } else {
      console.log('La columna pending_amount ya existe en la tabla Users');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error al añadir la columna pending_amount:', error);
    process.exit(1);
  }
})(); 