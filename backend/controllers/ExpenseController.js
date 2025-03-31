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
    console.log(`Verificando todos los gastos del condominio ${condominiumId} para depuración`);
    
    // Primero obtener todos los gastos del condominio para verificar
    const todosLosGastos = await Expense.findAll({
      where: { 
        condominiumId,
        status: 'active'
      },
      raw: true
    });
    
    console.log(`Total de gastos activos en el condominio: ${todosLosGastos.length}`);
    if (todosLosGastos.length > 0) {
      // Mostrar las fechas de todos los gastos para depuración
      console.log("Fechas de todos los gastos:", todosLosGastos.map(g => ({ 
        id: g.id, 
        date: g.date, 
        dateType: typeof g.date,
        amount: g.amount
      })));
    }
    
    // Crear rango de fechas para el mes y año especificados
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    // Obtener el último día del mes (usando Date para calcular el último día)
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    // Formatear las fechas para que coincidan con el formato en la base de datos
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    console.log(`Buscando gastos entre ${formattedStartDate} y ${formattedEndDate} para condominio ${condominiumId}`);
    
    // Comprobar formato de fechas en la base de datos
    console.log("Comprobando formato de fechas en la DB:");
    if (todosLosGastos.length > 0) {
      const primeraFecha = todosLosGastos[0].date;
      console.log(`Ejemplo de fecha en DB: ${primeraFecha}, tipo: ${typeof primeraFecha}`);
      if (typeof primeraFecha === 'string') {
        console.log("Formato de fecha: string (YYYY-MM-DD)");
      } else if (primeraFecha instanceof Date) {
        console.log("Formato de fecha: objeto Date");
      }
    }
    
    // Si el formato de fecha es diferente, intentar otro enfoque
    // Primero intentar con string explicito con comodines SQL %
    const gastosFiltrados = todosLosGastos.filter(gasto => {
      if (!gasto.date) return false;
      
      const fechaGasto = new Date(gasto.date);
      const mesGasto = fechaGasto.getMonth() + 1; // 1-12
      const anioGasto = fechaGasto.getFullYear();
      
      return mesGasto === parseInt(month) && anioGasto === parseInt(year);
    });
    
    console.log(`Encontrados ${gastosFiltrados.length} gastos para el período después de filtrado manual`);
    
    if (gastosFiltrados.length > 0) {
      console.log("Gastos filtrados manualmente:", gastosFiltrados.map(g => ({
        id: g.id,
        date: g.date,
        amount: g.amount,
        description: g.description
      })));
    }
    
    // Calcular suma manualmente con los gastos filtrados
    let sumaManual = 0;
    gastosFiltrados.forEach(gasto => {
      const amount = parseFloat(gasto.amount);
      if (!isNaN(amount)) {
        sumaManual += amount;
      }
    });
    
    console.log(`Suma manual calculada: ${sumaManual}`);
    
    res.status(200).json({ 
      sum: sumaManual,
      month: parseInt(month),
      year: parseInt(year),
      condominiumId: parseInt(condominiumId),
      cantidadGastos: gastosFiltrados.length,
      gastosMuestra: gastosFiltrados.length > 0 ? gastosFiltrados.slice(0, Math.min(5, gastosFiltrados.length)) : []
    });
  } catch (error) {
    console.error('Error al calcular la suma de gastos:', error);
    res.status(500).json({ message: 'Error al calcular la suma de gastos.', error: error.message });
  }
};
