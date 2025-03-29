const Invoice = require('../models/Invoice');
const Budget = require('../models/Budget');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

const invoiceController = {
    // Crear una nueva factura
    createInvoice: async (req, res) => {
        try {
            const { budgetId, number, amount, notes } = req.body;
            console.log('Datos recibidos para crear factura:', { budgetId, number, amount, notes });

            // Validar campos requeridos
            if (!budgetId || !number || !amount) {
                return res.status(400).json({ message: 'Los campos budgetId, number y amount son requeridos' });
            }

            // Verificar que el budget existe
            const budget = await Budget.findByPk(budgetId);
            if (!budget) {
                return res.status(404).json({ message: 'Presupuesto no encontrado' });
            }

            // Obtener el supplier y condominium del presupuesto
            const supplier = await Supplier.findByPk(budget.supplierId);
            if (!supplier) {
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            }

            // Verificar que la factura no esté duplicada
            const existingInvoice = await Invoice.findOne({ where: { number } });
            if (existingInvoice) {
                return res.status(400).json({ message: `Ya existe una factura con el número ${number}` });
            }

            // Crear la factura
            const invoice = await Invoice.create({
                budgetId,
                number,
                amount,
                notes,
                supplierId: budget.supplierId,
                condominiumId: budget.condominiumId,
                status: 'pending',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días después
            });

            res.status(201).json({
                message: 'Factura creada exitosamente',
                invoice
            });
        } catch (error) {
            console.error('Error al crear factura:', error);
            res.status(500).json({
                message: 'Error al crear la factura',
                error: error.message
            });
        }
    },

    // Obtener todas las facturas de un proveedor
    getInvoicesBySupplier: async (req, res) => {
        try {
            const { supplierId } = req.params;
            
            if (!supplierId || isNaN(supplierId)) {
                return res.status(400).json({ message: 'ID de proveedor inválido' });
            }

            // Verificar que el proveedor existe
            const supplier = await Supplier.findByPk(supplierId);
            if (!supplier) {
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            }

            // Verificar que el proveedor pertenece al mismo condominio que el usuario
            if (supplier.condominiumId !== req.user.condominiumId) {
                return res.status(403).json({ message: 'No tiene permisos para acceder a este proveedor' });
            }

            const invoices = await Invoice.findAll({
                where: { supplierId },
                include: [
                    {
                        model: Budget,
                        attributes: ['id', 'title', 'amount', 'status']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(invoices);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            res.status(500).json({
                message: 'Error al obtener las facturas',
                error: error.message
            });
        }
    },

    // Obtener todas las facturas de un condominio
    getInvoicesByCondominium: async (req, res) => {
        try {
            const { condominiumId } = req.params;
            
            if (!condominiumId || isNaN(condominiumId)) {
                return res.status(400).json({ message: 'ID de condominio inválido' });
            }

            // Verificar que el usuario pertenece al condominio
            if (req.user.condominiumId !== parseInt(condominiumId)) {
                return res.status(403).json({ message: 'No tiene permisos para acceder a este condominio' });
            }

            const invoices = await Invoice.findAll({
                where: { condominiumId },
                include: [
                    {
                        model: Budget,
                        attributes: ['id', 'title', 'amount', 'status']
                    },
                    {
                        model: Supplier,
                        attributes: ['id', 'name', 'type', 'status']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(invoices);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            res.status(500).json({
                message: 'Error al obtener las facturas',
                error: error.message
            });
        }
    },

    // Obtener una factura por ID
    getInvoiceById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const invoice = await Invoice.findByPk(id, {
                include: [
                    {
                        model: Budget,
                        attributes: ['id', 'title', 'description', 'amount', 'status']
                    },
                    {
                        model: Supplier,
                        attributes: ['id', 'name', 'type', 'status', 'contactInfo']
                    }
                ]
            });

            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            // Verificar que el usuario pertenece al condominio de la factura
            if (req.user.condominiumId !== invoice.condominiumId) {
                return res.status(403).json({ message: 'No tiene permisos para acceder a esta factura' });
            }

            res.json(invoice);
        } catch (error) {
            console.error('Error al obtener factura:', error);
            res.status(500).json({
                message: 'Error al obtener la factura',
                error: error.message
            });
        }
    },

    // Actualizar una factura
    updateInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, paymentDate, notes } = req.body;
            
            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            // Verificar que el usuario pertenece al condominio de la factura
            if (req.user.condominiumId !== invoice.condominiumId) {
                return res.status(403).json({ message: 'No tiene permisos para actualizar esta factura' });
            }

            // Actualizar solo los campos proporcionados
            const updateData = {};
            if (status) updateData.status = status;
            if (paymentDate) updateData.paymentDate = paymentDate;
            if (notes !== undefined) updateData.notes = notes;

            await invoice.update(updateData);

            res.json({
                message: 'Factura actualizada exitosamente',
                invoice: await Invoice.findByPk(id)
            });
        } catch (error) {
            console.error('Error al actualizar factura:', error);
            res.status(500).json({
                message: 'Error al actualizar la factura',
                error: error.message
            });
        }
    },

    // Eliminar una factura
    deleteInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            
            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                return res.status(404).json({ message: 'Factura no encontrada' });
            }

            // Verificar que el usuario pertenece al condominio de la factura
            if (req.user.condominiumId !== invoice.condominiumId) {
                return res.status(403).json({ message: 'No tiene permisos para eliminar esta factura' });
            }

            await invoice.destroy();
            res.json({ message: 'Factura eliminada exitosamente' });
        } catch (error) {
            console.error('Error al eliminar factura:', error);
            res.status(500).json({
                message: 'Error al eliminar la factura',
                error: error.message
            });
        }
    }
};

module.exports = invoiceController; 