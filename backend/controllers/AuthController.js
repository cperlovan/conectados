const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const validRoles = ['superadmin', 'admin', 'copropietario', 'proveedor', 'ocupante'];

const login = async (req, res) => {
  try {
    const { email, password, condominiumId, role} = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas"
      });
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        message: "Credenciales inválidas"
      });
    }

    // Si es superadmin, no validamos condominiumId
    if (user.role === 'superadmin') {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          condominiumId: null,
          status: user.status,
          authorized: user.authorized
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          condominiumId: null,
          status: user.status,
          authorized: user.authorized
        }
      });
    }

    // Para otros roles, validamos el condominiumId
    //const { role, condominiumId } = req.body;
    if (!role || !condominiumId) {
      return res.status(400).json({
        message: "Se requiere rol y condominio para usuarios no superadmin"
      });
    }

    if (role !== user.role) {
      return res.status(401).json({
        message: "Rol no autorizado para este usuario"
      });
    }

    if (condominiumId !== user.condominiumId) {
      return res.status(401).json({
        message: "Usuario no autorizado para este condominio"
      });
    }

    // Generar token para usuarios normales
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        condominiumId: user.condominiumId,
        status: user.status,
        authorized: user.authorized,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Configurar la cookie en la respuesta
    res.cookie('token', token, {
      httpOnly: true, // Evita que JavaScript acceda a la cookie
      secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
      sameSite: 'lax', // O 'strict' dependiendo de tus necesidades
      maxAge: 24 * 60 * 60 * 1000, // Duración de la cookie (en milisegundos)
      path: '/', // Ruta donde la cookie es válida
    });

    return res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        condominiumId: user.condominiumId,
        status: user.status,
        authorized: user.authorized,
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: "Error al procesar el login",
      error: error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, role, ...userData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios."
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Rol no válido."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...userData,
      email,
      password: hashedPassword,
      role,
      status: 'pending'
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message
    });
  }
};

module.exports = {
  login,
  register
};