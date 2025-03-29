'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Paso 1: Modificar la columna aliquot para permitir valores NULL temporalmente
      await queryInterface.changeColumn('Properties', 'aliquot', {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Porcentaje de alícuota para el cálculo de gastos'
      });

      // Paso 2: Actualizar los registros existentes con un valor predeterminado
      await queryInterface.sequelize.query(
        `UPDATE "Properties" SET "aliquot" = 1.0 WHERE "aliquot" IS NULL`
      );

      // Paso 3: Modificar la columna para no permitir valores NULL de nuevo
      await queryInterface.changeColumn('Properties', 'aliquot', {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Porcentaje de alícuota para el cálculo de gastos'
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revertir los cambios: permitir valores NULL de nuevo
      await queryInterface.changeColumn('Properties', 'aliquot', {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Porcentaje de alícuota para el cálculo de gastos'
      });
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}; 