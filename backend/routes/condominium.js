const express = require('express');
const router = express.Router();
const { getAllCondominiums, createCondominium, registerCondominiumWithAdmin, getCondominiumsForSelector, selectorRateLimit } = require('../controllers/CondominiumController');

// Ruta segura para el selector de condominios
router.get('/selector', selectorRateLimit, getCondominiumsForSelector);

// Obtener todos los condominios
router.get('/', getAllCondominiums);

// Crear un nuevo condominio
router.post('/', createCondominium);

// Registrar condominio con administrador
router.post('/register-with-admin', registerCondominiumWithAdmin);

module.exports = router;