const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para crear una nueva factura
router.post('/', authenticateToken, invoiceController.createInvoice);

// Ruta para obtener todas las facturas según el rol del usuario
router.get('/condominium/:condominiumId', authenticateToken, invoiceController.getInvoices);

// Ruta para obtener facturas por proveedor
router.get('/supplier/:supplierId', authenticateToken, invoiceController.getInvoices);

// Ruta para aprobar/rechazar una factura
router.put('/approve/:id', authenticateToken, invoiceController.approveInvoice);

// Ruta para actualizar una factura
router.put('/:id', authenticateToken, invoiceController.updateInvoice);

// Ruta para eliminar una factura
router.delete('/:id', authenticateToken, invoiceController.deleteInvoice);

// Ruta para obtener una factura específica por ID
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);

module.exports = router; 