//Ojo no está en uso lo unifiqué dentro del middleware de condominiumAccess
const validateCondominiumId = async (req, res, next) => {
  const { condominiumId } = req.params;
  console.log("este es el params de validate condominium id: ", JSON.stringify(req.params));

  const parsedCondominiumId = parseInt(condominiumId, 10);

  if (isNaN(parsedCondominiumId)) {
    return res.status(400).json({ message: 'El ID del condominio no es válido. Debe ser un número.' });
  }

  try {
    const condominium = await Condominium.findByPk(parsedCondominiumId);
    if (!condominium) {
      return res.status(400).json({ message: 'El condominio especificado no existe.' });
    }

    next();
  } catch (error) {
    console.error('Error al validar el condominio:', error);
    res.status(500).json({ message: 'Error interno del servidor al validar el condominio.' });
  }
};

module.exports = validateCondominiumId;