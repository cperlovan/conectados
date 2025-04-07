const Receipt = require('../models/Receipt');
const Property = require('../models/Property');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');
const sequelize = require('../config/database');


// Crear un nuevo recibo basado en los gastos establecidos en la tabla Expense del mes actual
//OJO: HAY QUE DEFINIR SI EL CAMPO DUE DATE ES EL QUE MARCA LA FECHA QUE DEBO TENER EN CUENTA
exports.createReceipt = async (req, res) => {
  const { dueDate, condominiumId, month, year, status } = req.body;

  try {
    // Validar que todos los campos necesarios estén presentes
    if (!dueDate || !condominiumId) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    
    console.log(`Datos recibidos: dueDate=${dueDate}, condominiumId=${condominiumId}, month=${month}, year=${year}, status=${status}`);
    
    const currentMonth = month || new Date().getMonth() + 1; // Usar mes proporcionado o actual
    const currentYear = year || new Date().getFullYear(); // Usar año proporcionado o actual
    console.log(`Mes para calcular gastos: ${currentMonth}, Año: ${currentYear}`);

    // Calcular la fecha de vencimiento correcta basada en el mes y año del recibo
    const calculatedDueDate = new Date(currentYear, currentMonth, 0); // Último día del mes correspondiente
    const dueDateToUse = calculatedDueDate.toISOString().split('T')[0];
    console.log(`Fecha de vencimiento calculada: ${dueDateToUse}`);

    // Obtener todas las propiedades del condominio con sus owners y el crédito disponible
    const properties = await Property.findAll({
      where: { 
        condominiumId,
        // Aceptar tanto 'occupied' como 'active' para mayor compatibilidad
        status: {
          [Op.or]: ['occupied', 'active']
        }
      },
      include: [
        {
          model: require('../models/Owner'),
          as: 'owner',
          include: [
            {
              model: require('../models/User'),
              as: 'user',
              attributes: ['id', 'name', 'email', 'credit_amount']
            }
          ]
        }
      ]
    });

    if (properties.length === 0) {
      return res.status(404).json({ message: 'No se encontraron propiedades para este condominio.' });
    }

    // Verificar que todas las propiedades tengan propietarios
    const propertiesWithoutOwners = properties.filter(property => !property.owner);
    if (propertiesWithoutOwners.length > 0) {
      console.log(`Hay ${propertiesWithoutOwners.length} propiedades sin propietario asignado`);
      // Continuamos con las propiedades que sí tienen propietario
    }

    // Filtramos propiedades que tienen propietario y usuario válido
    console.log("Filtrando propiedades con propietarios válidos...");
    const validProperties = properties.filter(property => {
      const isValid = property.owner && 
                      property.owner.user &&
                      property.condominiumId === parseInt(condominiumId) &&
                      property.owner.condominiumId === parseInt(condominiumId);
      
      // Registrar detalles de cada propiedad para depuración
      console.log(`\nPropiedad ID: ${property.id}, Número: ${property.number || 'sin número'}`);
      if (property.owner) {
        console.log(`- Owner ID: ${property.owner.id}`);
        if (property.owner.user) {
          console.log(`- Usuario asociado: ID ${property.owner.user.id}, Email: ${property.owner.user.email}`);
        } else {
          console.log(`- No tiene usuario asociado`);
        }
        console.log(`- Condominio del propietario: ${property.owner.condominiumId}`);
      } else {
        console.log(`- No tiene propietario asignado`);
      }
      console.log(`- Condominio de la propiedad: ${property.condominiumId}`);
      console.log(`- ¿Es válida para generar recibo?: ${isValid ? 'SÍ' : 'NO'}`);
      
      if (!isValid && property.owner) {
        console.log(`Propiedad ${property.id} (${property.number || 'sin número'}) descartada - Detalles:`);
        console.log(`- ¿Tiene propietario? ${property.owner ? 'Sí' : 'No'}`);
        console.log(`- ¿Propietario tiene usuario? ${property.owner?.user ? 'Sí' : 'No'}`);
        console.log(`- Condominio de propiedad: ${property.condominiumId}, Condominio solicitado: ${condominiumId}`);
        console.log(`- Condominio de propietario: ${property.owner?.condominiumId}, Condominio solicitado: ${condominiumId}`);
      }
      
      return isValid;
    });

    console.log(`Propiedades válidas: ${validProperties.length} de ${properties.length} totales`);

    if (validProperties.length === 0) {
      return res.status(400).json({
        message: 'No se encontraron propiedades con propietarios válidos en este condominio.',
      });
    }

    // Calcular la suma de las alícuotas solo para propiedades válidas
    const totalQuota = validProperties.reduce((sum, property) => {
      // Verificar primero participationQuota, si no existe usar aliquot
      let quota = null;
      if (property.participationQuota !== null && property.participationQuota !== undefined) {
        quota = parseFloat(property.participationQuota);
      } else if (property.aliquot !== null && property.aliquot !== undefined) {
        quota = parseFloat(property.aliquot);
      } else {
        return sum; // Si no hay ningún valor de cuota, mantener la suma actual
      }
      
      return sum + (isNaN(quota) ? 0 : quota);
    }, 0);
    
    console.log(`Suma de las alícuotas: ${totalQuota}`); // Depuración

    if (Math.abs(totalQuota - 100) > 0.01) {
      return res.status(400).json({
        message: `La suma de las alícuotas (${totalQuota}%) no es igual a 100%. Ajusta las alícuotas de las propiedades.`,
      });
    }

    // Calcular el total de los gastos del mes actual del condominio mediante el campo date
    const totalExpenses = await Expense.sum('amount', {
      where: {
        condominiumId,
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "date"')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "date"')), currentYear),
        ],
      },
    });

    console.log(`Total de gastos del mes actual: ${totalExpenses}`);

    // Manejar el caso en que no haya gastos registrados para el mes actual
    if (!totalExpenses || totalExpenses <= 0) {
      return res.status(400).json({
        message: 'No se encontraron gastos registrados para el mes actual.',
      });
    }

    // Verificar si ya existen recibos para este mes, año y condominio
    const existingReceipts = await Receipt.findAll({
      where: {
        condominiumId,
        month: currentMonth,
        year: currentYear
      }
    });
    
    if (existingReceipts.length > 0) {
      return res.status(400).json({
        message: `Ya existen recibos generados para ${currentMonth}/${currentYear} en este condominio.`,
      });
    }

    // Calcular y crear recibos individuales para cada propiedad
    const receipts = [];
    for (const property of validProperties) {
      // Determinar qué campo de alícuota usar
      let quota = null;
      if (property.participationQuota !== null && property.participationQuota !== undefined) {
        quota = parseFloat(property.participationQuota);
      } else if (property.aliquot !== null && property.aliquot !== undefined) {
        quota = parseFloat(property.aliquot);
      } else {
        console.log(`Propiedad ${property.id} no tiene alícuota asignada. Saltando.`);
        continue;
      }
      
      if (isNaN(quota)) {
        console.log(`Propiedad ${property.id} tiene un valor de alícuota no numérico. Saltando.`);
        continue;
      }
      
      const individualAmount = (totalExpenses * quota) / 100;
      console.log(`Calculando monto para propiedad ${property.id}: (${totalExpenses} * ${quota}) / 100 = ${individualAmount}`);
      
      // Obtener el crédito disponible del usuario
      const userCreditAmount = parseFloat(property.owner.user.credit_amount || 0);
      console.log(`Crédito disponible para usuario ${property.owner.user.id}: ${userCreditAmount}`);

      // Determinar el estado inicial y monto pendiente basado en el crédito disponible
      let initialStatus = status || 'pending';
      let initialPendingAmount = individualAmount;
      let usedCredit = 0;

      // Si hay suficiente crédito, marcar como pagado y crear un pago automático
      if (userCreditAmount >= individualAmount) {
        initialStatus = 'paid';
        initialPendingAmount = 0;
        usedCredit = individualAmount;
        console.log(`Aplicando crédito automáticamente: ${usedCredit} de ${userCreditAmount}`);
      }

      const receipt = await Receipt.create({
        amount: individualAmount,
        dueDate: dueDateToUse,
        userId: property.owner.user.id,
        propertyId: property.id,
        condominiumId,
        pending_amount: initialPendingAmount,
        status: initialStatus,
        month: currentMonth,
        year: currentYear,
        visible: false,
        credit_balance: Math.max(0, userCreditAmount - usedCredit)
      });

      // Si se usó crédito, crear un pago automático
      if (usedCredit > 0) {
        const payment = await Payment.create({
          amount: receipt.amount,
          method: 'credit',
          status: 'approved',
          userId: receipt.userId,
          receiptId: receipt.id,
          condominiumId: receipt.condominiumId,
          payment_details: {
            automatic: true,
            credit_applied: receipt.amount,
            date: new Date(),
            notes: 'Pago automático con crédito disponible'
          }
        });

        console.log(`Pago automático creado: ID ${payment.id}, Monto ${usedCredit}`);

        // Actualizar el crédito del usuario
        await property.owner.user.update({
          credit_amount: userCreditAmount - usedCredit
        });
      }
      
      receipts.push(receipt);
    }

    if (receipts.length === 0) {
      return res.status(400).json({
        message: 'No se pudieron generar recibos porque no hay propiedades válidas con propietarios y alícuotas.',
      });
    }

    res.status(201).json({
      message: `Recibos generados exitosamente. ${receipts.length} recibos creados.`,
      receipts,
    });
  } catch (error) {
    console.error('Error al crear los recibos:', error);
    res.status(500).json({ message: 'Error al generar los recibos.', error: error.message });
  }
};

