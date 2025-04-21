const { Supplier, SupplierCondominiums, SupplierEconomicActivity } = require("../models/Supplier");
const EconomicActivity = require("../models/EconomicActivity");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Condominium = require("../models/Condominium");

// Crear un nuevo proveedor
const createSupplier = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      lastname,
      nic,
      telephone,
      movil,
      address,
      type,
      contactInfo,
      condominiums,
      economicActivities,
    } = req.body;

    // Obtener el condominiumId del usuario que crea el proveedor
    const { condominiumId } = req.user;
    if (!condominiumId) {
      return res.status(400).json({
        message: "No se pudo determinar el condominio del proveedor",
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "El email ya está registrado",
      });
    }

    // Crear el usuario
    const user = await User.create({
      email,
      password: await bcrypt.hash(password, 10),
      name,
      lastname,
      nic,
      telephone,
      movil,
      address,
      role: "proveedor",
      status: "active",
      condominiumId // Asignar el mismo condominiumId al usuario
    });

    // Determinar el nombre del proveedor
    let supplierName;
    if (contactInfo && contactInfo.companyName) {
      // Si se proporciona un nombre de empresa, usarlo
      supplierName = contactInfo.companyName;
    } else {
      // Si no se proporciona un nombre de empresa, usar el nombre del usuario
      supplierName = `${name} ${lastname}`;
    }

    // Crear el proveedor
    const supplier = await Supplier.create({
      userId: user.id,
      name: supplierName, // Nombre de la empresa o nombre del usuario
      type,
      contactInfo,
      condominiumId // Mantener el condominiumId para compatibilidad con código existente
    });

    // Asociar con condominios a través de la relación many-to-many
    if (condominiums && condominiums.length > 0) {
      await supplier.addCondominiums(condominiums);
    } else {
      // Si no se proporcionan condominios, asociar con el condominio del usuario
      await supplier.addCondominiums([condominiumId]);
    }

    // Asociar actividades económicas
    if (economicActivities && economicActivities.length > 0) {
      await supplier.addEconomicActivities(economicActivities);
    }

    // Obtener el proveedor con todas sus relaciones
    const supplierWithRelations = await Supplier.findByPk(supplier.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status"],
        },
        {
          model: EconomicActivity,
          attributes: ["id", "name", "description"],
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ],
    });

    res.status(201).json({
      message: "Proveedor registrado exitosamente",
      supplier: supplierWithRelations,
    });
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({
      message: "Error al registrar el proveedor",
      error: error.message,
    });
  }
};

//registrar proveedor por parte del administrador



// Obtener todos los proveedores
const getAllSuppliers = async (req, res) => {
  try {
    const { role, condominiumId } = req.user;
    
    // Configurar las opciones de la consulta
    const queryOptions = {
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status"],
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ]
    };
    
    // Si no es superadmin, filtrar por condominio
    if (role !== 'superadmin') {
      queryOptions.include[2].where = { id: condominiumId };
      queryOptions.include[2].required = true;
    }
    
    const suppliers = await Supplier.findAll(queryOptions);
    
    // Formatear la respuesta para consistencia
    const formattedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      type: supplier.type,
      contactInfo: supplier.contactInfo || {},
      status: supplier.status || 'active',
      User: supplier.User,
      economicActivities: supplier.EconomicActivities || [],
      condominiums: supplier.Condominiums || []
    }));
    
    res.json(formattedSuppliers);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener proveedores",
      error: error.message,
    });
  }
};

