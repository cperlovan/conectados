'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar si existe la columna userId en Properties
      const table = await queryInterface.describeTable('Properties');

      if (table.userId) {
        // Paso 1: Eliminar la clave foránea de userId si existe
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE "Properties" DROP CONSTRAINT IF EXISTS "Properties_userId_fkey"`
          );
          console.log('Clave foránea de userId eliminada correctamente');
        } catch (error) {
          console.error('Error al eliminar clave foránea:', error);
        }

        // Paso 2: Eliminar la columna userId si existe
        try {
          await queryInterface.removeColumn('Properties', 'userId');
          console.log('Columna userId eliminada correctamente');
        } catch (error) {
          console.error('Error al eliminar columna userId:', error);
        }
      }

      // Paso 3: Asegurarse de que ownerId tenga la referencia correcta
      try {
        // Primero eliminar cualquier clave foránea existente en ownerId
        await queryInterface.sequelize.query(
          `ALTER TABLE "Properties" DROP CONSTRAINT IF EXISTS "Properties_ownerId_fkey"`
        );

        // Luego crear la clave foránea correcta
        await queryInterface.addConstraint('Properties', {
          fields: ['ownerId'],
          type: 'foreign key',
          name: 'Properties_ownerId_fkey',
          references: {
            table: 'Owners',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        console.log('Clave foránea de ownerId creada correctamente');
      } catch (error) {
        console.error('Error al crear clave foránea de ownerId:', error);
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // No hacemos nada en la reversión, porque no queremos restaurar una relación incorrecta
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}; 