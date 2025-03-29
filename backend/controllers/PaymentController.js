const e = require('express');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
  const { amount, method, receiptId, condominiumId, payment_details, status } = req.body;

  try {
    // Buscar el recibo asociado
    const receipt = await Receipt.findByPk(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }

    // Calcular el saldo pendiente después del pago
    const newPendingAmount = receipt.pending_amount - amount;

    // Determinar el estado del recibo
    let receiptStatus = receipt.status;
    if (newPendingAmount <= 0) {
      receiptStatus = 'paid'; // El recibo está completamente pagado
    } else if (newPendingAmount > 0 && newPendingAmount < receipt.amount) {
      receiptStatus = 'pending'; // El recibo tiene un saldo pendiente
    }

    // Calcular el crédito si el pago excede el monto del recibo
    let creditBalance = parseFloat(receipt.credit_balance); // Convertir a número flotante
    if (newPendingAmount < 0) {
      creditBalance += parseFloat(Math.abs(newPendingAmount).toFixed(2)); // Acumular el excedente como crédito
    }

    // Actualizar el recibo con el nuevo saldo pendiente, estado y crédito
    await receipt.update({
      pending_amount: Math.max(newPendingAmount, 0), // No permitir valores negativos
      status: receiptStatus,
      credit_balance: creditBalance,
    });
    
    // Verificar que el recibo se actualizó correctamente
    console.log('Recibo actualizado:', receipt.toJSON());

    // Crear el registro del pago
    const payment = await Payment.create({
      amount,
      method,
      receiptId,
      condominiumId,
      status,
      userId: receipt.userId, // Asociar el pago al usuario del recibo
      payment_details,
    });

    // Devolver la respuesta
    res.status(201).json({
      message: 'Pago registrado exitosamente.',
      payment,
      receipt: {
        status: receiptStatus,
        pending_amount: Math.max(newPendingAmount, 0),
        credit_balance: creditBalance,
      },
    });
  } catch (error) {
    console.error('Error al registrar el pago:', error); // Registrar el error en la consola
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
          model: require('../models/Receipt'), // Incluir información del recibo
          attributes: ['id', 'amount', 'status', 'dueDate'],
        },
      ],
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos.', error });
  }
};

// Actualizar un pago específico
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const { amount, method, receiptId, payment_details } = req.body;

  try {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    // comparar si el pago es diferente al recibo, de ser así, calcular el credit balance o payment.amount 
    const receipt = await Receipt.findByPk(payment.receiptId);
    const newPendingAmount = payment.amount - amount;
    console.log("newPendingAmount",newPendingAmount)
    // Determinar el estado del recibo
    let receiptStatus = receipt.status;
    if (newPendingAmount <= 0) {
      receiptStatus = 'paid'; // El recibo está completamente pagado
    } else if (newPendingAmount > 0 && newPendingAmount < receipt.amount) {
      receiptStatus = 'pending'; // El recibo tiene un saldo pendiente
    }

    // Calcular el crédito si el pago excede el monto del recibo
    let creditBalance = parseFloat(receipt.credit_balance); // Convertir a número flotante
    if (newPendingAmount < 0) {
      creditBalance += parseFloat(Math.abs(newPendingAmount).toFixed(2)); // Acumular el excedente como crédito
    }

    // Actualizar el recibo con el nuevo saldo pendiente, estado y crédito
    await receipt.update({
      pending_amount: Math.max(newPendingAmount, 0), // No permitir valores negativos
      status: receiptStatus,
      credit_balance: creditBalance,
    });

    // Actualizar los campos necesarios
    payment.amount = amount;
    payment.method = method;
    payment.receiptId = receiptId;
    payment.payment_details = payment_details;
    await payment.save(); 

    res.status(200).json({ message: 'Pago actualizado exitosamente.', payment });
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ message: 'Error al actualizar el pago.', error: error.message });
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