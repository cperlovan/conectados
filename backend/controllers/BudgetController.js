const Budget = require('../models/Budget');
const EconomicActivity = require('../models/EconomicActivity');
const User = require('../models/User');
const Supplier = require('../models/Supplier');

const budgetController = {
  // Crear un nuevo presupuesto
  createBudget: async (req, res) => {
    try {
      const { title, description, amount, dueDate, economicActivities, condominiumId, supplierId } = req.body;

      // Validar campos requeridos
      if (!title || !description || !amount || !dueDate || !economicActivities || !condominiumId || !supplierId) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
      }

      // Crear el presupuesto
      const budget = await Budget.create({
        title,
        description,
        amount,
        dueDate,
        condominiumId,
        supplierId
      });

      // Asociar las actividades económicas
      if (economicActivities && economicActivities.length > 0) {
        await budget.addEconomicActivities(economicActivities);
      }

      // Obtener el presupuesto con sus actividades económicas
      const budgetWithAssociations = await Budget.findByPk(budget.id, {
        include: [
          {
            model: EconomicActivity,
            as: 'budgetEconomicActivities'
          },
          {
            model: User,
            as: 'supplier',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json(budgetWithAssociations);
    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      res.status(500).json({ message: 'Error al crear el presupuesto', error: error.message });
    }
  },

  // Obtener todos los presupuestos de un condominio
  getBudgetsByCondominium: async (req, res) => {
    try {
      const { condominiumId } = req.params;
      console.log('Buscando presupuestos para condominio:', condominiumId);

      // Validar que el condominiumId sea un número válido
      if (!condominiumId || isNaN(condominiumId)) {
        return res.status(400).json({
          message: 'ID de condominio inválido',
          debug: { condominiumId }
        });
      }

      // Buscar los presupuestos incluyendo la información del proveedor y actividades económicas
      const budgets = await Budget.findAll({
        where: { condominiumId },
        include: [
          {
            model: Supplier,
            as: 'budgetSupplier',
            attributes: ['id', 'name', 'type', 'status', 'userId']
          },
          {
            model: EconomicActivity,
            as: 'budgetEconomicActivities',
            through: { attributes: [] },
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      console.log('Presupuestos encontrados:', budgets.length);
      
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
        error: error.message,
        stack: error.stack 
      });
    }
  },

  // Obtener un presupuesto específico
  getBudgetById: async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await Budget.findByPk(id, {
        include: [{
          model: EconomicActivity,
          as: 'budgetEconomicActivities',
          through: { attributes: [] }
        }]
      });

      if (!budget) {
        return res.status(404).json({ message: 'Presupuesto no encontrado' });
      }

      res.json(budget);
    } catch (error) {
      console.error('Error al obtener presupuesto:', error);
      res.status(500).json({ message: 'Error al obtener el presupuesto', error: error.message });
    }
  },

  // Actualizar un presupuesto
  updateBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, amount, dueDate, economicActivities, status } = req.body;

      const budget = await Budget.findByPk(id);
      if (!budget) {
        return res.status(404).json({ message: 'Presupuesto no encontrado' });
      }

      await budget.update({
        title,
        description,
        amount,
        dueDate,
        status
      });

      if (economicActivities && economicActivities.length > 0) {
        await budget.setEconomicActivities(economicActivities);
      }

      // Obtener el presupuesto actualizado con sus actividades
      const updatedBudget = await Budget.findByPk(id, {
        include: [{
          model: EconomicActivity,
          as: 'budgetEconomicActivities',
          through: { attributes: [] }
        }]
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

  // Obtener presupuestos del proveedor
  getBudgetsBySupplier: async (req, res) => {
    try {
      const { supplierId } = req.params;
      console.log('Buscando presupuestos para el proveedor:', supplierId);

      // Validar que el supplierId sea un número válido
      if (!supplierId || isNaN(supplierId)) {
        console.log('ID de proveedor inválido:', supplierId);
        return res.status(400).json({ 
          message: 'ID de proveedor inválido',
          supplierId 
        });
      }

      // Verificar si el proveedor existe
      const supplier = await Supplier.findByPk(supplierId);
      if (!supplier) {
        console.log('Proveedor no encontrado:', supplierId);
        return res.status(404).json({ 
          message: 'Proveedor no encontrado',
          supplierId 
        });
      }

      // Verificar que el proveedor pertenece al mismo condominio que el usuario
      if (supplier.condominiumId !== req.user.condominiumId) {
        console.log('El proveedor pertenece a un condominio diferente');
        return res.status(403).json({ 
          message: 'No tiene permisos para acceder a este proveedor',
          supplierId 
        });
      }

      const budgets = await Budget.findAll({
        where: { supplierId: supplier.id },
        include: [
          {
            model: EconomicActivity,
            as: 'budgetEconomicActivities',
            through: { attributes: [] }
          },
          {
            model: Supplier,
            as: 'budgetSupplier',
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

      console.log('Presupuestos encontrados:', budgets.length);
      res.json(budgets);
    } catch (error) {
      console.error('Error al obtener presupuestos del proveedor:', error);
      res.status(500).json({ 
        message: 'Error al obtener presupuestos del proveedor',
        error: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = budgetController; 