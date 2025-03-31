const { Property, Owner, User } = require('../relations');
const { Op } = require('sequelize');

// Obtener propiedades por condominio
const getPropertiesByCondominium = async (req, res) => {
  try {
    const { condominiumId } = req.params;
    
    const properties = await Property.findAll({
      where: { condominiumId },
      include: [
        {
          model: Owner,
          as: 'owner',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        }
      ],
      order: [['number', 'ASC']]
    });

    res.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    res.status(500).json({ message: 'Error al obtener propiedades', error: error.message });
  }
};

// Obtener propiedades por propietario
const getPropertiesByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const properties = await Property.findAll({
      where: { ownerId },
      order: [['number', 'ASC']]
    });

    res.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades del propietario:', error);
    res.status(500).json({ message: 'Error al obtener propiedades', error: error.message });
  }
};

// Obtener una propiedad por ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findByPk(id, {
      include: [
        {
          model: Owner,
          as: 'owner',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        }
      ]
    });

    if (!property) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    res.status(500).json({ message: 'Error al obtener propiedad', error: error.message });
  }
};

// Crear una propiedad
const createProperty = async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Verificar si ya existe una propiedad con el mismo número en el mismo condominio
    const existingProperty = await Property.findOne({
      where: { 
        number: propertyData.number,
        condominiumId: propertyData.condominiumId
      }
    });

    if (existingProperty) {
      return res.status(400).json({ 
        message: 'Ya existe una propiedad con ese número en este condominio' 
      });
    }
    
    // Verificar que el propietario (Owner) existe y pertenece al mismo condominio
    const owner = await Owner.findOne({
      where: {
        id: propertyData.ownerId,
        condominiumId: propertyData.condominiumId
      }
    });
    
    if (!owner) {
      return res.status(400).json({ 
        message: 'El propietario seleccionado no existe o no pertenece al mismo condominio' 
      });
    }
    
    console.log(`Creando propiedad con Owner ID: ${propertyData.ownerId}, condominio ID: ${propertyData.condominiumId}`);

    const property = await Property.create(propertyData);
    
    res.status(201).json({ 
      message: 'Propiedad creada correctamente', 
      property 
    });
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    res.status(500).json({ message: 'Error al crear propiedad', error: error.message });
  }
};

// Actualizar una propiedad
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;
    
    const property = await Property.findByPk(id);
    
    if (!property) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    // Verificar si ya existe otra propiedad con el mismo número en el mismo condominio
    if (propertyData.number && property.number !== propertyData.number) {
      const existingProperty = await Property.findOne({
        where: { 
          number: propertyData.number,
          condominiumId: property.condominiumId,
          id: { [Op.ne]: id }
        }
      });

      if (existingProperty) {
        return res.status(400).json({ 
          message: 'Ya existe otra propiedad con ese número en este condominio' 
        });
      }
    }

    await property.update(propertyData);
    
    res.json({ 
      message: 'Propiedad actualizada correctamente', 
      property 
    });
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({ message: 'Error al actualizar propiedad', error: error.message });
  }
};

// Eliminar una propiedad
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findByPk(id);
    
    if (!property) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }
    
    await property.destroy();
    
    res.json({ message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({ message: 'Error al eliminar propiedad', error: error.message });
  }
};

// Buscar propiedades
const searchProperties = async (req, res) => {
  try {
    const { query, condominiumId } = req.query;
    
    if (!query || !condominiumId) {
      return res.status(400).json({ message: 'Se requiere query y condominiumId para la búsqueda' });
    }
    
    const properties = await Property.findAll({
      where: {
        condominiumId,
        number: { [Op.iLike]: `%${query}%` }
      },
      include: [
        {
          model: Owner,
          as: 'owner',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        }
      ],
      limit: 10
    });
    
    res.json(properties);
  } catch (error) {
    console.error('Error al buscar propiedades:', error);
    res.status(500).json({ message: 'Error al buscar propiedades', error: error.message });
  }
};

/**
 * Actualiza las alícuotas de múltiples propiedades en lote
 */
const updateQuotasBatch = async (req, res) => {
  try {
    const { properties, condominiumId } = req.body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ message: 'La lista de propiedades es requerida y debe ser un array no vacío' });
    }

    if (!condominiumId) {
      return res.status(400).json({ message: 'El ID del condominio es requerido' });
    }

    // Verificar que el usuario tenga acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId !== condominiumId) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar propiedades de este condominio' });
    }

    const updatePromises = properties.map(async (prop) => {
      if (!prop.id) {
        return null;
      }

      // Buscar la propiedad para asegurarse de que existe y pertenece al condominio especificado
      const property = await Property.findOne({ 
        where: { 
          id: prop.id,
          condominiumId 
        }
      });

      if (!property) {
        return null;
      }

      // Actualizar tanto el campo participationQuota como el campo aliquot para mantener consistencia
      return property.update({ 
        participationQuota: prop.participationQuota,
        aliquot: prop.participationQuota // Actualizar también el campo aliquot para mantener consistencia
      });
    });

    const results = await Promise.all(updatePromises);
    const updatedProperties = results.filter(result => result !== null);

    return res.status(200).json({
      message: `${updatedProperties.length} propiedades actualizadas correctamente`,
      updatedCount: updatedProperties.length
    });
  } catch (error) {
    console.error('Error al actualizar alícuotas en lote:', error);
    return res.status(500).json({ message: 'Error al actualizar alícuotas en lote', error: error.message });
  }
};

module.exports = {
  getPropertiesByCondominium,
  getPropertiesByOwner,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
  updateQuotasBatch
};