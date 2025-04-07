const Expense = require('../models/Expense');
const Condominium = require('../models/Condominium');
const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
  try {
    const { type, amount, description, date, supplierId, condominiumId } = req.body;
    
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
    res.status(500).json({ message: 'Error al registrar el gasto.', error: error.message });
  }
};

// Obtener todos los gastos de un condominio, con opción de filtrar por mes y año
exports.getExpensesByCondominium = async (req, res) => {
  const { condominiumId } = req.params;
  const { month, year } = req.query;

  console.log(`Solicitud de gastos para condominio ${condominiumId}, mes=${month}, año=${year}`);

  try {
    // Primero obtener todos los gastos del condominio
    const allExpenses = await Expense.findAll({
      where: { condominiumId },
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name'],
        },
      ],
      order: [['date', 'DESC']]
    });
    
    console.log(`Total de gastos encontrados para el condominio ${condominiumId}: ${allExpenses.length}`);
    
    // Si se proporcionan mes y año, filtrar manualmente los resultados
    let filteredExpenses = allExpenses;
    
    if (month && year) {
      const monthInt = parseInt(month);
      const yearInt = parseInt(year);
      
      console.log(`Filtrando por mes ${monthInt} y año ${yearInt}`);
      
      filteredExpenses = allExpenses.filter(expense => {
        if (!expense.date) return false;
        
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth() + 1; // 1-12
        const expenseYear = expenseDate.getFullYear();
        
        // Mostrar algunos detalles para depuración
        if (expense.id % 10 === 0) { // Solo mostrar algunos para no llenar el log
          console.log(`Gasto ID ${expense.id}: fecha=${expense.date}, mes=${expenseMonth}, año=${expenseYear}`);
        }
        
        return expenseMonth === monthInt && expenseYear === yearInt;
      });
    }
    
    console.log(`Gastos filtrados: ${filteredExpenses.length}`);
    
    // Mostrar más detalles si hay resultados
    if (filteredExpenses.length > 0) {
      console.log("Muestra de gastos filtrados:", 
        filteredExpenses.slice(0, Math.min(5, filteredExpenses.length)).map(e => ({
          id: e.id,
          amount: e.amount,
          date: e.date instanceof Date ? e.date.toISOString() : e.date,
          description: e.description
        }))
      );
    }

    res.status(200).json(filteredExpenses);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ message: 'Error al obtener los gastos.', error: error.message });
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
    res.status(500).json({ message: 'Error al obtener los gastos.', error: error.message });
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
    res.status(500).json({ message: 'Error al actualizar el gasto.', error: error.message });
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
    res.status(500).json({ message: 'Error al eliminar el gasto.', error: error.message });
  }
};

// Obtener la suma de gastos de un condominio para un mes y año específicos
exports.getExpensesSum = async (req, res) => {
  console.log("Recibida solicitud de suma de gastos con query:", req.query);
  const { condominiumId, month, year } = req.query;

  if (!condominiumId || !month || !year) {
    return res.status(400).json({ message: 'Se requieren los parámetros condominiumId, month y year.' });
  }

  try {
    // Crear rango de fechas para el mes y año especificados
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59));

    console.log(`Buscando gastos entre ${startDate.toISOString()} y ${endDate.toISOString()} para condominio ${condominiumId}`);

    // Obtener todos los gastos activos del condominio para el mes y año especificados
    const gastos = await Expense.findAll({
      where: {
        condominiumId: parseInt(condominiumId),
        status: 'active',
        date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      raw: true
    });

    console.log(`Encontrados ${gastos.length} gastos para el período`);
    
    if (gastos.length > 0) {
      console.log("Muestra de gastos encontrados:", gastos.map(g => ({
        id: g.id,
        date: g.date,
        amount: g.amount,
        description: g.description
      })));
    }

    // Calcular suma de los gastos encontrados
    const sumaTotal = gastos.reduce((total, gasto) => {
      const amount = parseFloat(gasto.amount);
      return !isNaN(amount) ? total + amount : total;
    }, 0);

    console.log(`Suma total calculada: ${sumaTotal}`);

    res.status(200).json({
      sum: sumaTotal,
      month: parseInt(month),
      year: parseInt(year),
      condominiumId: parseInt(condominiumId),
      cantidadGastos: gastos.length,
      gastosMuestra: gastos.map(g => ({
        id: g.id,
        date: g.date,
        amount: g.amount,
        description: g.description
      }))
    });
  } catch (error) {
    console.error('Error al calcular la suma de gastos:', error);
    res.status(500).json({ message: 'Error al calcular la suma de gastos.', error: error.message });
  }
};
