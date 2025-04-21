const BudgetRequest = require('../models/BudgetRequest');
const { Supplier } = require('../models/Supplier');
const EconomicActivity = require('../models/EconomicActivity');
const User = require('../models/User');
const Condominium = require('../models/Condominium');
const Budget = require('../models/Budget');
const BudgetRequestSupplier = require('../models/BudgetRequestSupplier');

const budgetRequestController = {
  // Crear una nueva solicitud de presupuesto
  createBudgetRequest: async (req, res) => {
    try {
      const { 
        title, 
        description, 
        dueDate, 
        details, 
        economicActivities, 
        economicActivityIds, 
        supplierIds 
      } = req.body;
      const condominiumId = req.user.condominiumId;

      console.log("Datos recibidos en createBudgetRequest:", {
        title,
        description,
        dueDate,
        details,
        economicActivities,
        economicActivityIds,
        supplierIds,
        condominiumId
      });

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
        details: details || null,
        status: 'pending',
        condominiumId
      });

      // Determinar qué campo de actividades económicas usar
      const activityIds = economicActivities || economicActivityIds || [];

      // Asociar actividades económicas si se proporcionaron
      if (activityIds && activityIds.length > 0) {
        console.log("Asociando actividades económicas:", activityIds);
        try {
          await budgetRequest.addEconomicActivities(activityIds);
        } catch (error) {
          console.error("Error al asociar actividades económicas:", error);
          // No lanzar error, solo registrarlo
          console.error(`Error al asociar actividades económicas: ${error.message}`);
        }
      }

      // Asociar proveedores si se proporcionaron
      if (supplierIds && supplierIds.length > 0) {
        console.log("Asociando proveedores:", supplierIds);
        try {
          await budgetRequest.addSuppliers(supplierIds);
          
          // Crear entradas directamente en la tabla de asociación si el método anterior falla
          if (!(await BudgetRequestSupplier.findOne({ where: { budgetRequestId: budgetRequest.id } }))) {
            console.log("Usando método alternativo para asociar proveedores");
            
            for (const supplierId of supplierIds) {
              await BudgetRequestSupplier.create({
                budgetRequestId: budgetRequest.id,
                supplierId: supplierId
              });
            }
          }
        } catch (error) {
          console.error("Error al asociar proveedores:", error);
          
          // Intentar inserción directa como fallback
          try {
            console.log("Intentando asociación directa de proveedores como fallback");
            for (const supplierId of supplierIds) {
              await BudgetRequestSupplier.create({
                budgetRequestId: budgetRequest.id,
                supplierId: supplierId
              });
            }
          } catch (fallbackError) {
            console.error("Error también en el fallback:", fallbackError);
          }
        }
      }

      // Simplificar la respuesta para depuración
      res.status(201).json({
        message: 'Solicitud de presupuesto creada correctamente',
        id: budgetRequest.id,
        title: budgetRequest.title
      });
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
      console.log('Usuario autenticado:', {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        condominiumId: req.user.condominiumId,
        supplierId: req.user.supplierId
      });

      // Verificar que el usuario tiene acceso al condominio
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
          message: "No tiene permisos para ver las solicitudes de presupuesto"
        });
      }

      // Obtener solo las solicitudes de presupuesto básicas primero
      const budgetRequests = await BudgetRequest.findAll({
        where: {
          condominiumId
        },
        order: [['createdAt', 'DESC']]
      });

      // Estructura para guardar los resultados completos
      const fullBudgetRequests = [];

      // Procesar cada solicitud para obtener sus relaciones
      for (const budgetRequest of budgetRequests) {
        // Convertir a un objeto simple para agregar propiedades
        const budgetRequestData = budgetRequest.toJSON();

        try {
          // Obtener condominio
          const condominium = await Condominium.findByPk(budgetRequest.condominiumId);
          if (condominium) {
            budgetRequestData.condominium = condominium;
          }

          // Obtener proveedores asociados
          const suppliers = await Supplier.findAll({
            include: [
              {
                model: BudgetRequest,
                as: 'budgetRequests',
                where: { id: budgetRequest.id },
                required: true,
                attributes: []
              },
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ],
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId']
          });
          budgetRequestData.suppliers = suppliers;

          // Obtener actividades económicas asociadas
          const economicActivities = await EconomicActivity.findAll({
            include: [
              {
                model: BudgetRequest,
                as: 'budgetRequests',
                where: { id: budgetRequest.id },
                required: true,
                attributes: []
              }
            ]
          });
          budgetRequestData.economicActivities = economicActivities;

          // Obtener presupuestos asociados
          const budgets = await Budget.findAll({
            where: { budgetRequestId: budgetRequest.id },
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
          });
          budgetRequestData.budgets = budgets;

          fullBudgetRequests.push(budgetRequestData);
        } catch (error) {
          console.error(`Error al obtener relaciones para la solicitud ${budgetRequest.id}:`, error);
          // Aun así agregamos la solicitud básica sin sus relaciones
          fullBudgetRequests.push(budgetRequestData);
        }
      }

      // Calcular estadísticas
      const stats = {
        total: budgetRequests.length,
        pending: budgetRequests.filter(br => br.status === 'pending').length,
        inProgress: budgetRequests.filter(br => br.status === 'in_progress').length,
        completed: budgetRequests.filter(br => br.status === 'completed').length,
        cancelled: budgetRequests.filter(br => br.status === 'cancelled').length
      };

      res.json({
        budgetRequests: fullBudgetRequests,
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
      let supplierId = req.user.supplierId;
      const userId = req.user.id;
      const condominiumId = req.user.condominiumId;

      console.log(`Obteniendo detalles de solicitud de presupuesto ID: ${id}. Usuario: ${userId}, Rol: ${userRole}, CondominiumId: ${condominiumId}`);

      // Si el usuario es proveedor y no tiene supplierId, intentar obtenerlo
      if ((userRole === 'proveedor' || userRole === 'supplier') && !supplierId) {
        console.log("Usuario proveedor sin supplierId. Intentando buscar proveedor para:", userId);
        
        try {
          const supplier = await Supplier.findOne({ 
            where: { userId: userId },
            raw: true // Obtener datos crudos para evitar caché
          });
          
          if (supplier) {
            supplierId = supplier.id;
            console.log("Se encontró supplierId:", supplierId);
          } else {
            console.log("No se encontró ningún proveedor asociado al usuario:", userId);
            return res.status(403).json({
              message: "No se encontró información de proveedor asociada a su cuenta. Por favor, contacte al administrador."
            });
          }
        } catch (error) {
          console.error("Error al buscar el proveedor:", error);
          return res.status(500).json({
            message: "Error al verificar la información del proveedor",
            error: error.message
          });
        }
      }

      // Verificar que el usuario tenga permisos según su rol
      if (userRole === 'proveedor' || userRole === 'supplier') {
        if (!supplierId) {
          return res.status(403).json({
            message: "No se pudo verificar los permisos del proveedor"
          });
        }
      } else if (userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({
          message: "No tiene permisos para ver esta solicitud de presupuesto"
        });
      }

      const sequelize = require('../config/database');
      
      // Primero, verificar si el recurso ha sido modificado
      const requestEtag = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'] ? new Date(req.headers['if-modified-since']) : null;
      
      // Obtener la última fecha de actualización de esta solicitud específica
      let lastUpdate = null;
      try {
        const budgetRequestInfo = await BudgetRequest.findOne({
          attributes: ['updatedAt'],
          where: { id },
          raw: true
        });
        
        if (budgetRequestInfo && budgetRequestInfo.updatedAt) {
          lastUpdate = new Date(budgetRequestInfo.updatedAt);
          
          // También verificar la última actualización de los presupuestos asociados
          const latestBudgetUpdate = await Budget.findOne({
            attributes: [[sequelize.fn('max', sequelize.col('updatedAt')), 'lastBudgetUpdate']],
            where: { budgetRequestId: id },
            raw: true
          });
          
          if (latestBudgetUpdate && latestBudgetUpdate.lastBudgetUpdate) {
            const budgetUpdate = new Date(latestBudgetUpdate.lastBudgetUpdate);
            if (budgetUpdate > lastUpdate) {
              lastUpdate = budgetUpdate;
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener la fecha de última actualización:", error);
        // Continuamos sin usar caché condicional
      }
      
      // Si tenemos una última fecha de actualización y no es más reciente que If-Modified-Since
      if (lastUpdate && ifModifiedSince && lastUpdate <= ifModifiedSince) {
        console.log(`No hay cambios en la solicitud ${id} desde ${ifModifiedSince}, devolviendo 304 Not Modified`);
        return res.status(304).end(); // 304 Not Modified, sin cuerpo de respuesta
      }

      // Usar una transacción para garantizar datos actualizados
      const transaction = await sequelize.transaction({
        isolationLevel: 'READ COMMITTED'
      });

      try {
        // Buscar la solicitud de presupuesto básica primero
        const budgetRequest = await BudgetRequest.findByPk(id, { transaction });

        if (!budgetRequest) {
          await transaction.rollback();
          return res.status(404).json({
            message: "Solicitud de presupuesto no encontrada"
          });
        }

        // Verificar permiso de acceso según rol
        if (userRole === 'admin' || userRole === 'superadmin') {
          // Administradores solo pueden ver solicitudes de su condominio
          if (budgetRequest.condominiumId !== condominiumId) {
            await transaction.rollback();
            return res.status(403).json({
              message: "No tiene permisos para ver esta solicitud de presupuesto"
            });
          }
        } else if (userRole === 'proveedor' || userRole === 'supplier') {
          // Verificar si el proveedor está asociado a esta solicitud
          const hasAccess = await BudgetRequestSupplier.findOne({
            where: {
              budgetRequestId: id,
              supplierId: supplierId
            },
            transaction
          });
          
          if (!hasAccess) {
            await transaction.rollback();
            return res.status(403).json({
              message: "No tiene permisos para ver esta solicitud de presupuesto"
            });
          }
        }

        // Convertir a objeto simple para agregar relaciones
        const budgetRequestData = budgetRequest.toJSON();
        
        try {
          // Obtener condominio
          const condominium = await Condominium.findByPk(budgetRequest.condominiumId, { transaction });
          if (condominium) {
            budgetRequestData.condominium = condominium;
          }

          // Obtener proveedores asociados
          const suppliers = await Supplier.findAll({
            include: [
              {
                model: BudgetRequest,
                as: 'budgetRequests',
                where: { id: budgetRequest.id },
                required: true,
                attributes: []
              },
              {
                model: User,
                attributes: ['id', 'name', 'email']
              }
            ],
            attributes: ['id', 'name', 'type', 'userId', 'condominiumId'],
            transaction
          });
          budgetRequestData.suppliers = suppliers;

          // Obtener actividades económicas asociadas
          const economicActivities = await EconomicActivity.findAll({
            include: [
              {
                model: BudgetRequest,
                as: 'budgetRequests',
                where: { id: budgetRequest.id },
                required: true,
                attributes: []
              }
            ],
            transaction
          });
          budgetRequestData.economicActivities = economicActivities;

          // Obtener presupuestos asociados
          const budgets = await Budget.findAll({
            where: { budgetRequestId: budgetRequest.id },
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
            ],
            transaction
          });
          budgetRequestData.budgets = budgets;
          
          console.log(`Detalles obtenidos correctamente para solicitud ID: ${id}, Estado: ${budgetRequestData.status}`);
        } catch (error) {
          console.error(`Error al obtener relaciones para la solicitud ${budgetRequest.id}:`, error);
          // Continuamos con la solicitud básica aunque haya errores en las relaciones
        }

        await transaction.commit();
        
        // Generar un valor ETag basado en los datos
        const etag = `W/"${lastUpdate ? lastUpdate.getTime() : Date.now()}"`;
        
        // Configurar headers para caché condicional
        res.setHeader('ETag', etag);
        if (lastUpdate) {
          res.setHeader('Last-Modified', lastUpdate.toUTCString());
        }
        
        // Prevenir caché completa, pero permitir caché condicional
        res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        
        res.json(budgetRequestData);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
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
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`Solicitando actualización de estado para solicitud ID: ${id}. Usuario: ${userId}, Rol: ${userRole}. Nuevo estado: ${status}`);

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

      // Usar transacción para obtener datos actualizados
      const sequelize = require('../config/database');
      const transaction = await sequelize.transaction({
        isolationLevel: 'READ COMMITTED'
      });

      try {
        const budgetRequest = await BudgetRequest.findOne({
          where: {
            id,
            condominiumId
          },
          transaction
        });

        if (!budgetRequest) {
          await transaction.rollback();
          return res.status(404).json({
            message: "Solicitud de presupuesto no encontrada"
          });
        }

        const previousStatus = budgetRequest.status;
        
        // Actualizar el estado
        await budgetRequest.update({ status }, { transaction });
        
        console.log(`Solicitud ID: ${id} actualizada. Estado anterior: ${previousStatus}, Nuevo estado: ${status}`);

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
              model: Condominium,
              as: 'condominium'
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
          transaction
        });
        
        // Obtener los proveedores asociados para notificarles el cambio de estado
        console.log(`Obteniendo proveedores asociados a la solicitud ID: ${id} para notificar cambio de estado`);
        const associatedSuppliers = await BudgetRequestSupplier.findAll({
          where: { budgetRequestId: id },
          attributes: ['supplierId'],
          transaction
        });
        
        const supplierIds = associatedSuppliers.map(s => s.supplierId);
        console.log(`Proveedores a notificar del cambio de estado: ${supplierIds.join(', ')}`);
        
        await transaction.commit();
        
        // Prevenir caché de navegador
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        
        // Logs para depuración
        console.log(`Respuesta enviada para actualización de estado de solicitud ID: ${id}. Estado final: ${updatedBudgetRequest.status}`);

        res.json(updatedBudgetRequest);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
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
      let supplierId = req.user.supplierId;
      const userId = req.user.id;
      
      console.log(`Obteniendo solicitudes de presupuesto para proveedor. User ID: ${userId}, Supplier ID: ${supplierId || 'No disponible'}`);

      // Si no hay supplierId en el token, intentar obtenerlo del usuario
      if (!supplierId) {
        console.log("No se encontró supplierId en el token. Intentando buscar proveedor para el usuario:", userId);
        
        try {
          const supplier = await Supplier.findOne({ 
            where: { userId: userId },
            raw: true // Obtener datos crudos para evitar caché
          });
          
          if (supplier) {
            supplierId = supplier.id;
            console.log("Se encontró supplierId:", supplierId);
          } else {
            console.log("No se encontró ningún proveedor asociado al usuario:", userId);
            return res.status(403).json({
              message: "No se encontró información de proveedor asociada a su cuenta. Por favor, contacte al administrador."
            });
          }
        } catch (error) {
          console.error("Error al buscar el proveedor:", error);
          return res.status(500).json({
            message: "Error al verificar la información del proveedor",
            error: error.message
          });
        }
      }

      if (!supplierId) {
        return res.status(403).json({
          message: "No se pudo verificar los permisos del proveedor"
        });
      }

      // Verificar si hay un campo If-None-Match en la solicitud (ETag)
      const requestEtag = req.headers['if-none-match'];
      
      // Verificar si hay un campo If-Modified-Since en la solicitud
      const ifModifiedSince = req.headers['if-modified-since'] ? new Date(req.headers['if-modified-since']) : null;
      
      // Primero obtener solo la última fecha de actualización de cualquier solicitud para este proveedor
      // para verificar si se necesita enviar datos completos
      const sequelize = require('../config/database');
      
      // Consulta para obtener la última fecha de actualización
      let lastUpdate = null;
      try {
        const result = await sequelize.query(`
          SELECT MAX(br."updatedAt") as last_update
          FROM "BudgetRequests" br
          JOIN "BudgetRequestSuppliers" brs ON br.id = brs."budgetRequestId"
          WHERE brs."supplierId" = :supplierId
        `, {
          replacements: { supplierId },
          type: sequelize.QueryTypes.SELECT
        });
        
        if (result && result[0] && result[0].last_update) {
          lastUpdate = new Date(result[0].last_update);
        }
      } catch (error) {
        console.error("Error al obtener la última fecha de actualización:", error);
        // Continuamos incluso si hay error, simplemente no usaremos caché condicional
      }
      
      // Si tenemos una última fecha de actualización y no es más reciente que If-Modified-Since
      if (lastUpdate && ifModifiedSince && lastUpdate <= ifModifiedSince) {
        console.log(`No hay cambios desde ${ifModifiedSince}, devolviendo 304 Not Modified`);
        return res.status(304).end(); // 304 Not Modified, sin cuerpo de respuesta
      }
      
      // Si llegamos aquí, necesitamos obtener datos completos y generar un nuevo ETag
      const transaction = await sequelize.transaction({
        isolationLevel: 'READ COMMITTED'
      });

      try {
        console.log(`Consultando solicitudes para supplierId: ${supplierId}`);
        
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
              model: Condominium,
              as: 'condominium'
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
          order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']], // Ordenar por última actualización primero
          transaction
        });

        // Calcular estadísticas
        const stats = {
          total: budgetRequests.length,
          pending: budgetRequests.filter(br => br.status === 'pending').length,
          inProgress: budgetRequests.filter(br => br.status === 'in_progress').length,
          completed: budgetRequests.filter(br => br.status === 'completed').length,
          cancelled: budgetRequests.filter(br => br.status === 'cancelled').length
        };

        console.log(`Se encontraron ${budgetRequests.length} solicitudes para el proveedor ${supplierId}. Estados: `, 
          `Pendientes: ${stats.pending}, `,
          `En Progreso: ${stats.inProgress}, `,
          `Completadas: ${stats.completed}, `,
          `Canceladas: ${stats.cancelled}`
        );

        await transaction.commit();
        
        // Crear la respuesta
        const responseData = {
          budgetRequests,
          stats
        };
        
        // Generar un valor ETag basado en los datos
        // En producción, se podría usar un hash más sofisticado
        const etag = `W/"${lastUpdate ? lastUpdate.getTime() : Date.now()}"`;
        
        // Configurar headers para caché condicional
        res.setHeader('ETag', etag);
        if (lastUpdate) {
          res.setHeader('Last-Modified', lastUpdate.toUTCString());
        }
        
        // Prevenir caché completa, pero permitir caché condicional
        res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        
        // Devolver los datos completos
        res.json(responseData);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
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