const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/BudgetController');
const authenticateToken = require('../middleware/authMiddleware');

// Rutas protegidas para presupuestos
router.post('/', authenticateToken, budgetController.createBudget);
router.get('/supplier/:supplierId', authenticateToken, budgetController.getBudgetsBySupplier);
router.get('/condominium/:condominiumId', authenticateToken, budgetController.getBudgetsByCondominium);
router.get('/:id', authenticateToken, budgetController.getBudgetById);
router.put('/:id', authenticateToken, budgetController.updateBudget);
router.delete('/:id', authenticateToken, budgetController.deleteBudget);

module.exports = router; 