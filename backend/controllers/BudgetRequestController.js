const BudgetRequest = require('../models/BudgetRequest');
const Supplier = require('../models/Supplier');
const EconomicActivity = require('../models/EconomicActivity');
const User = require('../models/User');
const Condominium = require('../models/Condominium');
const Budget = require('../models/Budget');

const budgetRequestController = {
  // Crear una nueva solicitud de presupuesto
  createBudgetRequest: async (req, res) => {
    try {
      const { title, description, dueDate, economicActivities, supplierIds } = req.body;
      const condominiumId = req.user.condominiumId;

      // Validar campos requeridos
      if (!title || !description || !dueDate) {
        return res.status(400).json({
          message: "Faltan campos requeridos: título, descripción o fecha de vencimiento"
        });
      }

      // Crear la solicitud de presupuesto
      const budgetRequest = await BudgetRequest.create({
        title,
        description,
        dueDate,
        status: 'pending',
        condominiumId
      });

      // Asociar actividades económicas si se proporcionaron
      if (economicActivities && economicActivities.length > 0) {
        await budgetRequest.addEconomicActivities(economicActivities);
      }

      // Asociar proveedores si se proporcionaron
      if (supplierIds && supplierIds.length > 0) {
        await budgetRequest.addSuppliers(supplierIds);
      }

      // Obtener la solicitud creada con sus asociaciones
      const createdBudgetRequest = await BudgetRequest.findByPk(budgetRequest.id, {
        include: [
          {
            model: Supplier,
            as: 'suppliers',
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

      res.status(201).json(createdBudgetRequest);
    } catch (error) {
      console.error('Error al crear solicitud de presupuesto:', error);
      res.status(500).json({
        message: "Error al crear la solicitud de presupuesto",
        error: error.message
      });
    }
  },

  // Obtener solicitudes de presupuesto por condominio
  getBudgetRequestsByCondominium: async (req, res) => {
    try {
      const condominiumId = req.user.condominiumId;

      // Verificar que el usuario tiene acceso al condominio
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
          message: "No tiene permisos para ver las solicitudes de presupuesto"
        });
      }

      const budgetRequests = await BudgetRequest.findAll({
        where: {
          condominiumId
        },
        include: [
          {
            model: Supplier,
            as: 'suppliers',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
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
          },
          {
            model: Budget,
            as: 'budgets',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
                include: [
                  {
                    model: User,
                    attributes: ['id', 'name', 'email']
                  }
                ]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calcular estadísticas
      const stats = {
        total: budgetRequests.length,
        pending: budgetRequests.filter(br => br.status === 'pending').length,
        inProgress: budgetRequests.filter(br => br.status === 'in_progress').length,
        completed: budgetRequests.filter(br => br.status === 'completed').length,
        cancelled: budgetRequests.filter(br => br.status === 'cancelled').length
      };

      res.json({
        budgetRequests,
        stats
      });
    } catch (error) {
      console.error('Error al obtener solicitudes de presupuesto:', error);
      res.status(500).json({
        message: "Error al obtener las solicitudes de presupuesto",
        error: error.message
      });
    }
  },

  // Obtener una solicitud de presupuesto por ID
  getBudgetRequestById: async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role;
      const supplierId = req.user.supplierId;
      const condominiumId = req.user.condominiumId;

      // Construir la consulta base
      const query = {
        where: { id },
        include: [
          {
            model: Supplier,
            as: 'suppliers',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
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
          },
          {
            model: Budget,
            as: 'budgets',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
                include: [
                  {
                    model: User,
                    attributes: ['id', 'name', 'email']
                  }
                ]
              }
            ]
          }
        ]
      };

      // Si es un proveedor, verificar que tenga acceso a esta solicitud
      if (userRole === 'proveedor' || userRole === 'supplier') {
        if (!supplierId) {
          return res.status(403).json({
            message: "No se pudo verificar los permisos del proveedor"
          });
        }

        // Modificar la consulta para incluir la condición del proveedor
        query.include[0].where = { id: supplierId };
        query.include[0].required = true;
      } else if (userRole === 'admin' || userRole === 'superadmin') {
        // Para administradores, verificar que pertenezcan al condominio
        query.where.condominiumId = condominiumId;
      } else {
        return res.status(403).json({
          message: "No tiene permisos para ver esta solicitud de presupuesto"
        });
      }

      const budgetRequest = await BudgetRequest.findOne(query);

      if (!budgetRequest) {
        return res.status(404).json({
          message: "Solicitud de presupuesto no encontrada"
        });
      }

      res.json(budgetRequest);
    } catch (error) {
      console.error('Error al obtener solicitud de presupuesto:', error);
      res.status(500).json({
        message: "Error al obtener la solicitud de presupuesto",
        error: error.message
      });
    }
  },

  // Actualizar estado de una solicitud de presupuesto
  updateBudgetRequestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const condominiumId = req.user.condominiumId;

      // Validar el estado
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Estado inválido. Debe ser uno de: pending, in_progress, completed, cancelled"
        });
      }

      // Verificar que el usuario tiene acceso al condominio
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
          message: "No tiene permisos para actualizar esta solicitud de presupuesto"
        });
      }

      const budgetRequest = await BudgetRequest.findOne({
        where: {
          id,
          condominiumId
        }
      });

      if (!budgetRequest) {
        return res.status(404).json({
          message: "Solicitud de presupuesto no encontrada"
        });
      }

      // Actualizar el estado
      await budgetRequest.update({ status });

      // Obtener la solicitud actualizada con sus asociaciones
      const updatedBudgetRequest = await BudgetRequest.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'suppliers',
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
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
          },
          {
            model: Budget,
            as: 'budgets',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
                include: [
                  {
                    model: User,
                    attributes: ['id', 'name', 'email']
                  }
                ]
              }
            ]
          }
        ]
      });

      res.json(updatedBudgetRequest);
    } catch (error) {
      console.error('Error al actualizar estado de solicitud de presupuesto:', error);
      res.status(500).json({
        message: "Error al actualizar el estado de la solicitud de presupuesto",
        error: error.message
      });
    }
  },

  // Eliminar una solicitud de presupuesto
  deleteBudgetRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const userCondominiumId = req.user.condominiumId;

      // Verificar que el usuario es un administrador
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
          message: "Solo los administradores pueden eliminar solicitudes de presupuesto"
        });
      }

      const budgetRequest = await BudgetRequest.findByPk(id);
      if (!budgetRequest) {
        return res.status(404).json({ message: 'Solicitud de presupuesto no encontrada' });
      }

      // Verificar que el usuario pertenece al condominio
      if (budgetRequest.condominiumId != userCondominiumId) {
        return res.status(403).json({ 
          message: 'No tiene permisos para eliminar esta solicitud de presupuesto',
          condominiumId: budgetRequest.condominiumId,
          userCondominiumId
        });
      }

      // Eliminar la solicitud
      await budgetRequest.destroy();

      res.json({ message: 'Solicitud de presupuesto eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar solicitud de presupuesto:', error);
      res.status(500).json({ 
        message: 'Error al eliminar la solicitud de presupuesto', 
        error: error.message
      });
    }
  },

  // Obtener solicitudes de presupuesto por proveedor
  getBudgetRequestsBySupplier: async (req, res) => {
    try {
      const supplierId = req.user.supplierId;

      if (!supplierId) {
        return res.status(403).json({
          message: "No se pudo verificar los permisos del proveedor"
        });
      }

      // Obtener las solicitudes de presupuesto asociadas al proveedor
      const budgetRequests = await BudgetRequest.findAll({
        include: [
          {
            model: Supplier,
            as: 'suppliers',
            where: { id: supplierId },
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
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
          },
          {
            model: Budget,
            as: 'budgets',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
                include: [
                  {
                    model: User,
                    attributes: ['id', 'name', 'email']
                  }
                ]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calcular estadísticas
      const stats = {
        total: budgetRequests.length,
        pending: budgetRequests.filter(br => br.status === 'pending').length,
        inProgress: budgetRequests.filter(br => br.status === 'in_progress').length,
        completed: budgetRequests.filter(br => br.status === 'completed').length,
        cancelled: budgetRequests.filter(br => br.status === 'cancelled').length
      };

      res.json({
        budgetRequests,
        stats
      });
    } catch (error) {
      console.error('Error al obtener solicitudes de presupuesto por proveedor:', error);
      res.status(500).json({
        message: "Error al obtener las solicitudes de presupuesto",
        error: error.message
      });
    }
  }
};

module.exports = budgetRequestController; 