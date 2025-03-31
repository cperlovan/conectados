const ReserveFundContribution = require('../models/ReserveFundContribution');
const Condominium = require('../models/Condominium');
const ReserveFund = require('../models/ReserveFund');
const sequelize = require('../config/database');

// Crear una contribución de fondo de reserva y actualizar el saldo del fondo
exports.createReserveFundContribution = async (req, res) => {
  const { amount, description, date, reserveFundId, observations } = req.body;
  const condominiumId = req.user?.condominiumId || req.body.condominiumId;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // 1. Crear la contribución
    const contribution = await ReserveFundContribution.create({ 
      amount, 
      description, 
      date, 
      reserveFundId, 
      condominiumId,
      observations
    }, { transaction });

    // 2. Actualizar el saldo del fondo de reserva
    const fund = await ReserveFund.findByPk(reserveFundId, { transaction });
    if (!fund) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    // Incrementar el saldo actual
    const currentAmount = parseFloat(fund.amount);
    const contributionAmount = parseFloat(amount);
    const newAmount = currentAmount + contributionAmount;

    await fund.update({ amount: newAmount.toFixed(2) }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(201).json({
      message: 'Contribución creada exitosamente',
      contribution,
      fund: {
        id: fund.id,
        amount: fund.amount,
        previousAmount: currentAmount.toFixed(2)
      }
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al crear la contribución:', error);
    res.status(500).json({ 
      message: 'Error al crear la contribución de fondo de reserva.', 
      error: error.message 
    });
  }
};

// obtener todas las contribuciones de fondo de reserva
exports.getReserveFundContributions = async (req, res) => {
  try {
    const contributions = await ReserveFundContribution.findAll();
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva.', error });
  }
};


// obtener una contribución de fondo de reserva por id
exports.getReserveFundContributionById = async (req, res) => {
  const { id } = req.params;

  try {
    const contribution = await ReserveFundContribution.findByPk(id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }
    res.status(200).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la contribución de fondo de reserva.', error });
  }
};

// actualizar una contribución de fondo de reserva por id
exports.updateReserveFundContribution = async (req, res) => {
  const { id } = req.params;
  const { amount, description, date, reserveFundId, observations } = req.body;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // Buscar la contribución
    const contribution = await ReserveFundContribution.findByPk(id, { transaction });
    if (!contribution) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }

    // Obtener el monto actual de la contribución
    const oldAmount = parseFloat(contribution.amount);
    const newAmount = parseFloat(amount);
    const difference = newAmount - oldAmount;

    // Actualizar la contribución
    await contribution.update({ 
      amount, 
      description, 
      date, 
      reserveFundId,
      observations 
    }, { transaction });

    // Actualizar el saldo del fondo de reserva
    const fund = await ReserveFund.findByPk(reserveFundId, { transaction });
    if (!fund) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    // Ajustar el saldo
    const currentFundAmount = parseFloat(fund.amount);
    const newFundAmount = currentFundAmount + difference;

    await fund.update({ amount: newFundAmount.toFixed(2) }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(200).json({
      message: 'Contribución actualizada exitosamente',
      contribution,
      fund: {
        id: fund.id,
        amount: fund.amount,
        previousAmount: currentFundAmount.toFixed(2)
      }
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al actualizar la contribución:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la contribución de fondo de reserva.', 
      error: error.message 
    });
  }
};

// eliminar una contribución de fondo de reserva por id
exports.deleteReserveFundContribution = async (req, res) => {
  const { id } = req.params;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // Buscar la contribución
    const contribution = await ReserveFundContribution.findByPk(id, { transaction });
    if (!contribution) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }

    // Obtener el monto de la contribución
    const contributionAmount = parseFloat(contribution.amount);
    const reserveFundId = contribution.reserveFundId;

    // Actualizar el saldo del fondo de reserva
    const fund = await ReserveFund.findByPk(reserveFundId, { transaction });
    if (!fund) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    // Reducir el saldo
    const currentAmount = parseFloat(fund.amount);
    const newAmount = Math.max(0, currentAmount - contributionAmount); // Evitar saldos negativos

    await fund.update({ amount: newAmount.toFixed(2) }, { transaction });

    // Eliminar la contribución (o marcarla como inactiva)
    await contribution.destroy({ transaction });
    // Alternativa: await contribution.update({ status: 'inactive' }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(200).json({ 
      message: 'Contribución de fondo de reserva eliminada exitosamente.',
      fund: {
        id: fund.id,
        amount: fund.amount,
        previousAmount: currentAmount.toFixed(2)
      }
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al eliminar la contribución:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la contribución de fondo de reserva.', 
      error: error.message 
    });
  }
};

// obtener todas las contribuciones de fondo de reserva de un condominio     
exports.getReserveFundContributionsByCondominium = async (req, res) => {
  //const { condominiumId } = req.params;
  const condominiumId = req.user.condominiumId;

  try {
    const contributions = await ReserveFundContribution.findAll({ where: { condominiumId } });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva del condominio.', error });
  }
};

// obtener todas las contribuciones de fondo de reserva de un condominio por id
exports.getCalculateTotalAmount = async (req, res) => {
  const { id } = req.params;
  const condominiumId = req.user.condominiumId;

  try { const totalAmount = await ReserveFundContribution.sum('amount', { where: { condominiumId } });
    res.status(200).json({ totalAmount });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular el total de la contribución de fondo de reserva.', error });
  }
};

exports.getContributionByFundId = async (req, res) => {
  const { id } = req.params;

  try {
    const contributions = await ReserveFundContribution.findAll({ where: { reserveFundId: id } });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva por id.', error });
  }
};







