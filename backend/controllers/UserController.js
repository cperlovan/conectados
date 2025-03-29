const bcrypt = require('bcryptjs');
const User = require('../models/User');

const userController = {
    // Funciones existentes
    registerUser: async (req, res) => {
        const { name, email, password, role, condominiumId } = req.body;
    
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ 
                name, 
                email, 
                password: hashedPassword, 
                role, 
                condominiumId,
                status: 'pending'
            });
            res.status(201).json({ message: 'Usuario registrado exitosamente.', user });
        } catch (error) {
            res.status(500).json({ message: 'Error al registrar usuario.', error });
        }
    },

    getUsersByCondominium: async (req, res) => {
        const { condominiumId } = req.params;
      
        try {
            const users = await User.findAll({ where: { condominiumId } });
            console.log(users);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener los usuarios.', error });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ message: 'Error al obtener todos los usuarios.', error: error.message });
        }
    },

    // Verificar si el perfil está completo
    checkProfile: async (req, res) => {
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

            const response = {
                isProfileComplete,
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
            console.error("Error al verificar perfil:", error);
            console.error("Stack:", error.stack);
            res.status(500).json({ 
                message: "Error al verificar el perfil",
                error: error.message,
                stack: error.stack
            });
        }
    },

    // Completar el perfil
    completeProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                name,
                lastname,
                address,
                nic,
                telephone,
                movil
            } = req.body;

            // Validar campos requeridos
            if (!name || !lastname || !address || !nic || !telephone || !movil) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }

            // Actualizar el usuario
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            await user.update({
                name,
                lastname,
                address,
                nic,
                telephone,
                movil,
                status: 'active' // Actualizamos el estado a active cuando complete el perfil
            });

            res.json({ 
                message: "Perfil actualizado exitosamente",
                user: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    address: user.address,
                    nic: user.nic,
                    telephone: user.telephone,
                    movil: user.movil,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            });
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            res.status(500).json({ message: "Error al actualizar el perfil", error: error.message });
        }
    },

    createSuperAdmin: async (req, res) => {
        try {
            // Verificar que quien hace la petición es superadmin
            if (req.user.role !== 'superadmin') {
                return res.status(403).json({
                    message: 'No autorizado para crear superadmins'
                });
            }

            const {
                name,
                lastname,
                email,
                password,
                nic,
                telephone,
                movil,
                address
            } = req.body;

            const hashedPassword = await bcrypt.hash(password, 10);

            const superAdmin = await User.create({
                name,
                lastname,
                email,
                password: hashedPassword,
                nic,
                telephone,
                movil,
                address,
                role: 'superadmin',
                status: 'active'
            });

            const { password: _, ...superAdminData } = superAdmin.toJSON();

            res.status(201).json({
                message: 'Superadmin creado exitosamente',
                user: superAdminData
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al crear superadmin',
                error: error.message
            });
        }
    },

    getUserByEmail: async (req, res) => {
        try {
          const { email } = req.params;
          const user = await User.findOne({ where: { email } });
          
          if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
          }
          
          res.json(user);
        } catch (error) {
          console.error('Error al buscar usuario por email:', error);
          res.status(500).json({ message: 'Error al buscar el usuario' });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            await user.update(updateData);
            res.json({ message: 'Usuario actualizado exitosamente', user });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ message: 'Error al actualizar el usuario' });
        }
    },
};

module.exports = userController; 