// Obtener todos los recibos de un usuario específico
exports.getReceiptsByUser = async (req, res) => {
  const { userId } = req.params;
  const userRole = req.user?.role; // Obtener el rol del usuario autenticado

  try {
    // Configurar el filtro básico
    const whereClause = { userId };
    
    // Si el usuario no es admin o superadmin, solo mostrar recibos visibles
    if (userRole && !['admin', 'superadmin'].includes(userRole.toLowerCase())) {
      whereClause.visible = true;
      console.log(`Usuario con rol ${userRole} solicitando recibos, filtrando para mostrar solo visibles`);
    } else {
      console.log(`Usuario con rol ${userRole} solicitando recibos, mostrando todos`);
    }

    const receipts = await Receipt.findAll({
      where: whereClause,
      include: [
        {
          model: require('../models/Condominium'), // Incluir información del condominio
          attributes: ['id', 'name'],
        },
        {
          model: Property, // Incluir información de la propiedad
          as: 'property',
          attributes: ['id', 'number', 'block', 'floor', 'type', 'status'],
        }
      ],
      order: [['createdAt', 'DESC']] // Ordenar por fecha de creación, más recientes primero
    });

    if (receipts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron recibos para este usuario.' });
    }

    res.status(200).json(receipts);
  } catch (error) {
    console.error('Error al obtener los recibos:', error);
    res.status(500).json({ message: 'Error al obtener los recibos.', error: error.message });
  }
};

