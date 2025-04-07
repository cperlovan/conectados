const Invoice = require('../models/Invoice');
const Budget = require('../models/Budget');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

const invoiceController = {
    // Crear una nueva factura
    createInvoice: async (req, res) => {
        try {
            const { supplierId, budgetId, amount, description, dueDate } = req.body;

            if (!supplierId || !budgetId || !amount || !description || !dueDate) {
                return res.status(400).json({ message: 'Todos los campos son requeridos' });
            }

            const budget = await Budget.findByPk(budgetId);
            if (!budget) {
                return res.status(404).json({ message: 'Presupuesto no encontrado' });
            }

            if (budget.status !== 'approved') {
                return res.status(400).json({ message: 'El presupuesto debe estar aprobado para crear una factura' });
            }

            const invoice = await Invoice.create({
                supplierId,
                budgetId,
                amount,
                description,
                dueDate,
                status: 'pending'
            });

            return res.status(201).json(invoice);
        } catch (error) {
            return res.status(500).json({ message: 'Error al crear la factura', error: error.message });
        }
    },

    // Obtener facturas según el rol del usuario
    getInvoices: async (req, res) => {
        try {
            const { role, id, condominiumId } = req.user;

            let invoices;
            if (role === 'admin' || role === 'superadmin') {
                invoices = await Invoice.findAll({
                    where: { condominiumId },
                    include: [
                        { model: Supplier, attributes: ['id', 'name'] },
                        { model: Budget, attributes: ['id', 'description', 'amount'] }
                    ]
                });
            } else if (role === 'proveedor') {
                const supplier = await Supplier.findOne({ where: { userId: id } });
                if (!supplier) {
                    return res.status(404).json({ message: 'Proveedor no encontrado' });
                }
                invoices = await Invoice.findAll({
                    where: { supplierId: supplier.id },
                    include: [
                        { model: Budget, attributes: ['id', 'description', 'amount'] }
                    ]
                });
            } else {
                return res.status(403).json({ message: 'No autorizado' });
            }

            // Calcular estadísticas
            const stats = {
                total: invoices.length,
                pending: invoices.filter(i => i.status === 'pending').length,
                paid: invoices.filter(i => i.status === 'paid').length,
                cancelled: invoices.filter(i => i.status === 'cancelled').length
            };

            return res.json({ invoices, stats });
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener las facturas', error: error.message });
        }
    },

    // Aprobar/Rechazar una factura (solo administradores)
    approveInvoice: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Solo los administradores pueden aprobar facturas' });
            }

            const { id } = req.params;
            const { status, notes } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Estado inválido' });
            }

            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            if (req.user.condominiumId !== invoice.condominiumId) {
                return res.status(403).json({ message: 'No tiene permisos para aprobar esta factura' });
            }

            await invoice.update({
                status,
                notes: notes || invoice.notes,
                visible: status === 'approved', // Solo hacer visible si está aprobada
                approvedBy: req.user.id,
                approvedAt: new Date()
            });

            res.json({
                message: `Factura ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`,
                invoice
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al aprobar/rechazar la factura',
                error: error.message
            });
        }
    },

    // Actualizar una factura (solo proveedores)
    updateInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, id: userId, condominiumId } = req.user;
            const updateData = req.body;

            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            if (role === 'proveedor') {
                const supplier = await Supplier.findOne({ where: { userId } });
                if (!supplier || supplier.id !== invoice.supplierId) {
                    return res.status(403).json({ message: 'No autorizado' });
                }
            } else if ((role === 'admin' || role === 'superadmin') && invoice.condominiumId !== condominiumId) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            await invoice.update(updateData);
            return res.json(invoice);
        } catch (error) {
            return res.status(500).json({ message: 'Error al actualizar la factura', error: error.message });
        }
    },

    // Eliminar una factura (solo proveedores)
    deleteInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, id: userId, condominiumId } = req.user;

            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            if (role === 'proveedor') {
                const supplier = await Supplier.findOne({ where: { userId } });
                if (!supplier || supplier.id !== invoice.supplierId) {
                    return res.status(403).json({ message: 'No autorizado' });
                }
            } else if ((role === 'admin' || role === 'superadmin') && invoice.condominiumId !== condominiumId) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            await invoice.destroy();
            return res.json({ message: 'Factura eliminada correctamente' });
        } catch (error) {
            return res.status(500).json({ message: 'Error al eliminar la factura', error: error.message });
        }
    },

    // Obtener una factura específica por ID
    getInvoiceById: async (req, res) => {
        try {
            const { id } = req.params;
            const { role, id: userId, condominiumId } = req.user;

            const invoice = await Invoice.findByPk(id, {
                include: [
                    { model: Supplier, attributes: ['id', 'name'] },
                    { model: Budget, attributes: ['id', 'description', 'amount'] }
                ]
            });

            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            if (role === 'proveedor') {
                const supplier = await Supplier.findOne({ where: { userId } });
                if (!supplier || supplier.id !== invoice.supplierId) {
                    return res.status(403).json({ message: 'No autorizado' });
                }
            } else if ((role === 'admin' || role === 'superadmin') && invoice.condominiumId !== condominiumId) {
                return res.status(403).json({ message: 'No autorizado' });
            }

            return res.json(invoice);
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener la factura', error: error.message });
        }
    }
};

module.exports = invoiceController; 