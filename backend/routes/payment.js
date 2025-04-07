const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Crear un nuevo pago
router.post('/', paymentController.createPayment);

// Obtener todos los pagos de un recibo específico
router.get('/receipt/:receiptId', paymentController.getPaymentsByReceipt);

// Obtener todos los pagos de un condominio específico
router.get('/condominium/:condominiumId', paymentController.getPaymentsByCondominium);

// Actualizar un pago específico
router.put('/:id', paymentController.updatePayment);

// Verificar un pago específico cambiar el estado a verified
router.put('/verify/:id', paymentController.verifyPayment);

// Eliminar un pago específico
router.delete('/:id', paymentController.deletePayment);

// Obtener un pago específico por ID
router.get('/:id', paymentController.getPaymentById);

module.exports = router;