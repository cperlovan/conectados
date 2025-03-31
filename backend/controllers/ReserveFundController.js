const ReserveFund = require('../models/ReserveFund');
const ReserveFundContribution = require('../models/ReserveFundContribution');
const sequelize = require('../config/database');

// Crear un nuevo fondo de reserva
exports.createReserveFund = async (req, res) => {
  const { amount, description, condominiumId } = req.body;
  
  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // 1. Crear el fondo con monto inicial 0
    const fund = await ReserveFund.create({ 
      amount: 0, 
      description, 
      condominiumId 
    }, { transaction });

    // 2. Crear una contribución inicial con el monto especificado
    const today = new Date().toISOString().split('T')[0];
    const initialContribution = await ReserveFundContribution.create({
      amount,
      date: today,
      description: "Monto inicial del fondo de reserva",
      observations: "Contribución automática generada al crear el fondo",
      reserveFundId: fund.id,
      condominiumId
    }, { transaction });

    // 3. Actualizar el saldo del fondo con el monto inicial
    await fund.update({ amount }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(201).json({ 
      message: 'Fondo de reserva creado exitosamente con contribución inicial.', 
      fund,
      initialContribution
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al crear el fondo de reserva:', error);
    res.status(500).json({ message: 'Error al crear el fondo de reserva.', error: error.message });
  }
};

// Obtener todos los fondos de reserva de un condominio
exports.getReserveFundsByCondominium = async (req, res) => {
  const { condominiumId } = req.params;
  console.log("este es el condominiumId Fund: " + condominiumId)
  try {
    const funds = await ReserveFund.findAll({ where: { condominiumId } });
    res.status(200).json(funds);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los fondos de reserva.', error });
  }
};

// Actualizar un fondo de reserva
exports.updateReserveFund = async (req, res) => {
  const { id } = req.params;
  const { amount, description, status } = req.body;

  try {
    const fund = await ReserveFund.findByPk(id);
    if (!fund) {
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    await fund.update({ amount, description, status });
    res.status(200).json({ message: 'Fondo de reserva actualizado exitosamente.', fund });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el fondo de reserva.', error });
  }
};

// Eliminar lógicamente un fondo de reserva
exports.deleteReserveFund = async (req, res) => {
  const { id } = req.params;

  try {
    const fund = await ReserveFund.findByPk(id);
    if (!fund) {
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    await fund.update({ status: 'inactive' });
    res.status(200).json({ message: 'Fondo de reserva eliminado.', fund });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el fondo de reserva.', error });
  }
};