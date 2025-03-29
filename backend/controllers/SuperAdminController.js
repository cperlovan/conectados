const User = require('../models/User');
const Condominium = require('../models/Condominium');
const bcrypt = require('bcrypt');

// Listar todos los condominios
const getAllCondominiums = async (req, res) => {
  try {
    const condominiums = await Condominium.findAll({
      include: [{
        model: User,
        attributes: ['id', 'name', 'lastname', 'email', 'role']
      }]
    });

    res.json(condominiums);
  } catch (error) {
    console.error('Error al obtener condominios:', error);
    res.status(500).json({
      message: "Error al obtener la lista de condominios",
      error: error.message
    });
  }
};

// Gestionar superadmins
const createSuperAdmin = async (req, res) => {
  try {
    const { email, password, name, lastname, nic, telephone, movil, address } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "El email ya está registrado"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newSuperAdmin = await User.create({
      email,
      password: hashedPassword,
      name,
      lastname,
      nic,
      telephone,
      movil,
      address,
      role: 'superadmin',
      status: 'active',
      condominiumId: null
    });

    const { password: _, ...superAdminData } = newSuperAdmin.toJSON();
    res.status(201).json({
      message: "Superadmin creado exitosamente",
      user: superAdminData
    });
  } catch (error) {
    console.error('Error al crear superadmin:', error);
    res.status(500).json({
      message: "Error al crear superadmin",
      error: error.message
    });
  }
};

// Listar todos los superadmins
const getAllSuperAdmins = async (req, res) => {
  try {
    const superadmins = await User.findAll({
      where: {
        role: 'superadmin'
      },
      attributes: { 
        exclude: ['password']
      },
      include: [{
        model: Condominium,
        attributes: ['id', 'name']
      }]
    });

    res.json({
      message: "Lista de superadmins obtenida exitosamente",
      superadmins
    });
  } catch (error) {
    console.error('Error al obtener superadmins:', error);
    res.status(500).json({
      message: "Error al obtener la lista de superadmins",
      error: error.message
    });
  }
};

module.exports = {
  getAllCondominiums,
  createSuperAdmin,
  getAllSuperAdmins
}; 