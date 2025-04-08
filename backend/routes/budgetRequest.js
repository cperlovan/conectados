const express = require('express');
const router = express.Router();
const budgetRequestController = require('../controllers/BudgetRequestController');
const authenticateToken = require('../middleware/authMiddleware');

// Crear una nueva solicitud de presupuesto
router.post('/', authenticateToken, budgetRequestController.createBudgetRequest);

// Obtener solicitudes de presupuesto por condominio
router.get('/condominium/:condominiumId', authenticateToken, budgetRequestController.getBudgetRequestsByCondominium);

// Obtener solicitudes de presupuesto por proveedor
router.get('/supplier', authenticateToken, budgetRequestController.getBudgetRequestsBySupplier);

// Obtener una solicitud de presupuesto por ID
router.get('/:id', authenticateToken, budgetRequestController.getBudgetRequestById);

// Actualizar el estado de una solicitud de presupuesto
router.put('/:id/status', authenticateToken, budgetRequestController.updateBudgetRequestStatus);

// Eliminar una solicitud de presupuesto
router.delete('/:id', authenticateToken, budgetRequestController.deleteBudgetRequest);

module.exports = router; 