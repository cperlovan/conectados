const e = require('express');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Property = require('../models/Property');

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
  const { amount, method, receiptId, condominiumId, payment_details, status } = req.body;

  try {
    // Buscar el recibo asociado
    const receipt = await Receipt.findByPk(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }

    // Obtener los montos actuales y convertirlos a números
    const currentPendingAmount = parseFloat(receipt.pending_amount === null ? receipt.amount : receipt.pending_amount);
    const currentCreditBalance = parseFloat(receipt.credit_balance || 0);
    const paymentAmount = parseFloat(amount);
    const originalAmount = parseFloat(receipt.amount);

    console.log('Montos iniciales:', {
      currentPendingAmount,
      currentCreditBalance,
      paymentAmount,
      originalAmount
    });

    // Primero aplicamos el nuevo pago
    let remainingPendingAmount = currentPendingAmount - paymentAmount;
    let newCreditBalance = currentCreditBalance;
    let creditApplied = 0;

    console.log('Después del pago:', {
      remainingPendingAmount,
      newCreditBalance
    });

    // Si hay crédito disponible y monto pendiente, aplicar el crédito
    if (newCreditBalance > 0 && remainingPendingAmount > 0) {
      creditApplied = Math.min(newCreditBalance, remainingPendingAmount);
      remainingPendingAmount -= creditApplied;
      newCreditBalance -= creditApplied;

      console.log('Después de aplicar crédito:', {
        creditApplied,
        remainingPendingAmount,
        newCreditBalance
      });
    }

    // Si el pago excede el monto pendiente, añadir al crédito
    if (remainingPendingAmount < 0) {
      newCreditBalance += Math.abs(remainingPendingAmount);
      remainingPendingAmount = 0;

      console.log('Después de ajustar excedente:', {
        remainingPendingAmount,
        newCreditBalance
      });
    }

    // Cuando se crea el pago, el estado del recibo depende del monto pendiente
    let receiptStatus;
    if (remainingPendingAmount <= 0) {
      receiptStatus = 'paid';
    } else if (remainingPendingAmount < originalAmount) {
      receiptStatus = 'partial';
    } else {
      receiptStatus = 'pending';
    }

    console.log('Estado final:', {
      remainingPendingAmount,
      newCreditBalance,
      creditApplied,
      receiptStatus,
      calculation: `${originalAmount} - (${paymentAmount} + ${creditApplied}) = ${remainingPendingAmount}`
    });

    // Actualizar el recibo
    await receipt.update({
      pending_amount: Math.max(0, remainingPendingAmount),
      status: receiptStatus,
      credit_balance: Math.max(0, newCreditBalance)
    });

    // Crear el registro del pago
    const payment = await Payment.create({
      amount: paymentAmount,
      method,
      receiptId,
      condominiumId,
      status,
      userId: receipt.userId,
      payment_details: {
        ...payment_details,
        original_amount: originalAmount,
        credit_applied: creditApplied,
        remaining_amount: remainingPendingAmount,
        new_credit_balance: newCreditBalance
      },
    });

    // Devolver la respuesta
    res.status(201).json({
      message: 'Pago registrado exitosamente.',
      payment,
      receipt: {
        status: receiptStatus,
        pending_amount: Math.max(0, remainingPendingAmount),
        credit_balance: Math.max(0, newCreditBalance),
        credit_applied: creditApplied
      },
    });
  } catch (error) {
    console.error('Error al registrar el pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago.', error: error.message });
  }
};

