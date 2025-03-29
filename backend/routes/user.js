const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/AuthController');
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', authMiddleware, userController.checkProfile);
router.post('/complete-profile', authMiddleware, userController.completeProfile);
router.get('/condominium/:condominiumId', authMiddleware, userController.getUsersByCondominium);
router.get('/all', authMiddleware, userController.getAllUsers);
router.get('/email/:email', authMiddleware, userController.getUserByEmail);
router.put('/:id', authMiddleware, userController.updateUser);

module.exports = router;