const Budget = require('../models/Budget');
const EconomicActivity = require('../models/EconomicActivity');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Condominium = require('../models/Condominium');

const budgetController = {
  // Crear un nuevo presupuesto
  createBudget: async (req, res) => {
    try {
      console.log('Datos recibidos para crear presupuesto:', req.body);
      console.log('Usuario autenticado:', req.user);

      const { title, description, amount, dueDate, economicActivities } = req.body;

      // Validar campos requeridos
      if (!title || !description || !amount || !dueDate) {
        return res.status(400).json({
          message: "Faltan campos requeridos: título, descripción, monto o fecha de vencimiento"
        });
      }

      // Determinar condominiumId y supplierId
      let finalCondominiumId = req.body.condominiumId;
      let finalSupplierId = req.body.supplierId;

      // Si el usuario es un proveedor, verificar que el supplierId coincida con su ID
      if (req.user.role === 'proveedor' || req.user.role === 'supplier') {
        if (!finalSupplierId) {
          return res.status(400).json({
            message: "Se requiere el ID del proveedor para crear un presupuesto"
          });
        }

        // Verificar que el proveedor existe y obtener su condominiumId
        const supplier = await Supplier.findByPk(finalSupplierId);
        if (!supplier) {
          return res.status(404).json({
            message: "El proveedor especificado no existe"
          });
        }

        // Si no se proporcionó condominiumId, usar el del proveedor
        if (!finalCondominiumId) {
          finalCondominiumId = supplier.condominiumId;
        }

        // Comentamos esta validación para permitir que un proveedor pueda crear presupuestos para diferentes condominios
        // if (finalCondominiumId !== supplier.condominiumId) {
        //   return res.status(400).json({
        //     message: `El proveedor pertenece al condominio ${supplier.condominiumId}, no al condominio ${finalCondominiumId}`
        //   });
        // }
      }

      // Verificar que el condominio existe
      const condominium = await Condominium.findByPk(finalCondominiumId);
      if (!condominium) {
        return res.status(404).json({
          message: "El condominio especificado no existe"
        });
      }

      // Crear el presupuesto
      const budget = await Budget.create({
        title,
        description,
        amount,
        dueDate,
        status: 'pending',
        condominiumId: finalCondominiumId,
        supplierId: finalSupplierId
      });

      // Asociar actividades económicas si se proporcionaron
      if (economicActivities && economicActivities.length > 0) {
        await budget.addEconomicActivities(economicActivities);
      }

      // Obtener el presupuesto con sus asociaciones
      const createdBudget = await Budget.findByPk(budget.id, {
        include: [
          { model: EconomicActivity, as: 'economicActivities', through: { attributes: [] } },
          { 
            model: Supplier, 
            as: 'supplier', 
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId', 'contactInfo'],
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          { model: Condominium, as: 'condominium', attributes: ['id', 'name'] }
        ]
      });

      res.status(201).json(createdBudget);
    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      res.status(500).json({
        message: "Error al crear el presupuesto",
        error: error.message
      });
    }
  },

  // Obtener presupuestos por condominio
  getBudgetsByCondominium: async (req, res) => {
    try {
      const { condominiumId } = req.params;
      const userCondominiumId = req.user.condominiumId;

      // Verificar que el usuario pertenece al condominio
      if (condominiumId != userCondominiumId) {
        return res.status(403).json({ 
          message: 'No tiene permisos para acceder a este condominio',
          condominiumId,
          userCondominiumId
        });
      }

      const budgets = await Budget.findAll({
        where: { condominiumId },
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId', 'contactInfo'],
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: EconomicActivity,
            as: 'economicActivities',
            through: { attributes: [] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // Calcular estadísticas
      const stats = {
        total: budgets.length,
        pending: budgets.filter(b => b.status === 'pending').length,
        approved: budgets.filter(b => b.status === 'approved').length,
        rejected: budgets.filter(b => b.status === 'rejected').length
      };

      res.json({
        budgets,
        stats
      });
    } catch (error) {
      console.error('Error al obtener presupuestos:', error);
      res.status(500).json({ 
        message: 'Error al obtener los presupuestos', 
        error: error.message
      });
    }
  },

  // Obtener un presupuesto por ID
  getBudgetById: async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role;
      const supplierId = req.user.supplierId;

      const budget = await Budget.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId', 'contactInfo'],
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: EconomicActivity,
            as: 'economicActivities',
            through: { attributes: [] }
          }
        ]
      });

      if (!budget) {
        return res.status(404).json({ message: 'Presupuesto no encontrado' });
      }

      // Verificar permisos
      if (userRole === 'proveedor' || userRole === 'supplier') {
        if (!supplierId) {
          return res.status(403).json({ message: 'No se pudo verificar los permisos del proveedor' });
        }

        if (budget.supplierId !== supplierId) {
          return res.status(403).json({ message: 'No tienes permiso para ver este presupuesto' });
        }
      }

      res.json(budget);
    } catch (error) {
      console.error('Error al obtener presupuesto:', error);
      res.status(500).json({ 
        message: 'Error al obtener el presupuesto', 
        error: error.message
      });
    }
  },

  // Actualizar un presupuesto
  updateBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, amount, dueDate, economicActivities, status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
      const supplierId = req.user.supplierId;

      const budget = await Budget.findByPk(id);
      if (!budget) {
        return res.status(404).json({ message: 'Presupuesto no encontrado' });
      }

      // Verificar permisos para actualizar el estado
      if (status && status !== budget.status) {
        // Solo los administradores pueden cambiar el estado
        if (userRole !== 'admin' && userRole !== 'superadmin') {
          return res.status(403).json({ message: 'No tienes permiso para cambiar el estado del presupuesto' });
        }
      }

      // Verificar permisos para actualizar otros campos
      if (userRole === 'proveedor' || userRole === 'supplier') {
        if (!supplierId) {
          return res.status(403).json({ message: 'No se pudo verificar los permisos del proveedor' });
        }

        if (budget.supplierId !== supplierId) {
          return res.status(403).json({ message: 'No tienes permiso para actualizar este presupuesto' });
        }
      }

      await budget.update({
        title,
        description,
        amount,
        dueDate,
        status
      });

      // Actualizar actividades económicas si se proporcionan
      if (economicActivities && Array.isArray(economicActivities)) {
        await budget.setEconomicActivities(economicActivities);
      }

      // Obtener el presupuesto actualizado con sus relaciones
      const updatedBudget = await Budget.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId', 'contactInfo'],
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: EconomicActivity,
            as: 'economicActivities',
            through: { attributes: [] }
          }
        ]
      });

      res.json({
        message: 'Presupuesto actualizado exitosamente',
        budget: updatedBudget
      });
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error);
      res.status(500).json({ message: 'Error al actualizar el presupuesto', error: error.message });
    }
  },

  // Eliminar un presupuesto
  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await Budget.findByPk(id);

      if (!budget) {
        return res.status(404).json({ message: 'Presupuesto no encontrado' });
      }

      await budget.destroy();
      res.json({ message: 'Presupuesto eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      res.status(500).json({ message: 'Error al eliminar el presupuesto', error: error.message });
    }
  },

  // Obtener presupuestos por proveedor
  getBudgetsBySupplier: async (req, res) => {
    try {
      const { supplierId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const userSupplierId = req.user.supplierId;

      // Validar que el supplierId sea un número válido
      if (!supplierId || isNaN(supplierId)) {
        return res.status(400).json({ 
          message: 'ID de proveedor inválido',
          supplierId 
        });
      }

      // Verificar si el proveedor existe
      const supplier = await Supplier.findByPk(supplierId, {
        include: [
          {
            model: User,
            attributes: ['id', 'role', 'email']
          },
          {
            model: EconomicActivity,
            as: 'EconomicActivities'
          }
        ]
      });

      if (!supplier) {
        return res.status(404).json({ 
          message: 'Proveedor no encontrado',
          supplierId 
        });
      }

      // Verificar permisos
      const isAdmin = ['admin', 'superadmin'].includes(userRole);
      const isOwnSupplier = userSupplierId === parseInt(supplierId);
      const isSameCondominium = supplier.condominiumId === req.user.condominiumId;

      // Si es admin del mismo condominio, permitir acceso
      if (isAdmin && isSameCondominium) {
        // Acceso permitido
      }
      // Si es el proveedor propietario, permitir acceso
      else if (isOwnSupplier) {
        // Acceso permitido
      }
      // En cualquier otro caso, denegar acceso
      else {
        return res.status(403).json({ 
          message: 'No tiene permisos para acceder a este proveedor',
          debug: {
            isAdmin,
            isSameCondominium,
            isOwnSupplier
          }
        });
      }

      const budgets = await Budget.findAll({
        where: { supplierId: supplier.id },
        include: [
          {
            model: EconomicActivity,
            as: 'economicActivities',
            through: { attributes: [] },
            attributes: ['id', 'name', 'description']
          },
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId', 'contactInfo'],
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // Calcular estadísticas
      const stats = {
        total: budgets.length,
        pending: budgets.filter(b => b.status === 'pending').length,
        approved: budgets.filter(b => b.status === 'approved').length,
        rejected: budgets.filter(b => b.status === 'rejected').length
      };

      res.json({
        budgets,
        stats
      });
    } catch (error) {
      console.error('Error al obtener presupuestos del proveedor:', error);
      res.status(500).json({ 
        message: 'Error al obtener presupuestos del proveedor',
        error: error.message 
      });
    }
  }
}

module.exports = budgetController; 