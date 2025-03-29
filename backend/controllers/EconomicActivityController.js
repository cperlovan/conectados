const EconomicActivity = require('../models/EconomicActivity');

// Crear una nueva actividad económica
exports.createEconomicActivity = async (req, res) => {
  const { name, description } = req.body;

  try {
    const activity = await EconomicActivity.create({ name, description });
    res.status(201).json({ message: 'Actividad económica creada exitosamente.', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la actividad económica.', error });
  }
};

// Obtener todas las actividades económicas
exports.getAllEconomicActivities = async (req, res) => {
  try {
    const activities = await EconomicActivity.findAll({ where: { status: 'active' } });
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las actividades económicas.', error });
  }
};

// Actualizar una actividad económica
exports.updateEconomicActivity = async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const activity = await EconomicActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad económica no encontrada.' });
    }

    await activity.update({ name, description, status });
    res.status(200).json({ message: 'Actividad económica actualizada exitosamente.', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la actividad económica.', error });
  }
};

// Eliminar lógicamente una actividad económica (cambiar estado a "inactive")
exports.deleteEconomicActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const activity = await EconomicActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad económica no encontrada.' });
    }

    await activity.update({ status: 'inactive' });
    res.status(200).json({ message: 'Actividad económica eliminada.', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la actividad económica.', error });
  }
};