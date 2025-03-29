const express = require('express');
const router = express.Router();
const { getAllCondominiums, createCondominium, registerCondominiumWithAdmin } = require('../controllers/CondominiumController');

// Obtener todos los condominios
router.get('/', getAllCondominiums);

// Crear un nuevo condominio
router.post('/', createCondominium);

// Registrar condominio con administrador
router.post('/register-with-admin', registerCondominiumWithAdmin);

module.exports = router;