// Obtener proveedores por condominio
const getSuppliersByCondominium = async (req, res) => {
  try {
    const { condominiumId } = req.params;
    const { role } = req.user;

    // Verificar si el usuario tiene acceso al condominio
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({
        message: 'No tiene permisos para acceder a esta información'
      });
    }

    console.log(`Buscando proveedores para el condominio: ${condominiumId}`);

    // Obtener el condominio
    const condominium = await Condominium.findByPk(condominiumId);
    if (!condominium) {
      return res.status(404).json({
        message: 'Condominio no encontrado'
      });
    }

    // Usar la relación many-to-many para obtener proveedores asociados al condominio
    const suppliers = await Supplier.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'status']
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        },
        {
          model: Condominium,
          through: { attributes: [] },
          where: { id: condominiumId },
          required: true // Asegura que solo devuelva proveedores asociados a este condominio
        }
      ]
    });

    console.log(`Proveedores encontrados: ${suppliers.length}`);

    // Formatear la respuesta con información completa
    const formattedSuppliers = suppliers.map(supplier => {
      // Extraer contactInfo del proveedor
      const contactInfo = supplier.contactInfo || {};
      
      return {
        id: supplier.id,
        name: supplier.name,
        type: supplier.type,
        contactInfo: contactInfo,
        status: supplier.status || 'active',
        User: supplier.User,
        economicActivities: supplier.EconomicActivities || [],
        // Incluir la información más relevante para la vista de listado
        contact: {
          name: contactInfo.name || supplier.User?.name || '',
          lastname: contactInfo.lastname || supplier.User?.lastname || '',
          email: contactInfo.email || supplier.User?.email || '',
          phone: contactInfo.phone || '',
          address: contactInfo.address || '',
          companyName: contactInfo.companyName || ''
        }
      };
    });

    console.log('Proveedores formateados:', JSON.stringify(formattedSuppliers, null, 2));

    res.json(formattedSuppliers);
  } catch (error) {
    console.error('Error al obtener proveedores por condominio:', error);
    res.status(500).json({
      message: 'Error al obtener proveedores por condominio',
      error: error.message
    });
  }
};

// Obtener actividades de un proveedor
const getActivitiesBySupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id, {
      include: [{
        model: EconomicActivity,
        attributes: ['id', 'name', 'description', 'status'],
        through: {
          attributes: ['status'], // Incluye el estado de la relación
        }
      }]
    });

    if (!supplier) {
      return res.status(404).json({
        message: 'Proveedor no encontrado'
      });
    }

    res.status(200).json({
      message: 'Actividades económicas obtenidas exitosamente',
      activities: supplier.EconomicActivities
    });

  } catch (error) {
    console.error('Error al obtener las actividades económicas:', error);
    res.status(500).json({
      message: 'Error al obtener las actividades económicas',
      error: error.message
    });
  }
};

// Obtener proveedor por ID de usuario
const getSupplierByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Buscando proveedor para usuario:', userId);

    const supplier = await Supplier.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'status'],
        },
        {
          model: EconomicActivity,
          through: { attributes: [] },
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ],
    });

    if (!supplier) {
      console.log('No se encontró perfil de proveedor para el usuario:', userId);
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    console.log('Perfil de proveedor encontrado:', supplier);
    res.json(supplier);
  } catch (error) {
    console.error('Error al buscar proveedor:', error);
    res.status(500).json({ message: 'Error al buscar el proveedor' });
  }
};

