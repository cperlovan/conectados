
const Expense = require('../models/Expense');
const Condominium = require('../models/Condominium');
const Supplier = require('../models/Supplier');
const Property = require('../models/Property');

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
  const { type, amount, description, date, supplierId, condominiumId } = req.body;

  try {
    const condominium = await Condominium.findByPk(condominiumId);
    if (!condominium) {
      return res.status(404).json({ message: 'Condominio no encontrado.' });
    }

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }

    const expense = await Expense.create({ type, amount, description, date, supplierId, condominiumId });
    res.status(201).json({ message: 'Gasto registrado exitosamente.', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el gasto.', error });
  }
};

// Obtener todos los gastos de un condominio
exports.getExpensesByCondominium = async (req, res) => {
  const { condominiumId } = req.params;

  try {
    const expenses = await Expense.findAll({
      where: { condominiumId },
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'No se encontraron gastos para este condominio.' });
    }

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los gastos.', error });
  }
};

// Obtener todos los gastos de una propiedad
exports.getExpensesByProperty = async (req, res) => {
  const { propertyId } = req.params;

  try {
    const expenses = await Expense.findAll({  
      where: { propertyId },
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'No se encontraron gastos para esta propiedad.' });
    }

    res.status(200).json(expenses); 
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los gastos.', error });
  }
};


// Actualizar un gasto
exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { type, amount, description, date, status } = req.body;

  try {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado.' });
    }

    await expense.update({ type, amount, description, date, status });
    res.status(200).json({ message: 'Gasto actualizado exitosamente.', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el gasto.', error });
  }
};

// Eliminar lógicamente un gasto
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado.' });
    }

    await expense.update({ status: 'inactive' });
    res.status(200).json({ message: 'Gasto eliminado.', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el gasto.', error });
  }
};
