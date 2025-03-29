const Condominium = require('../models/Condominium');

const checkCondominiumAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const condominiumId = parseInt(req.params.condominiumId || req.body.condominiumId);

    // Si es superadmin, permitir acceso a cualquier condominio
    if (user.role === 'superadmin') {
      return next();
    }

    //verificar la existencia del condominiumId
    const condominium = await Condominium.findByPk(condominiumId);
    if (!condominium) {
      return res.status(400).json({ message: 'El condominio especificado no existe.' });
    }


    // Para otros roles, exigir condominiumId
    if (!user.condominiumId) {
      return res.status(403).json({
        message: 'Usuario no asociado a un condominio'
      });
    }

    // Verificar que el usuario solo acceda a su condominio
    if (user.condominiumId !== condominiumId) {
      return res.status(403).json({
        message: 'No tiene acceso a este condominio'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error al verificar acceso al condominio',
      error: error.message
    });
  }
};

module.exports = { checkCondominiumAccess }; 