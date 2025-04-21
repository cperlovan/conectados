const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/SupplierPaymentController');
const authenticateToken = require('../middleware/authMiddleware');

// Función para verificar roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado - Usuario no autenticado' });
    }
    
    // Verificar directamente si el rol del usuario está en la lista de roles permitidos
    // o si el rol es 'proveedor' y 'supplier' está en la lista permitida
    if (roles.includes(req.user.role) || (req.user.role === 'proveedor' && roles.includes('supplier'))) {
      next();
    } else {
      return res.status(403).json({ 
        message: 'No autorizado - No tienes permisos para esta acción'
      });
    }
  };
};

// Obtener todos los pagos a proveedores de un condominio
router.get('/condominium/:condominiumId', 
  authenticateToken,
  checkRole(['admin', 'superadmin']), 
  supplierPaymentController.getSupplierPaymentsByCondominium
);

// Obtener pagos para un proveedor específico
router.get('/supplier/:supplierId', 
  authenticateToken,
  checkRole(['supplier', 'proveedor', 'admin', 'superadmin']),
  supplierPaymentController.getSupplierPaymentsBySupplier
);

// Obtener un pago específico por ID
router.get('/:id', 
  authenticateToken,
  checkRole(['supplier', 'proveedor', 'admin', 'superadmin']), 
  supplierPaymentController.getSupplierPaymentById
);

// Crear un nuevo pago a proveedor
router.post('/', 
  authenticateToken,
  checkRole(['admin', 'superadmin']), 
  supplierPaymentController.createSupplierPayment
);

// Actualizar un pago existente
router.put('/:id', 
  authenticateToken,
  checkRole(['admin', 'superadmin']), 
  supplierPaymentController.updateSupplierPayment
);

// Eliminar un pago (marcar como cancelado)
router.delete('/:id', 
  authenticateToken,
  checkRole(['admin', 'superadmin']), 
  supplierPaymentController.deleteSupplierPayment
);

module.exports = router; 