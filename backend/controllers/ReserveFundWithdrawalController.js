const ReserveFundWithdrawal = require('../models/ReserveFundWithdrawal');
const ReserveFund = require('../models/ReserveFund');
const sequelize = require('../config/database');

// Crear un retiro del fondo de reserva
exports.createWithdrawal = async (req, res) => {
  const { 
    amount, 
    description, 
    date, 
    reserveFundId, 
    observations,
    reason,
    approvedBy,
    documentReference
  } = req.body;
  
  const condominiumId = req.user?.condominiumId || req.body.condominiumId;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // 1. Verificar que el fondo tenga saldo suficiente
    const fund = await ReserveFund.findByPk(reserveFundId, { transaction });
    if (!fund) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    const currentAmount = parseFloat(fund.amount);
    const withdrawalAmount = parseFloat(amount);

    if (withdrawalAmount > currentAmount) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Saldo insuficiente para realizar el retiro',
        currentBalance: currentAmount.toFixed(2),
        requestedAmount: withdrawalAmount.toFixed(2)
      });
    }

    // 2. Crear el retiro
    const withdrawal = await ReserveFundWithdrawal.create({ 
      amount: withdrawalAmount.toFixed(2), 
      description, 
      date, 
      reserveFundId, 
      condominiumId,
      observations,
      reason,
      approvedBy,
      documentReference,
      status: 'completed'
    }, { transaction });

    // 3. Actualizar el saldo del fondo
    const newAmount = currentAmount - withdrawalAmount;
    await fund.update({ amount: newAmount.toFixed(2) }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(201).json({
      message: 'Retiro realizado exitosamente',
      withdrawal,
      fund: {
        id: fund.id,
        amount: newAmount.toFixed(2),
        previousAmount: currentAmount.toFixed(2)
      }
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al crear el retiro:', error);
    res.status(500).json({ 
      message: 'Error al realizar el retiro del fondo de reserva.', 
      error: error.message 
    });
  }
};

// Obtener todos los retiros de un fondo
exports.getWithdrawalsByFund = async (req, res) => {
  const { fundId } = req.params;

  try {
    const withdrawals = await ReserveFundWithdrawal.findAll({ 
      where: { reserveFundId: fundId },
      order: [['date', 'DESC']]
    });
    
    res.status(200).json(withdrawals);
  } catch (error) {
    console.error('Error al obtener los retiros:', error);
    res.status(500).json({ 
      message: 'Error al obtener los retiros del fondo de reserva.', 
      error: error.message 
    });
  }
};

// Obtener un retiro por ID
exports.getWithdrawalById = async (req, res) => {
  const { id } = req.params;

  try {
    const withdrawal = await ReserveFundWithdrawal.findByPk(id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Retiro no encontrado.' });
    }
    
    res.status(200).json(withdrawal);
  } catch (error) {
    console.error('Error al obtener el retiro:', error);
    res.status(500).json({ 
      message: 'Error al obtener el retiro del fondo de reserva.', 
      error: error.message 
    });
  }
};

// Cancelar un retiro (revertir la operación)
exports.cancelWithdrawal = async (req, res) => {
  const { id } = req.params;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // 1. Buscar el retiro
    const withdrawal = await ReserveFundWithdrawal.findByPk(id, { transaction });
    if (!withdrawal) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Retiro no encontrado.' });
    }

    // Verificar que el retiro no esté ya cancelado
    if (withdrawal.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Este retiro ya ha sido cancelado.' });
    }

    // 2. Obtener datos necesarios
    const withdrawalAmount = parseFloat(withdrawal.amount);
    const reserveFundId = withdrawal.reserveFundId;

    // 3. Actualizar el saldo del fondo (devolver el monto)
    const fund = await ReserveFund.findByPk(reserveFundId, { transaction });
    if (!fund) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fondo de reserva no encontrado.' });
    }

    const currentAmount = parseFloat(fund.amount);
    const newAmount = currentAmount + withdrawalAmount;

    await fund.update({ amount: newAmount.toFixed(2) }, { transaction });

    // 4. Marcar el retiro como cancelado
    await withdrawal.update({ status: 'cancelled' }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(200).json({
      message: 'Retiro cancelado exitosamente',
      withdrawal,
      fund: {
        id: fund.id,
        amount: newAmount.toFixed(2),
        previousAmount: currentAmount.toFixed(2)
      }
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al cancelar el retiro:', error);
    res.status(500).json({ 
      message: 'Error al cancelar el retiro del fondo de reserva.', 
      error: error.message 
    });
  }
};

// Obtener todos los retiros de un condominio
exports.getWithdrawalsByCondominium = async (req, res) => {
  const condominiumId = req.user?.condominiumId || req.params.condominiumId;

  try {
    const withdrawals = await ReserveFundWithdrawal.findAll({ 
      where: { condominiumId },
      order: [['date', 'DESC']]
    });
    
    res.status(200).json(withdrawals);
  } catch (error) {
    console.error('Error al obtener los retiros:', error);
    res.status(500).json({ 
      message: 'Error al obtener los retiros del condominio.', 
      error: error.message 
    });
  }
}; 