// Controlador para completar el perfil de proveedor
const completeProfile = async (req, res) => {
  try {
    const user = req.user;

    // Verificar si el usuario ya tiene un perfil de proveedor
    const existingSupplier = await Supplier.findOne({
      where: { userId: user.id },
    });
    if (existingSupplier) {
      return res.status(400).json({
        message: "Ya has completado tu perfil de proveedor.",
      });
    }

    // Extraer los datos del cuerpo de la solicitud
    const { name, type, contactInfo, economicActivities } = req.body;

    // Validar que se proporcionen los datos necesarios
    if (!name || !type || !contactInfo || !economicActivities) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios.",
      });
    }

    // Validar que contactInfo contenga name y lastname
    if (!contactInfo.name || !contactInfo.lastname) {
      return res.status(400).json({
        message:
          "Los campos 'name' y 'lastname' en contactInfo son obligatorios.",
      });
    }

    // Validar que las actividades económicas existan
    const activities = await EconomicActivity.findAll({
      where: { id: economicActivities },
    });
    if (activities.length !== economicActivities.length) {
      return res.status(400).json({
        message: "Una o más actividades económicas no existen.",
      });
    }

    // Crear el proveedor
    const supplier = await Supplier.create({
      userId: user.id,
      name: `${contactInfo.name} ${contactInfo.lastname}`, // Concatenar name y lastname
      type,
      contactInfo: {
        ...contactInfo,
        email: user.email
      },
      condominiumId: user.condominiumId, // Obtener condominio del usuario autenticado
    });

    // Asociar actividades económicas
    if (economicActivities && economicActivities.length > 0) {
      await supplier.addEconomicActivities(economicActivities);
    }

    // Crear la relación en la tabla SupplierCondominiums directamente
    await SupplierCondominiums.create({
      supplierId: supplier.id,
      condominiumId: user.condominiumId,
      status: 'active'
    });

    try {
      // Actualizar datos en la tabla Users con mejor manejo de errores
      console.log('Intentando actualizar usuario con ID:', user.id);
      console.log('Datos para actualizar:', {
        name: contactInfo.name || user.name,
        lastname: contactInfo.lastname || user.lastname,
        telephone: contactInfo.phone || user.telephone, // Nota: el campo en contactInfo es 'phone', en User es 'telephone'
        movil: contactInfo.movil || user.movil,
        address: contactInfo.address || user.address,
        status: "active"
      });
      
      const [updatedRows] = await User.update(
        {
          name: contactInfo.name || user.name,
          lastname: contactInfo.lastname || user.lastname,
          telephone: contactInfo.phone || user.telephone,
          movil: contactInfo.movil || user.movil,
          address: contactInfo.address || user.address,
          status: "active", // Cambiar el estado a 'active'
        },
        { 
          where: { id: user.id },
          returning: true
        }
      );
      
      console.log('Filas actualizadas en Users:', updatedRows);
      
      if (updatedRows === 0) {
        console.warn('No se actualizó ningún usuario. Posible problema con la cláusula WHERE o con la integridad de los datos.');
      }
    } catch (userUpdateError) {
      // Solo registrar el error pero continuar con la respuesta
      console.error('Error al actualizar datos de usuario:', userUpdateError);
    }

    // Obtener el usuario actualizado para la respuesta
    const updatedUser = await User.findByPk(user.id);

    res.status(201).json({
      message: "Perfil de proveedor completado exitosamente.",
      supplier,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        telephone: updatedUser.telephone,
        address: updatedUser.address,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error("Error al completar perfil de proveedor:", error);
    res.status(500).json({
      message: "Error al completar el perfil de proveedor",
      error: error.message,
    });
  }
};

