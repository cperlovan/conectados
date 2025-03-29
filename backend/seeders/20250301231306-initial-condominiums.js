module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Condominiums', [
      {
        name: 'Condominio A',
        type: 'residential',
        rif: 'J123456789',
        address: 'Dirección del Condominio A',
        phone: '123456789',
        email: 'condominioA@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Condominio B',
        type: 'commercial',
        rif: 'J987654321',
        address: 'Dirección del Condominio B',
        phone: '987654321',
        email: 'condominioB@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Condominiums', null, {});
  },
};