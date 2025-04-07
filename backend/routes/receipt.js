const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/ReceiptController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar el middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para recibos
router.post('/', receiptController.createReceipt);
router.get('/user/:userId', receiptController.getReceiptsByUser);
router.get('/condominium/:condominiumId', receiptController.getReceiptsByCondominium);
router.get('/:id', receiptController.getReceiptById);
router.put('/:id', receiptController.updateReceipt);
router.delete('/:id', receiptController.deleteReceipt);
router.post('/toggle-visibility', receiptController.toggleVisibility);

module.exports = router;