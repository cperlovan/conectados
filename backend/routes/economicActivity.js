const express = require('express');
const router = express.Router();
const economicActivityController = require('../controllers/EconomicActivityController');

// Crear una nueva actividad económica
router.post('/', economicActivityController.createEconomicActivity);

// Obtener todas las actividades económicas
router.get('/', economicActivityController.getAllEconomicActivities);

// Actualizar una actividad económica
router.put('/:id', economicActivityController.updateEconomicActivity);

// Eliminar lógicamente una actividad económica
router.delete('/:id', economicActivityController.deleteEconomicActivity);

module.exports = router;