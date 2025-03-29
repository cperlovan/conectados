const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/OwnerController');
const authenticateToken = require('../middleware/authMiddleware');

// Ruta para obtener un propietario por ID de usuario
router.get('/user/:userId', authenticateToken, ownerController.getOwnerByUserId);

// Ruta para crear o actualizar un propietario por ID de usuario
router.post('/user/:userId', authenticateToken, ownerController.createOrUpdateOwner);

// Ruta para actualizar un propietario por ID de usuario (alternativa)
router.put('/user/:userId', authenticateToken, ownerController.createOrUpdateOwner);

// Ruta para obtener un propietario por ID
router.get('/:id', authenticateToken, ownerController.getOwnerById);

// Ruta para actualizar un propietario por ID
router.put('/:id', authenticateToken, ownerController.updateOwnerById);

// Ruta para eliminar un propietario
router.delete('/:id', authenticateToken, ownerController.deleteOwner);

// Ruta para obtener propietarios por condominio
router.get('/condominium/:condominiumId', authenticateToken, ownerController.getOwnersByCondominium);

// Ruta para buscar propietarios
router.get('/search', authenticateToken, ownerController.searchOwners);

module.exports = router; 