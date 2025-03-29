const ReserveFundContribution = require('../models/ReserveFundContribution');
const Condominium = require('../models/Condominium'); 


// crear una contribución de fondo de reserva
exports.createReserveFundContribution = async (req, res) => {
  const { amount, description, date, reserveFundId } = req.body;
  const condominiumId = req.user.condominiumId;

  try {
    const contribution = await ReserveFundContribution.create({ amount, description, date, reserveFundId, condominiumId });
    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la contribución de fondo de reserva.', error });
  }
};

// obtener todas las contribuciones de fondo de reserva
exports.getReserveFundContributions = async (req, res) => {
  try {
    const contributions = await ReserveFundContribution.findAll();
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva.', error });
  }
};


// obtener una contribución de fondo de reserva por id
exports.getReserveFundContributionById = async (req, res) => {
  const { id } = req.params;

  try {
    const contribution = await ReserveFundContribution.findByPk(id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }
    res.status(200).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la contribución de fondo de reserva.', error });
  }
};

// actualizar una contribución de fondo de reserva por id
exports.updateReserveFundContribution = async (req, res) => {
  const { id } = req.params;
  const { amount, description, date, reserveFundId } = req.body;

  try {
    const contribution = await ReserveFundContribution.findByPk(id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }   
    await contribution.update({ amount, description, date, reserveFundId });
    res.status(200).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la contribución de fondo de reserva.', error });
  }
};

// eliminar una contribución de fondo de reserva por id
exports.deleteReserveFundContribution = async (req, res) => {
  const { id } = req.params;

  try {
    const contribution = await ReserveFundContribution.findByPk(id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribución de fondo de reserva no encontrada.' });
    }
    await contribution.update({ status: 'inactive' });
    res.status(200).json({ message: 'Contribución de fondo de reserva eliminada exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la contribución de fondo de reserva.', error });
  }
};

// obtener todas las contribuciones de fondo de reserva de un condominio     
exports.getReserveFundContributionsByCondominium = async (req, res) => {
  //const { condominiumId } = req.params;
  const condominiumId = req.user.condominiumId;

  try {
    const contributions = await ReserveFundContribution.findAll({ where: { condominiumId } });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva del condominio.', error });
  }
};

// obtener todas las contribuciones de fondo de reserva de un condominio por id
exports.getCalculateTotalAmount = async (req, res) => {
  const { id } = req.params;
  const condominiumId = req.user.condominiumId;

  try { const totalAmount = await ReserveFundContribution.sum('amount', { where: { condominiumId } });
    res.status(200).json({ totalAmount });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular el total de la contribución de fondo de reserva.', error });
  }
};

exports.getContributionByFundId = async (req, res) => {
  const { id } = req.params;

  try {
    const contributions = await ReserveFundContribution.findAll({ where: { reserveFundId: id } });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las contribuciones de fondo de reserva por id.', error });
  }
};







