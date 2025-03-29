const express = require('express');
const router = express.Router();
const ReserveFundContributionController = require('../controllers/ReserveFundCotributionController');
const Condominium = require('../models/Condominium');



// crear una contribución de fondo de reserva
router.post('/', ReserveFundContributionController.createReserveFundContribution);

// obtener todas las contribuciones de fondo de reserva
router.get('/', ReserveFundContributionController.getReserveFundContributions);

// obtener una contribución de fondo de reserva por id
router.get('/:id', ReserveFundContributionController.getReserveFundContributionById);

// obtener todas las contribuciones de fondo de reserva de un condominio
router.get('/condominium/:id', ReserveFundContributionController.getReserveFundContributionsByCondominium);         

// obtener el total de la contribución de fondo de reserva de un condominio
router.get('/total/:id', ReserveFundContributionController.getCalculateTotalAmount);

// obtener las contribuciones de fondo de reserva por id de fondo de reserva
router.get('/fund/:id', ReserveFundContributionController.getContributionByFundId); 

// eliminar una contribución de fondo de reserva por id
router.delete('/:id', ReserveFundContributionController.deleteReserveFundContribution);

// actualizar una contribución de fondo de reserva por condominioid y id de contribución
router.put('/:id', ReserveFundContributionController.updateReserveFundContribution);

module.exports = router;

