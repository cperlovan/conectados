const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para crear una nueva factura
router.post('/', authenticateToken, invoiceController.createInvoice);

// Ruta para obtener todas las facturas de un proveedor
router.get('/supplier/:supplierId', authenticateToken, invoiceController.getInvoicesBySupplier);

// Ruta para obtener todas las facturas de un condominio
router.get('/condominium/:condominiumId', authenticateToken, invoiceController.getInvoicesByCondominium);

// Ruta para obtener una factura específica
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);

// Ruta para actualizar una factura
router.put('/:id', authenticateToken, invoiceController.updateInvoice);

// Ruta para eliminar una factura
router.delete('/:id', authenticateToken, invoiceController.deleteInvoice);

module.exports = router; 