// Obtener todos los pagos de un recibo específico
exports.getPaymentsByReceipt = async (req, res) => {
  const { receiptId } = req.params;
  try {
    const payments = await Payment.findAll({
      where: { receiptId },
      include: [
        {
          model: require('../models/Condominium'), // Incluir información del condominio
          attributes: ['id', 'name'],
        },
      ],
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos.', error });
  }
};

// Obtener todos los pagos de un condominio específico
exports.getPaymentsByCondominium = async (req, res) => {
  const { condominiumId } = req.params;
  try {
    const payments = await Payment.findAll({
      where: { condominiumId },
      include: [
        {
          model: Receipt,
          as: 'receipt',
          attributes: ['id', 'amount', 'status', 'pending_amount', 'credit_balance', 'month', 'year']
        }
      ]
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos.', error });
  }
};

// Actualizar un pago específico
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const payment = await Payment.findByPk(id, {
      include: [{
        model: Receipt,
        as: 'receipt',
        include: [{
          model: Property,
          as: 'property'
        }]
      }]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Obtener el recibo actual
    const receipt = await Receipt.findByPk(payment.receiptId);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    console.log('Iniciando verificación de pago:', { 
      paymentId: id, 
      amount: payment.amount,
      status: status,
      receiptId: receipt.id,
      currentCreditBalance: receipt.credit_balance,
      payment_details: payment.payment_details
    });

    // Obtener todos los pagos verificados para este recibo
    const verifiedPayments = await Payment.findAll({
      where: {
        receiptId: payment.receiptId,
        status: 'approved'
      }
    });

    // Convertir todos los valores a números
    const originalAmount = parseFloat(receipt.amount);
    const currentPaymentAmount = parseFloat(payment.amount);
    const creditAppliedInCreation = parseFloat(payment.payment_details?.credit_applied || 0);
    
    // Calcular el total de pagos verificados (excluyendo el pago actual)
    const totalVerifiedPayments = verifiedPayments
      .filter(p => p.id !== payment.id)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    console.log('Estado inicial:', {
      originalAmount,
      currentPaymentAmount,
      creditAppliedInCreation,
      totalVerifiedPayments
    });

    // Calcular el monto total disponible incluyendo el pago actual y el crédito ya aplicado
    const totalDisponible = totalVerifiedPayments + currentPaymentAmount + creditAppliedInCreation;

    // Calcular el monto pendiente
    const newPendingAmount = Math.max(0, originalAmount - totalDisponible);

    // Determinar el nuevo estado
    let newStatus;
    if (newPendingAmount === 0) {
      newStatus = 'paid';
    } else if (newPendingAmount < originalAmount) {
      newStatus = 'partial';
    } else {
      newStatus = 'pending';
    }

    console.log('Estado final calculado:', {
      newPendingAmount,
      creditAppliedInCreation,
      newStatus,
      calculation: `${originalAmount} - (${totalVerifiedPayments} + ${currentPaymentAmount} + ${creditAppliedInCreation}) = ${newPendingAmount}`
    });

    // Actualizar el pago
    await payment.update({ 
      status,
      payment_details: {
        ...payment.payment_details,
        verified_amount: currentPaymentAmount,
        total_verified: totalDisponible,
        credit_applied: creditAppliedInCreation,
        remaining_amount: newPendingAmount
      }
    });

    // Actualizar el recibo
    await receipt.update({
      status: newStatus,
      pending_amount: newPendingAmount
    });

    console.log('Recibo actualizado:', {
      receiptId: receipt.id,
      newStatus,
      newPendingAmount,
      creditAppliedInCreation
    });

    return res.json({ 
      message: 'Pago actualizado exitosamente',
      receipt: {
        id: receipt.id,
        status: newStatus,
        pending_amount: newPendingAmount,
        credit_applied: creditAppliedInCreation
      }
    });
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    return res.status(500).json({ message: 'Error al actualizar el pago' });
  }
};    

// Eliminar un pago específico
exports.deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el pago a eliminar
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    // Buscar el recibo asociado al pago
    const receipt = await Receipt.findByPk(payment.receiptId);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo asociado no encontrado.' });
    }

    // Restaurar el monto del pago al saldo pendiente del recibo
    let newPendingAmount = parseFloat(receipt.pending_amount) + parseFloat(payment.amount);

    // Ajustar el crédito si el recibo tiene saldo a favor
    let creditBalance = parseFloat(receipt.credit_balance); // Convertir a número flotante
    if (creditBalance > 0) {
      const creditAdjustment = Math.min(creditBalance, payment.amount); // Restar solo lo que cubre el crédito
      creditBalance -= creditAdjustment;
      newPendingAmount -= creditAdjustment; // Reducir el saldo pendiente por el crédito utilizado
    }

    // Determinar el nuevo estado del recibo
    let receiptStatus = receipt.status;
    if (newPendingAmount <= 0) {
      receiptStatus = 'paid'; // El recibo está completamente pagado
    } else if (newPendingAmount > 0 && newPendingAmount < receipt.amount) {
      receiptStatus = 'pending'; // El recibo tiene un saldo pendiente
    }

    // Actualizar el recibo con el nuevo saldo pendiente, estado y crédito
    await receipt.update({
      pending_amount: Math.max(newPendingAmount, 0), // No permitir valores negativos
      status: receiptStatus,
      credit_balance: parseFloat(creditBalance.toFixed(2)), // Redondear a 2 decimales
    });

    // Cambiar el estado del pago a "anuled" (anulado)
    await payment.update({ status: 'anuled' });

    // Devolver la respuesta
    res.status(200).json({
      message: 'Pago eliminado exitosamente.',
      payment,
      receipt: {
        status: receiptStatus,
        pending_amount: Math.max(newPendingAmount, 0),
        credit_balance: parseFloat(creditBalance.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    res.status(500).json({ message: 'Error al eliminar el pago.', error: error.message });
  }
};

// Verificar un pago específico cambiar el estado a verified
exports.verifyPayment = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await Payment.findByPk(id); 
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    await payment.update({ status: 'verified' });   

    res.status(200).json({ message: 'Pago verificado exitosamente.', payment });
  } catch (error) {
    console.error('Error al verificar el pago:', error);
    res.status(500).json({ message: 'Error al verificar el pago.', error: error.message });
  }
};

// Obtener un pago específico por ID
exports.getPaymentById = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Receipt,
          as: 'receipt',
          attributes: ['id', 'amount', 'status', 'pending_amount', 'credit_balance', 'month', 'year'],
          include: [
            {
              model: require('../models/Property'),
              as: 'property',
              attributes: ['id', 'number', 'block', 'floor', 'type']
            }
          ]
        },
        {
          model: require('../models/Condominium'),
          attributes: ['id', 'name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    // Asegurarse de que los números se envíen correctamente
    const formattedPayment = {
      ...payment.toJSON(),
      amount: parseFloat(payment.amount),
      receipt: payment.receipt ? {
        ...payment.receipt.toJSON(),
        amount: parseFloat(payment.receipt.amount),
        pending_amount: parseFloat(payment.receipt.pending_amount || 0),
        credit_balance: parseFloat(payment.receipt.credit_balance || 0)
      } : null
    };

    res.status(200).json(formattedPayment);
  } catch (error) {
    console.error('Error al obtener el pago:', error);
    res.status(500).json({ message: 'Error al obtener el pago.', error: error.message });
  }
};