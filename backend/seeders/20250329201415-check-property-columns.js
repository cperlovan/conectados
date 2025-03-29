'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Consultar la estructura de la tabla Properties
      const [results] = await queryInterface.sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Properties'",
        { logging: console.log }
      );
      
      console.log('=== Columnas en la tabla Properties ===');
      results.forEach(column => {
        console.log(`${column.column_name}: ${column.data_type}`);
      });
      
      // Verificar si existe la columna name
      const nameColumn = results.find(column => column.column_name === 'name');
      
      if (!nameColumn) {
        console.log('\n❌ La columna name NO existe en la tabla Properties');
        console.log('Intentando añadir la columna name...');
        
        // Intentar añadir la columna manualmente si no existe
        await queryInterface.addColumn('Properties', 'name', {
          type: Sequelize.STRING,
          allowNull: true
        });
        
        console.log('✅ Columna name añadida con éxito');
      } else {
        console.log('\n✅ La columna name ya existe en la tabla Properties');
      }
      
      // Verificar si existen las demás columnas necesarias
      const columns = ['number', 'block', 'address'];
      
      for (const columnName of columns) {
        const column = results.find(col => col.column_name === columnName);
        
        if (!column) {
          console.log(`\n❌ La columna ${columnName} NO existe en la tabla Properties`);
          console.log(`Intentando añadir la columna ${columnName}...`);
          
          await queryInterface.addColumn('Properties', columnName, {
            type: Sequelize.STRING,
            allowNull: true
          });
          
          console.log(`✅ Columna ${columnName} añadida con éxito`);
        } else {
          console.log(`\n✅ La columna ${columnName} ya existe en la tabla Properties`);
        }
      }
    } catch (error) {
      console.error('❌ Error al verificar/añadir las columnas:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // No eliminar nada en down
  }
};
