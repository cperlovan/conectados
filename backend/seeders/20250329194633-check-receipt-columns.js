'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Consultar la estructura de la tabla Receipts
      const [results] = await queryInterface.sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Receipts'",
        { logging: console.log }
      );
      
      console.log('=== Columnas en la tabla Receipts ===');
      results.forEach(column => {
        console.log(`${column.column_name}: ${column.data_type}`);
      });
      
      // Verificar si existe la columna propertyId
      const propertyIdColumn = results.find(column => column.column_name === 'propertyId');
      
      if (propertyIdColumn) {
        console.log('\n✅ La columna propertyId existe en la tabla Receipts');
      } else {
        console.log('\n❌ La columna propertyId NO existe en la tabla Receipts');
        console.log('Intentando añadir la columna propertyId...');
        
        // Intentar añadir la columna manualmente si no existe
        await queryInterface.addColumn('Receipts', 'propertyId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Properties',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        
        console.log('✅ Columna propertyId añadida con éxito');
      }
    } catch (error) {
      console.error('❌ Error al verificar/añadir la columna:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // No eliminar nada en down
  }
};