const { Owner, User, Property } = require('../relations');
const { Op } = require('sequelize');

// Obtener un propietario por ID de usuario
const getOwnerByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const owner = await Owner.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        }
      ]
    });

    if (!owner) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }

    res.json(owner);
  } catch (error) {
    console.error('Error al obtener propietario por ID de usuario:', error);
    res.status(500).json({ message: 'Error al obtener propietario', error: error.message });
  }
};

// Obtener un propietario por ID
const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const owner = await Owner.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Property,
          as: 'properties'
        }
      ]
    });

    if (!owner) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }

    res.json(owner);
  } catch (error) {
    console.error('Error al obtener propietario por ID:', error);
    res.status(500).json({ message: 'Error al obtener propietario', error: error.message });
  }
};

// Obtener propietarios por condominio
const getOwnersByCondominium = async (req, res) => {
  try {
    const { condominiumId } = req.params;
    
    const owners = await Owner.findAll({
      where: { 
        condominiumId,
        status: 'active' 
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Property,
          as: 'properties'
        }
      ],
      order: [['fullName', 'ASC']]
    });

    res.json(owners);
  } catch (error) {
    console.error('Error al obtener propietarios por condominio:', error);
    res.status(500).json({ message: 'Error al obtener propietarios', error: error.message });
  }
};

// Crear o actualizar propietario
const createOrUpdateOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const ownerData = req.body;
    
    // Asegurarse de que el userId en el body coincida con el de la URL
    ownerData.userId = parseInt(userId);

    // Buscar si ya existe un propietario para este usuario
    let owner = await Owner.findOne({ where: { userId } });
    let message;

    if (owner) {
      // Actualizar el propietario existente
      await owner.update(ownerData);
      message = 'Propietario actualizado correctamente';
    } else {
      // Crear un nuevo propietario
      owner = await Owner.create(ownerData);
      
      // Actualizar el status del usuario a active si es necesario
      await User.update(
        { status: 'active' },
        { where: { id: userId, status: { [Op.ne]: 'active' } } }
      );
      
      message = 'Propietario creado correctamente';
    }

    res.status(200).json({ message, owner });
  } catch (error) {
    console.error('Error al crear/actualizar propietario:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud', error: error.message });
  }
};

// Eliminar propietario
// Eliminar propietario (borrado suave)
const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const owner = await Owner.findByPk(id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    
    // Cambiar estado a inactivo en lugar de eliminar
    await owner.update({ status: 'inactive' });
    
    res.json({ message: 'Propietario desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar propietario:', error);
    res.status(500).json({ message: 'Error al desactivar propietario', error: error.message });
  }
};

// Actualizar propietario por ID
const updateOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerData = req.body;
    
    // Buscar el propietario por ID
    const owner = await Owner.findByPk(id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    
    // Actualizar los datos del propietario
    await owner.update(ownerData);
    
    // Obtener el propietario actualizado con sus relaciones
    const updatedOwner = await Owner.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Property,
          as: 'properties'
        }
      ]
    });
    
    res.status(200).json({ 
      message: 'Propietario actualizado correctamente',
      owner: updatedOwner
    });
  } catch (error) {
    console.error('Error al actualizar propietario:', error);
    res.status(500).json({ message: 'Error al actualizar propietario', error: error.message });
  }
};

// Buscar propietarios
const searchOwners = async (req, res) => {
  try {
    const { query, condominiumId } = req.query;
    
    if (!query || !condominiumId) {
      return res.status(400).json({ message: 'Se requiere query y condominiumId para la búsqueda' });
    }
    
    const owners = await Owner.findAll({
      where: {
        condominiumId,
        [Op.or]: [
          { fullName: { [Op.iLike]: `%${query}%` } },
          { documentId: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: 10
    });
    
    res.json(owners);
  } catch (error) {
    console.error('Error al buscar propietarios:', error);
    res.status(500).json({ message: 'Error al buscar propietarios', error: error.message });
  }
};

module.exports = {
  getOwnerByUserId,
  getOwnerById,
  getOwnersByCondominium,
  createOrUpdateOwner,
  deleteOwner,
  updateOwnerById,
  searchOwners
}; 