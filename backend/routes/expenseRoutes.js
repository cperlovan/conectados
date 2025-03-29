const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');

// Crear un nuevo gasto
router.post('/', expenseController.createExpense);

// Obtener todos los gastos de un condominio
router.get('/condominium/:condominiumId', expenseController.getExpensesByCondominium);

// Obtener todos los gastos de una propiedad (OJO NO VEO GASTOS POR PROPERTY)
router.get('/property/:propertyId', expenseController.getExpensesByProperty);

// Actualizar un gasto
router.put('/:id', expenseController.updateExpense);

// Eliminar lógicamente un gasto
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;