// Actualizar un proveedor
const updateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { 
      name, 
      type, 
      status, 
      contactInfo, 
      economicActivities,
      userData // Nuevo campo para los datos del usuario
    } = req.body;
    const { condominiumId } = req.user;

    console.log('Datos recibidos:', { 
      supplierId, 
      name, 
      type, 
      status, 
      contactInfo, 
      economicActivities,
      userData
    });

    // Verificar si el proveedor existe
    const supplier = await Supplier.findByPk(supplierId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'telephone', 'movil', 'address', 'status', 'nic']
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }

    // Verificar que el proveedor pertenezca al mismo condominio que el usuario
    if (supplier.condominiumId !== condominiumId) {
      return res.status(403).json({ message: 'No tiene permisos para actualizar este proveedor.' });
    }

    // Validar que se proporcionen los datos necesarios
    if (!name || !type) {
      return res.status(400).json({
        message: 'El nombre y tipo son campos obligatorios.'
      });
    }

    // Actualizar datos del proveedor (empresa/emprendimiento)
    await supplier.update({
      name,
      type,
      status: status || 'active',
      contactInfo // Actualiza el objeto JSON completo
    });

    // Actualizar datos del usuario (persona) si se proporcionaron
    if (userData) {
      await User.update(
        {
          name: userData.name,
          lastname: userData.lastname,
          telephone: userData.telephone,
          movil: userData.movil,
          address: userData.address,
          nic: userData.nic
          // No actualizamos el email porque es el identificador del usuario
        },
        { where: { id: supplier.userId } }
      );
    }

    // Actualizar actividades económicas si se proporcionaron
    if (economicActivities && Array.isArray(economicActivities)) {
      // Eliminar todas las relaciones existentes
      await supplier.setEconomicActivities([]);
      // Agregar las nuevas relaciones
      await supplier.addEconomicActivities(economicActivities);
    }

    // Obtener el proveedor actualizado con todas sus relaciones
    const updatedSupplier = await Supplier.findByPk(supplier.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'telephone', 'movil', 'address', 'status', 'nic']
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        }
      ]
    });

    // Formatear la respuesta
    const formattedSupplier = {
      id: updatedSupplier.id,
      name: updatedSupplier.name,
      type: updatedSupplier.type,
      status: updatedSupplier.status,
      contactInfo: updatedSupplier.contactInfo || {},
      User: updatedSupplier.User,
      economicActivities: updatedSupplier.EconomicActivities || []
    };

    res.json({
      message: 'Proveedor actualizado exitosamente.',
      supplier: formattedSupplier
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      message: 'Error al actualizar el proveedor',
      error: error.message
    });
  }
};

// Eliminar lógicamente un proveedor
const deleteSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Verificar si el proveedor existe
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }

    // Cambiar el estado del usuario asociado a "inactive"
    await User.update(
      { status: "inactive" },
      { where: { id: supplier.userId } }
    );

    // Opcional: Cambiar el estado del proveedor a "inactive" si hay un campo similar
    await supplier.update({ status: "inactive" });

    res.json({
      message: "Proveedor eliminado exitosamente.",
    });
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({
      message: "Error al eliminar el proveedor",
      error: error.message,
    });
  }
};

// Registro manual de proveedor por parte del administrador
const adminRegister = async (req, res) => {
  try {
    const {
      userId,
      name,
      type,
      contactInfo,
      userData, // Datos del usuario (persona)
      economicActivities
    } = req.body;

    // Obtener el condominiumId del administrador que registra el proveedor
    const { condominiumId } = req.user;
    if (!condominiumId) {
      return res.status(400).json({
        message: "No se pudo determinar el condominio del proveedor",
      });
    }

    console.log("Datos recibidos:", { userId, name, type, contactInfo, userData, economicActivities, condominiumId });

    // Buscar el usuario existente por ID
    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      return res.status(404).json({
        message: "El usuario no existe. Debe registrarse primero en el sistema."
      });
    }

    // Verificar que el usuario tenga el rol de proveedor
    if (existingUser.role !== "proveedor") {
      return res.status(400).json({
        message: "El usuario no tiene el rol de proveedor."
      });
    }

    console.log("Usuario encontrado:", existingUser.toJSON());

    // Actualizar los datos del usuario (persona)
    if (userData) {
      const userUpdateData = {
        name: userData.name,
        lastname: userData.lastname,
        telephone: userData.telephone,
        movil: userData.movil,
        address: userData.address,
        nic: userData.nic,
        status: "active",
        authorized: true,
        condominiumId // Asignar el mismo condominiumId al usuario
      };

      console.log("Datos a actualizar del usuario:", userUpdateData);
      await existingUser.update(userUpdateData);
    }

    // Verificar si ya existe un proveedor para este usuario
    const existingSupplier = await Supplier.findOne({ where: { userId } });
    if (existingSupplier) {
      return res.status(400).json({
        message: "Este usuario ya tiene un perfil de proveedor registrado"
      });
    }

    // Crear el proveedor (empresa/emprendimiento)
    const supplierData = {
      userId,
      name, // Ya está formateado correctamente: nombre de empresa o combinación de nombre/apellido
      type,
      contactInfo, // Datos de contacto de la empresa
      condominiumId // Mantener el condominiumId para compatibilidad
    };

    console.log("Datos a enviar al backend para crear proveedor:", supplierData);
    const supplier = await Supplier.create(supplierData);

    // Asociar con el condominio a través de la relación many-to-many
    await supplier.addCondominiums([condominiumId]);

    // Asociar actividades económicas
    if (economicActivities && economicActivities.length > 0) {
      await supplier.addEconomicActivities(economicActivities);
    }

    // Obtener el proveedor con todas sus relaciones
    const supplierWithRelations = await Supplier.findByPk(supplier.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status", "telephone", "movil", "address", "nic"],
        },
        {
          model: EconomicActivity,
          attributes: ["id", "name", "description"],
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ],
    });

    res.status(201).json({
      message: "Proveedor registrado exitosamente",
      supplier: supplierWithRelations
    });
  } catch (error) {
    console.error("Error al registrar proveedor:", error);
    res.status(500).json({
      message: "Error al registrar el proveedor",
      error: error.message,
    });
  }
};