// Obtener todos los recibos de un condominio específico
exports.getReceiptsByCondominium = async (req, res) => {
  const { condominiumId } = req.params;

  try {
    // Validar que condominiumId sea un número válido
    if (!condominiumId || isNaN(condominiumId)) {
      return res.status(400).json({ message: 'El ID del condominio es inválido.' });
    }

    console.log(`Buscando recibos para el condominio con ID: ${condominiumId}`);

    // Usar una consulta raw SQL para evitar problemas con columnas que puedan faltar
    const receipts = await sequelize.query(`
      SELECT r.id, r.amount, r.status, r."dueDate", r.pending_amount, r.credit_balance, r.visible, 
             r."userId", r."condominiumId", r."propertyId", r."createdAt", r."updatedAt",
             u.id AS "User.id", u.name AS "User.name", u.email AS "User.email",
             o.id AS "Owner.id", o."fullName" AS "Owner.fullName", o."phone" AS "Owner.phone"
      FROM "Receipts" r
      LEFT JOIN "Users" u ON r."userId" = u.id
      LEFT JOIN "Properties" p ON r."propertyId" = p.id
      LEFT JOIN "Owners" o ON p."ownerId" = o.id
      WHERE r."condominiumId" = :condominiumId
      ORDER BY r."createdAt" DESC
    `, {
      replacements: { condominiumId },
      type: sequelize.QueryTypes.SELECT,
      nest: true
    });

    console.log(`Recibos encontrados: ${receipts.length}`);

    if (receipts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron recibos para este condominio.' });
    }

    try {
      // Obtener las propiedades relacionadas
      const receiptIds = receipts.map(receipt => receipt.id);
      
      // Usar campos específicos en lugar de asterisco
      const receiptProperties = await sequelize.query(`
        SELECT r.id as "receiptId", p.id, p.number, p.block, p.floor, p.type, p.status
        FROM "Receipts" r
        LEFT JOIN "Properties" p ON r."propertyId" = p.id
        WHERE r.id IN (:receiptIds)
      `, {
        replacements: { receiptIds },
        type: sequelize.QueryTypes.SELECT
      });

      // Mapear las propiedades a los recibos
      const receiptPropertiesMap = receiptProperties.reduce((acc, record) => {
        if (record.id) { // Si hay propiedad asociada
          acc[record.receiptId] = {
            id: record.id,
            number: record.number,
            block: record.block,
            floor: record.floor,
            type: record.type,
            status: record.status
          };
        }
        return acc;
      }, {});

      // Agregar la información de las propiedades a los recibos
      const receiptsWithProperties = receipts.map(receipt => {
        if (receiptPropertiesMap[receipt.id]) {
          receipt.property = receiptPropertiesMap[receipt.id];
        } else {
          receipt.property = null;
        }
        return receipt;
      });

      return res.status(200).json(receiptsWithProperties);
    } catch (propertyError) {
      console.error('Error al cargar las propiedades, continuando con los recibos básicos:', propertyError);
      // Establecer propiedad en null para todos los recibos
      receipts.forEach(receipt => {
        receipt.property = null;
      });
      return res.status(200).json(receipts);
    }
  } catch (error) {
    console.error('Error al obtener los recibos:', error);
    res.status(500).json({ message: 'Error al obtener los recibos.', error: error.message });
  }
};

