// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require('../models/User');
const { Supplier } = require('../models/Supplier');

const publicRoutes = [
  { path: "/api/auth/login", method: "POST" },
  { path: "/api/auth/register", method: "POST" },
  { path: "/api/condominium/register-with-admin", method: "POST" },
  { path: "api/unauthorized"}
];

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'No autorizado - Usuario no encontrado' });
    }

    // Agregar la información del usuario al objeto request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      condominiumId: user.condominiumId
    };

    // Si el usuario es proveedor o supplier, obtener el supplierId
    if (user.role === 'proveedor' || user.role === 'supplier') {
      try {
        const supplier = await Supplier.findOne({ where: { userId: user.id } });
        if (supplier) {
          req.user.supplierId = supplier.id;
          console.log('SupplierId encontrado para usuario:', user.id, 'ID:', supplier.id);
        } else {
          console.error('No se encontró el proveedor para el usuario:', user.id);
          // No devolvemos un error aquí, solo registramos el problema
          // El controlador específico decidirá cómo manejar la ausencia de supplierId
        }
      } catch (error) {
        console.error('Error al buscar el proveedor:', error);
        // No devolvemos un error aquí, solo registramos el problema
        // El controlador específico decidirá cómo manejar el error
      }
    }

    console.log('Usuario autenticado:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      condominiumId: req.user.condominiumId,
      supplierId: req.user.supplierId
    });

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({ message: 'No autorizado - Token inválido' });
  }
};

module.exports = authMiddleware;