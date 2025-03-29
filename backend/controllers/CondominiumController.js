
const Condominium = require('../models/Condominium');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Obtener todos los condominios
exports.getAllCondominiums = async (req, res) => {
  try {
    const condominiums = await Condominium.findAll();
    res.status(200).json(condominiums);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los condominios', error });
  }
};

// Crear un nuevo condominio
exports.createCondominium = async (req, res) => {
  const { name, towerId } = req.body;

  try {
    const newCondominium = await Condominium.create({ name, towerId });
    res.status(201).json({ message: 'Condominio creado exitosamente', condominium: newCondominium });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el condominio', error });
  }
};

// Registrar condominio con su administrador
exports.registerCondominiumWithAdmin = async (req, res) => {
  const {
    // Datos del condominio
    name,
    type,
    rif,
    address,
    phone,
    email: condominiumEmail,
    currency,
    timezone,
    description,
    rules,
    settings,
    // Datos del administrador
    adminName,
    adminLastname,
    adminAddress,
    adminNic,
    adminTelephone,
    adminMovil,
    adminEmail,
    adminPassword
  } = req.body;

  try {
    // Iniciar transacción
    const result = await sequelize.transaction(async (t) => {
      // 1. Crear el condominio
      const condominium = await Condominium.create({
        name,
        type,
        rif,
        address,
        phone,
        email: condominiumEmail,
        currency,
        timezone,
        description,
        rules,
        settings,
        status: 'active'
      }, { transaction: t });

      // 2. Crear el usuario administrador
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await User.create({
        name: adminName,
        lastname: adminLastname,
        address: adminAddress,
        nic: adminNic,
        telephone: adminTelephone,
        movil: adminMovil,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        condominiumId: condominium.id,
        authorized: true
      }, { transaction: t });

      return { condominium, admin };
    });

    res.status(201).json({
      message: 'Condominio y administrador registrados exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({
      message: 'Error al registrar el condominio y el administrador',
      error: error.message
    });
  }
};

const publicRoutes = [
  {
    path: "^/?$",
    method: "GET"
  },
  {
    path: "^/api/auth/login/?$",
    method: "POST"
  },
  {
    path: "^/api/auth/register/?$",
    method: "POST"
  },
  {
    path: "^/api/condominium/register-with-admin/?$",
    method: "POST"
  }
];

const authenticateToken = (req, res, next) => {
  console.log('\n=== Inicio de Autenticación ===');
  const fullPath = req.baseUrl + req.path;
  console.log('Ruta actual:', fullPath);
  console.log('Método:', req.method);

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some((route) => {
    const pathRegex = new RegExp(route.path);
    const matches = pathRegex.test(fullPath);
    console.log(`Comprobando ruta ${fullPath} contra ${route.path}: ${matches}`);
    return matches && req.method === route.method;
  });

  console.log('¿Es ruta pública?:', isPublicRoute);

  if (isPublicRoute) {
    console.log('Ruta pública, continuando...');
    return next();
  }

  console.log('Ruta protegida, verificando token...');

  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.user = user;
    next();
  });
};

exports.checkProfile = async (req, res) => {
  try {
    console.log('=== checkProfile iniciado ===');
    console.log('Request user:', req.user);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: "No autorizado - ID de usuario no encontrado en el token",
        debug: { 
          user: req.user,
          headers: req.headers 
        }
      });
    }

    const userId = req.user.id;
    console.log('Buscando usuario con ID:', userId);

    const user = await User.findByPk(userId);
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user) {
      return res.status(404).json({ 
        message: "Usuario no encontrado",
        debug: { userId }
      });
    }

    console.log('Datos del usuario:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name,
      lastname: user.lastname
    });

    // Verificar si los campos requeridos están completos
    const isProfileComplete = !!(
      user.name &&
      user.lastname &&
      user.address &&
      user.nic &&
      user.telephone &&
      user.movil
    );

    console.log('¿Perfil completo?:', isProfileComplete);

    // Si el perfil no está completo y el estado es pending, incluir mensaje adicional
    const response = {
      isProfileComplete,
      requiresCompletion: user.status === 'pending',
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        status: user.status,
        address: user.address,
        nic: user.nic,
        telephone: user.telephone,
        movil: user.movil
      }
    };

    console.log('Enviando respuesta:', response);
    res.json(response);

  } catch (error) {
    res.status(500).json({ message: 'Error al verificar el perfil', error: error.message });
  }
};