// Obtener un proveedor por ID
const getSupplierById = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { condominiumId } = req.user;

    const supplier = await Supplier.findByPk(supplierId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'telephone', 'movil', 'address', 'status', 'nic']
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }

    // Verificar que el proveedor pertenezca al mismo condominio que el usuario
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      // Verificar si el proveedor está asociado al condominio del usuario
      const isAssociatedWithUserCondominium = supplier.Condominiums.some(
        condominium => condominium.id === condominiumId
      );
      
      if (!isAssociatedWithUserCondominium) {
        return res.status(403).json({ message: 'No tiene permisos para acceder a este proveedor.' });
      }
    }

    // Formatear la respuesta incluyendo todos los datos
    const formattedSupplier = {
      id: supplier.id,
      name: supplier.name,
      type: supplier.type,
      status: supplier.status || 'active',
      contactInfo: supplier.contactInfo || {},
      User: supplier.User,
      economicActivities: supplier.EconomicActivities || [],
      condominiums: supplier.Condominiums || []
    };

    res.json(formattedSupplier);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      message: 'Error al obtener el proveedor',
      error: error.message
    });
  }
};

// Actualizar condominiumId de un proveedor
const updateSupplierCondominium = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { condominiumId } = req.body;

    // Verificar si el proveedor existe
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }

    // Verificar si el condominio existe
    const condominium = await Condominium.findByPk(condominiumId);
    if (!condominium) {
      return res.status(404).json({ message: 'Condominio no encontrado.' });
    }

    // Actualizar el condominiumId del proveedor
    await supplier.update({ condominiumId });

    // Actualizar también el condominiumId del usuario asociado
    await User.update(
      { condominiumId },
      { where: { id: supplier.userId } }
    );

    // Actualizar la relación many-to-many
    // Primero, eliminar todas las relaciones existentes
    await supplier.setCondominiums([]);
    // Luego, agregar la nueva relación
    await supplier.addCondominiums([condominiumId]);

    // Obtener el proveedor actualizado con todas sus relaciones
    const updatedSupplier = await Supplier.findByPk(supplier.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'status']
        },
        {
          model: EconomicActivity,
          through: { attributes: [] }
        },
        {
          model: Condominium,
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      message: 'Condominio del proveedor actualizado exitosamente.',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error al actualizar condominio del proveedor:', error);
    res.status(500).json({
      message: 'Error al actualizar el condominio del proveedor',
      error: error.message
    });
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSuppliersByCondominium,
  getActivitiesBySupplier,
  completeProfile,
  updateSupplier,
  deleteSupplier,
  getSupplierByUserId,
  adminRegister,
  getSupplierById,
  updateSupplierCondominium
};