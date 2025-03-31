const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para crear un nuevo gasto
router.post('/', authenticateToken, expenseController.createExpense);

// Ruta para obtener todos los gastos de un condominio
router.get('/condominium/:condominiumId', authenticateToken, expenseController.getExpensesByCondominium);

// Ruta para obtener todos los gastos de una propiedad
router.get('/property/:propertyId', authenticateToken, expenseController.getExpensesByProperty);

// Ruta para actualizar un gasto
router.put('/:id', authenticateToken, expenseController.updateExpense);

// Ruta para eliminar un gasto
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

// Nueva ruta para obtener la suma de gastos por mes
router.get('/sum', authenticateToken, expenseController.getExpensesSum);

module.exports = router; 