const Supplier = require("../models/Supplier");
const EconomicActivity = require("../models/EconomicActivity");
const User = require("../models/User");
const bcrypt = require("bcrypt");

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
    });

    // Asociar con condominios
    if (condominiums && condominiums.length > 0) {
      await supplier.addCondominiums(condominiums);
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
    const suppliers = await Supplier.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status"],
        },
      ],
    });
    res.json(suppliers);
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

    // Consulta principal
    const suppliers = await Supplier.findAll({
      where: { condominiumId },
      attributes: ['id', 'name', 'contactInfo'], // Ajusta según tus campos
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email', 'status'],
        },
        {
          model: EconomicActivity, // Incluye las actividades económicas
          through: { attributes: [] }, // Excluye los campos de la tabla intermedia
          attributes: ['id', 'name', 'description'], // Solo incluye los campos relevantes
        },
      ],
    });

    // Agregar logs para depuración
    console.log("Proveedores encontrados:", JSON.stringify(suppliers, null, 2));

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener proveedores',
      error: error.message,
    });
  }
};

// Obtener actividades de un proveedor
const getActivitiesBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findByPk(supplierId, {
      include: ["EconomicActivities"],
    });
    if (!supplier) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(supplier.EconomicActivities);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener actividades",
      error: error.message,
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
      contactInfo,
      condominiumId: user.condominiumId, // Obtener condominio del usuario autenticado
    });

    // Asociar actividades económicas
    if (economicActivities && economicActivities.length > 0) {
      await supplier.addEconomicActivities(economicActivities);
    }

    // Actualizar datos en la tabla Users
    await User.update(
      {
        name: contactInfo.name || user.name,
        lastname: contactInfo.lastname || user.lastname,
        telephone: contactInfo.phone || user.telephone,
        movil: contactInfo.movil || user.movil,
        address: contactInfo.address || user.address,
        status: "active", // Cambiar el estado a 'active'
      },
      { where: { id: user.id } }
    );

    res.status(201).json({
      message: "Perfil de proveedor completado exitosamente.",
      supplier,
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
    const { name, lastname, type, contactInfo } = req.body;

    // Verificar si el proveedor existe
    const supplier = await Supplier.findByPk(supplierId, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status"],
        },
      ],
    });
    if (!supplier) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }

    // Validar que se proporcionen los datos necesarios
    if (!type || !contactInfo) {
      return res.status(400).json({
        message: "Todos los campos obligatorios deben ser proporcionados.",
      });
    }

    // Validar que contactInfo contenga el campo 'name' (nombre de la empresa)
    if (!contactInfo.name) {
      return res.status(400).json({
        message: "El campo 'name' dentro de contactInfo es obligatorio.",
      });
    }

    // Actualizar datos del proveedor (Suppliers)
    const updatedSupplier = await supplier.update({
      name: contactInfo.name, // Usar el campo 'name' dentro de contactInfo como el nombre de la empresa
      type,
      contactInfo: {
        companyName: contactInfo.name, // Agregar el nombre de la empresa dentro de contactInfo
        phone: contactInfo.phone,
        movil: contactInfo.movil,
        address: contactInfo.address,
      },
    });

    // No modificar los datos del usuario en la tabla Users
    // Solo actualizamos los campos relacionados con el contacto si son relevantes
    await User.update(
      {
        telephone: contactInfo.phone || supplier.User.telephone,
        movil: contactInfo.movil || supplier.User.movil,
        address: contactInfo.address || supplier.User.address,
      },
      { where: { id: supplier.userId } }
    );

    // Obtener el proveedor actualizado con todas sus relaciones
    const supplierWithRelations = await Supplier.findByPk(supplier.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "lastname", "email", "status"],
        },
      ],
    });

    res.json({
      message: "Proveedor actualizado exitosamente.",
      supplier: supplierWithRelations,
    });
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({
      message: "Error al actualizar el proveedor",
      error: error.message,
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
      economicActivities,
      condominiumId
    } = req.body;

    console.log("Datos recibidos:", { userId, name, type, contactInfo, economicActivities, condominiumId });

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

    // Actualizar los datos del usuario
    const userUpdateData = {
      name: contactInfo.name,
      lastname: contactInfo.lastname,
      telephone: contactInfo.phone,
      movil: contactInfo.phone,
      address: contactInfo.address,
      status: "active",
      authorized: true
    };

    console.log("Datos a actualizar del usuario:", userUpdateData);
    await existingUser.update(userUpdateData);

    // Verificar si ya existe un proveedor para este usuario
    const existingSupplier = await Supplier.findOne({ where: { userId } });
    if (existingSupplier) {
      return res.status(400).json({
        message: "Este usuario ya tiene un perfil de proveedor registrado"
      });
    }

    // Determinar el nombre del proveedor
    let supplierName;
    if (type === "company" && contactInfo.companyName) {
      supplierName = contactInfo.companyName;
    } else {
      supplierName = `${contactInfo.name} ${contactInfo.lastname}`;
    }

    // Crear el proveedor
    const supplierData = {
      userId,
      name: supplierName,
      type,
      contactInfo: {
        ...contactInfo,
        email: existingUser.email
      },
      condominiumId
    };

    console.log("Datos a enviar al backend para crear proveedor:", supplierData);
    const supplier = await Supplier.create(supplierData);

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

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSuppliersByCondominium,
  getActivitiesBySupplier,
  completeProfile,
  updateSupplier,
  deleteSupplier,
  getSupplierByUserId,
  adminRegister
};