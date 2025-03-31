const express = require('express');
const router = express.Router();
const reserveFundWithdrawalController = require('../controllers/ReserveFundWithdrawalController');
const auth = require('../middleware/auth');

// Ruta para crear un retiro
router.post('/', auth, reserveFundWithdrawalController.createWithdrawal);

// Ruta para obtener todos los retiros de un fondo específico
router.get('/fund/:fundId', auth, reserveFundWithdrawalController.getWithdrawalsByFund);

// Ruta para obtener un retiro por su ID
router.get('/:id', auth, reserveFundWithdrawalController.getWithdrawalById);

// Ruta para cancelar un retiro
router.put('/:id/cancel', auth, reserveFundWithdrawalController.cancelWithdrawal);

// Ruta para obtener todos los retiros de un condominio
router.get('/condominium/:condominiumId', auth, reserveFundWithdrawalController.getWithdrawalsByCondominium);

module.exports = router; 