const SupplierPayment = require('../models/SupplierPayment');
const Invoice = require('../models/Invoice');
const { Supplier } = require('../models/Supplier');
const Expense = require('../models/Expense');
const { Op } = require('sequelize');

// Obtener todos los pagos a proveedores de un condominio
exports.getSupplierPaymentsByCondominium = async (req, res) => {
  try {
    const { condominiumId } = req.params;

    // Verificar que el usuario tiene acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId != condominiumId) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a estos datos' });
    }

    const payments = await SupplierPayment.findAll({
      where: { condominiumId },
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'number', 'amount', 'status', 'budgetId'],
          include: {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type']
          }
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error al obtener pagos a proveedores:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener un pago específico por ID
exports.getSupplierPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'number', 'amount', 'status', 'budgetId'],
          include: {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'type']
          }
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Verificar que el usuario tiene acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId != payment.condominiumId) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a estos datos' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error al obtener pago a proveedor:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Crear un nuevo pago a proveedor
exports.createSupplierPayment = async (req, res) => {
  try {
    const { 
      invoiceId, supplierId, condominiumId, amount, paymentMethod, 
      referenceNumber, paymentDate, description, status 
    } = req.body;

    // Verificar que el usuario tiene acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId != condominiumId) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a estos datos' });
    }

    // Verificar que la factura existe
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    // Verificar que la factura pertenece al condominio
    if (invoice.condominiumId != condominiumId) {
      return res.status(400).json({ message: 'La factura no pertenece al condominio especificado' });
    }

    // Verificar que la factura está en estado 'approved'
    if (invoice.status !== 'approved') {
      return res.status(400).json({ message: 'La factura debe estar aprobada para poder realizar el pago' });
    }

    // Crear el pago
    const payment = await SupplierPayment.create({
      invoiceId,
      supplierId,
      condominiumId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate: paymentDate || new Date(),
      description,
      status: status || 'completed'
    });

    // Actualizar el estado de la factura a 'paid'
    await invoice.update({ 
      status: 'paid',
      paymentDate: paymentDate || new Date()
    });

    // Registrar también como un gasto del condominio
    const expense = await Expense.create({
      type: 'common',
      amount,
      description: `Pago a proveedor: ${description || 'Pago de factura ' + invoice.number}`,
      date: paymentDate || new Date(),
      supplierId,
      condominiumId,
      category: 'supplier_payment',
      status: 'active',
      metadata: JSON.stringify({
        supplierPaymentId: payment.id,
        invoiceId,
        paymentMethod,
        referenceNumber
      })
    });

    // Devolver el pago creado junto con el gasto asociado
    res.status(201).json({ 
      payment, 
      expense,
      message: 'Pago registrado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear pago a proveedor:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Actualizar un pago existente
exports.updateSupplierPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, referenceNumber, paymentDate, description, status } = req.body;

    // Verificar que el pago existe
    const payment = await SupplierPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Verificar que el usuario tiene acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId != payment.condominiumId) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este pago' });
    }

    // Solo permitir actualizar ciertos campos
    const updatedPayment = await payment.update({
      paymentMethod: paymentMethod || payment.paymentMethod,
      referenceNumber,
      paymentDate: paymentDate || payment.paymentDate,
      description,
      status: status || payment.status
    });

    // Si se canceló el pago, actualizar la factura a 'approved' nuevamente
    if (status === 'cancelled') {
      const invoice = await Invoice.findByPk(payment.invoiceId);
      if (invoice) {
        await invoice.update({ 
          status: 'approved',
          paymentDate: null
        });
      }
    }

    res.status(200).json({ 
      payment: updatedPayment,
      message: 'Pago actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar pago a proveedor:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Eliminar un pago (marcar como cancelado)
exports.deleteSupplierPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el pago existe
    const payment = await SupplierPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Verificar que el usuario tiene acceso al condominio
    if (req.user.role !== 'superadmin' && req.user.condominiumId != payment.condominiumId) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este pago' });
    }

    // Solo permitir eliminar pagos que no estén cancelados
    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'Este pago ya ha sido cancelado' });
    }

    // Marcar como cancelado en lugar de eliminar físicamente
    await payment.update({ status: 'cancelled' });

    // Actualizar la factura a 'approved' nuevamente
    const invoice = await Invoice.findByPk(payment.invoiceId);
    if (invoice) {
      await invoice.update({ 
        status: 'approved',
        paymentDate: null
      });
    }

    // Buscar y desactivar el gasto asociado
    const expense = await Expense.findOne({
      where: {
        category: 'supplier_payment',
        metadata: {
          [Op.like]: `%"supplierPaymentId":${payment.id}%`
        }
      }
    });

    if (expense) {
      await expense.update({ status: 'inactive' });
    }

    res.status(200).json({ message: 'Pago cancelado exitosamente' });
  } catch (error) {
    console.error('Error al cancelar pago a proveedor:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener pagos a un proveedor específico (para que el proveedor vea sus pagos)
exports.getSupplierPaymentsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Verificar que el usuario es el proveedor correcto o un admin/superadmin
    if (req.user.role === 'supplier' || req.user.role === 'proveedor') {
      const supplier = await Supplier.findOne({ where: { userId: req.user.id } });
      
      if (!supplier || supplier.id != supplierId) {
        return res.status(403).json({ message: 'No tienes permisos para acceder a estos datos' });
      }
    }
    
    const payments = await SupplierPayment.findAll({
      where: { supplierId },
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'number', 'amount', 'status', 'budgetId'],
        }
      ],
      order: [['paymentDate', 'DESC']]
    });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error al obtener pagos del proveedor:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}; 