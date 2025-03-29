const express = require('express');
const router = express.Router();
const reserveFundController = require('../controllers/ReserveFundController');

// Crear un nuevo fondo de reserva
router.post('/', reserveFundController.createReserveFund);

// Obtener todos los fondos de reserva de un condominio
router.get('/condominium/:condominiumId', reserveFundController.getReserveFundsByCondominium);

// Actualizar un fondo de reserva
router.put('/:id', reserveFundController.updateReserveFund);

// Eliminar lógicamente un fondo de reserva
router.delete('/:id', reserveFundController.deleteReserveFund);

module.exports = router;