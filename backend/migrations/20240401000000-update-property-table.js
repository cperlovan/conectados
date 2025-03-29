'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Paso 1: Verificar si la columna ya existe
      try {
        await queryInterface.describeTable('Properties')
          .then(tableDefinition => {
            // Si la columna ya existe, no hacemos nada
            if (tableDefinition.number) {
              console.log('La columna number ya existe en la tabla Properties');
              return;
            }
          });
      } catch (error) {
        console.error('Error al verificar la tabla:', error);
      }

      // Paso 2: Agregar la columna 'number' como NULL primero
      await queryInterface.addColumn('Properties', 'number', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Número o identificador de la propiedad'
      });

      // Paso 3: Actualizar los registros existentes con un valor predeterminado
      // Usamos CONCAT con CAST para asegurarnos que funcione en PostgreSQL
      await queryInterface.sequelize.query(
        `UPDATE "Properties" SET "number" = CONCAT('PROP-', CAST("id" AS VARCHAR)) WHERE "number" IS NULL`
      );

      // Paso 4: Modificar la columna para que sea NOT NULL
      await queryInterface.changeColumn('Properties', 'number', {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Número o identificador de la propiedad'
      });

      // Paso 5: Agregar un índice único
      try {
        await queryInterface.addIndex('Properties', ['number', 'condominiumId'], {
          name: 'properties_number_condominium_unique_idx',
          unique: true
        });
      } catch (error) {
        console.error('Error al agregar índice:', error);
        // Si el índice ya existe, seguimos adelante
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Eliminar el índice primero
      try {
        await queryInterface.removeIndex('Properties', 'properties_number_condominium_unique_idx');
      } catch (error) {
        console.error('Error al eliminar índice:', error);
        // Si el índice no existe, seguimos adelante
      }
      
      // Eliminar la columna
      try {
        await queryInterface.removeColumn('Properties', 'number');
      } catch (error) {
        console.error('Error al eliminar columna:', error);
      }
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}; 