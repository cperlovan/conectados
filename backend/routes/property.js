const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/PropertyController');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para obtener propiedades por condominio
router.get('/condominium/:condominiumId', authenticateToken, propertyController.getPropertiesByCondominium);

// Ruta para obtener propiedades por propietario
router.get('/owner/:ownerId', authenticateToken, propertyController.getPropertiesByOwner);

// Ruta para buscar propiedades
router.get('/search', authenticateToken, propertyController.searchProperties);

// Ruta para obtener una propiedad por ID
router.get('/:id', authenticateToken, propertyController.getPropertyById);

// Ruta para crear una propiedad
router.post('/', authenticateToken, propertyController.createProperty);

// Ruta para actualizar una propiedad
router.put('/:id', authenticateToken, propertyController.updateProperty);

// Ruta para eliminar una propiedad
router.delete('/:id', authenticateToken, propertyController.deleteProperty);

// Ruta para actualizar alícuotas en lote
router.put('/quotas/batch', authenticateToken, propertyController.updateQuotasBatch);

module.exports = router;