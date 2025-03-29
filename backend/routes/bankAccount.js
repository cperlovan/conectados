const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/BankAccountController');

// Crear una nueva cuenta bancaria
router.post('/', bankAccountController.createBankAccount);

// Obtener todas las cuentas bancarias de un condominio
router.get('/condominium/:condominiumId', bankAccountController.getBankAccountsByCondominium);

// Actualizar una cuenta bancaria
router.put('/:id', bankAccountController.updateBankAccount);

// Eliminar lógicamente una cuenta bancaria
router.delete('/:id', bankAccountController.deleteBankAccount);

module.exports = router;