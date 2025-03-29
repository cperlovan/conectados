const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/ReceiptController');

// Crear un nuevo recibo
router.post('/', receiptController.createReceipt);

// Obtener todos los recibos de un usuario específico
router.get('/user/:userId', receiptController.getReceiptsByUser);

// Obtener todos los recibos de un condominio específico
router.get('/condominium/:condominiumId', receiptController.getReceiptsByCondominium);

// Actualizar un recibo específico
router.put('/:id', receiptController.updateReceipt);

// Eliminar un recibo específico
router.delete('/:id', receiptController.deleteReceipt);

// Obtener un recibo específico por ID
router.get('/:id', receiptController.getReceiptById);

module.exports = router;