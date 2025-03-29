const Receipt = require('../models/Receipt');
const Property = require('../models/Property');
const Expense = require('../models/Expense');
const { Op } = require('sequelize');
const sequelize = require('../config/database');


// Crear un nuevo recibo basado en los gastos establecidos en la tabla Expense del mes actual
//OJO: HAY QUE DEFINIR SI EL CAMPO DUE DATE ES EL QUE MARCA LA FECHA QUE DEBO TENER EN CUENTA
exports.createReceipt = async (req, res) => {
  const { dueDate, condominiumId } = req.body;

  try {
    // Validar que todos los campos necesarios estén presentes
    if (!dueDate || !condominiumId) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Obtener todas las propiedades del condominio
    const properties = await Property.findAll({
      where: { condominiumId },
    });

    if (properties.length === 0) {
      return res.status(404).json({ message: 'No se encontraron propiedades para este condominio.' });
    }

    // Calcular la suma de las alícuotas
    const totalQuota = properties.reduce((sum, property) => sum + parseFloat(property.participationQuota), 0);
    console.log(`Suma de las alícuotas: ${totalQuota}`); // Depuración

    if (Math.abs(totalQuota - 100) > 0.01) {
      return res.status(400).json({
        message: `La suma de las alícuotas (${totalQuota}%) no es igual a 100%. Ajusta las alícuotas de las propiedades.`,
      });
    }

    // Calcular el total de los gastos del mes actual del condominio mediante el campo date
    const currentMonth = new Date().getMonth() + 1; // Mes actual (1-12)
    const currentYear = new Date().getFullYear(); // Año actual
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

    // Calcular y crear recibos individuales para cada propiedad
    const receipts = [];
    for (const property of properties) {
      const individualAmount = (totalExpenses * parseFloat(property.participationQuota)) / 100; // Convertir a número
      console.log(`Calculando monto para propiedad ${property.id}: (${totalExpenses} * ${property.participationQuota}) / 100 = ${individualAmount}`); // Depuración

      const receipt = await Receipt.create({
        amount: individualAmount,
        dueDate,
        userId: property.Owner?.userId || property.ownerId, // Asignar el userId del Owner o usar ownerId si está disponible
        condominiumId,
        pending_amount: individualAmount, // Inicializar el saldo pendiente con el monto individual
      });

      receipts.push(receipt);
    }

    res.status(201).json({
      message: 'Recibos generados exitosamente.',
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

  try {
    const receipts = await Receipt.findAll({
      where: { userId },
      include: [
        {
          model: require('../models/Condominium'), // Incluir información del condominio
          attributes: ['id', 'name'],
        },
      ],
    });

    if (receipts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron recibos para este usuario.' });
    }

    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los recibos.', error });
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

    const receipts = await Receipt.findAll({
      where: { condominiumId },
      include: [
        {
          model: require('../models/User'), // Incluir información del usuario
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    console.log(`Recibos encontrados:`, receipts);

    if (receipts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron recibos para este condominio.' });
    }

    res.status(200).json(receipts);
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

  try {
    const receipt = await Receipt.findByPk(id, {
      include: [
        {
          model: Property, // Incluir información de la propiedad
          as: 'property',
          attributes: ['id', 'name', 'number', 'block', 'address']
        },
        {
          model: require('../models/Condominium'), // Incluir información del condominio
          attributes: ['id', 'name'],
        },
        {
          model: require('../models/User'), // Incluir información del usuario
          attributes: ['id', 'name', 'email'],
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Recibo no encontrado.' });
    }

    res.status(200).json(receipt);
  } catch (error) {
    console.error('Error al obtener el recibo:', error);
    res.status(500).json({ message: 'Error al obtener el recibo.', error: error.message });
  }
};