// Actualizar un recibo específico
exports.updateReceipt = async (req, res) => {
  const { id } = req.params;
  const { amount, dueDate, status, pending_amount, credit_balance } = req.body;

  try {
    const receipt = await Receipt.findByPk(id);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }


    // Actualizar los campos necesarios
    receipt.amount = amount;
    receipt.dueDate = dueDate;
    receipt.status = status;
    receipt.pending_amount = pending_amount;
    receipt.credit_balance = credit_balance;
    await receipt.save();

    res.status(200).json({ message: 'Recibo actualizado exitosamente.', receipt });
  } catch (error) {
    console.error('Error al actualizar el recibo:', error);
    res.status(500).json({ message: 'Error al actualizar el recibo.', error: error.message });
  }
};

// Eliminar un recibo específico
exports.deleteReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await Receipt.findByPk(id);
    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }

    await receipt.update({ status: 'anuled' });

    res.status(200).json({ message: 'Recibo eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el recibo:', error);
    res.status(500).json({ message: 'Error al eliminar el recibo.', error: error.message });
  }
};

// Obtener un recibo específico por ID
exports.getReceiptById = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  try {
    const receipt = await Receipt.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'number', 'block', 'floor', 'type', 'aliquot'],
          include: [
            {
              model: require('../models/Owner'),
              as: 'owner',
              attributes: ['id', 'fullName', 'phone', 'mobile']
            }
          ]
        },
        {
          model: require('../models/Condominium'),
          attributes: ['id', 'name'],
        },
        {
          model: require('../models/User'),
          attributes: ['id', 'name', 'email'],
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }

    // Verificar permisos basados en el rol
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      // Si es copropietario, verificar que el recibo le pertenezca
      if (receipt.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para ver este recibo.' });
      }
    }

    // Obtener los pagos asociados al recibo para calcular el monto pendiente real
    const Payment = require('../models/Payment');
    const payments = await Payment.findAll({
      where: {
        receiptId: receipt.id,
        status: ['verified', 'approved'] // Solo considerar pagos verificados o aprobados
      }
    });

    // Calcular el monto total pagado
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount);
    }, 0);

    // Calcular el monto pendiente real
    const realPendingAmount = Math.max(0, parseFloat(receipt.amount) - totalPaid);

    // Actualizar el pending_amount y status si es necesario
    if (receipt.pending_amount !== realPendingAmount) {
      receipt.pending_amount = realPendingAmount;
      if (realPendingAmount === 0) {
        receipt.status = 'paid';
      } else if (realPendingAmount < receipt.amount) {
        receipt.status = 'partial';
      }
      await receipt.save();
    }

    console.log('Detalles del recibo solicitado:', {
      id: receipt.id,
      amount: receipt.amount,
      totalPaid,
      pending_amount: realPendingAmount,
      status: receipt.status,
      userId: receipt.userId,
      requestingUserId: userId,
      requestingUserRole: userRole
    });

    res.status(200).json(receipt);
  } catch (error) {
    console.error('Error al obtener el recibo:', error);
    res.status(500).json({ message: 'Error al obtener el recibo.', error: error.message });
  }
};

