const express = require('express');
const router = express.Router();
const SuperAdminController = require('../controllers/SuperAdminController');
const auth = require('../middleware/auth');
const isSuperAdmin = require('../middleware/isSuperAdmin');

// Agregamos este console.log para ver qué contiene SuperAdminController
//console.log('Contenido del SuperAdminController:', SuperAdminController);

// // Ruta de prueba simple
// router.get('/test', (req, res) => {
//   res.json({ message: 'Test route working' });
// });

// Rutas
router.get('/condominiums', auth, isSuperAdmin, SuperAdminController.getAllCondominiums);
router.get('/superadmins', auth, isSuperAdmin, SuperAdminController.getAllSuperAdmins);
router.post('/create-superadmin', auth, isSuperAdmin, SuperAdminController.createSuperAdmin);

module.exports = router; 