// Cambiar la visibilidad de uno o varios recibos
exports.toggleVisibility = async (req, res) => {
  console.log('Recibida petición para cambiar visibilidad:', req.body);
  const { receiptIds, visible } = req.body;

  if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
    console.log('Error: receiptIds inválidos:', receiptIds);
    return res.status(400).json({ message: 'Se requiere un array de IDs de recibos.' });
  }

  try {
    console.log(`Intentando actualizar visibilidad de recibos: ${receiptIds.join(', ')} a ${visible}`);
    
    // Verificar que todos los IDs existan
    const receipts = await Receipt.findAll({
      where: { id: { [Op.in]: receiptIds } }
    });

    if (receipts.length !== receiptIds.length) {
      const foundIds = receipts.map(r => r.id);
      const missingIds = receiptIds.filter(id => !foundIds.includes(id));
      console.log('IDs no encontrados:', missingIds);
      return res.status(404).json({ 
        message: 'Algunos recibos no fueron encontrados.', 
        missingIds 
      });
    }

    // Actualizar la visibilidad de todos los recibos seleccionados
    const result = await Receipt.update(
      { visible: visible === true }, // Convertir a booleano explícitamente
      {
        where: { id: { [Op.in]: receiptIds } }
      }
    );

    console.log(`Visibilidad actualizada para ${result[0]} recibos: ${visible ? 'visibles' : 'ocultos'}`);

    res.status(200).json({ 
      message: `Visibilidad actualizada exitosamente para ${result[0]} recibos.`, 
      affectedReceipts: result[0]
    });
  } catch (error) {
    console.error('Error al cambiar la visibilidad de los recibos:', error);
    res.status(500).json({ message: 'Error al cambiar la visibilidad de los recibos.', error: error.message });
  }
};