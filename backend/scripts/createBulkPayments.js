const { sequelize, Op } = require('../config/database');
const { Receipt, Payment, User, Property } = require('../relations');

// Configuración
const CONFIG = {
  excessAmount: 100, // Monto de excedente por defecto
  paymentMethod: 'bank_transfer',
  defaultStatus: 'approved'
};

async function createBulkPaymentsWithExcess(options = {}) {
  const {
    month = 3,
    year = 2025,
    excessAmount = CONFIG.excessAmount,
    paymentMethod = CONFIG.paymentMethod,
    status = CONFIG.defaultStatus
  } = options;

  try {
    // Obtener todos los recibos con información de propiedad y usuario
    const receipts = await Receipt.findAll({
      where: {
        month,
        year
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'credit_amount']
      }, {
        model: Property,
        as: 'property',
        attributes: ['id', 'number', 'aliquot']
      }],
      order: [
        ['userId', 'ASC'],
        ['id', 'ASC']
      ]
    });

    console.log(`\n=== Resumen Inicial ===`);
    console.log(`Mes: ${month}/${year}`);
    console.log(`Total de recibos encontrados: ${receipts.length}`);

    if (receipts.length > 0) {
      // Resumen por estado
      console.log('\nEstado de los recibos:');
      const statusCount = receipts.reduce((acc, receipt) => {
        acc[receipt.status] = (acc[receipt.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`${status}: ${count} recibos`);
      });

      // Resumen por usuario
      console.log('\nResumen por usuario:');
      const userSummary = receipts.reduce((acc, receipt) => {
        const email = receipt.User.email;
        if (!acc[email]) {
          acc[email] = {
            propiedades: new Set(),
            totalRecibos: 0,
            montoTotal: 0
          };
        }
        if (receipt.property) {
          acc[email].propiedades.add(receipt.property.number);
        }
        acc[email].totalRecibos++;
        acc[email].montoTotal += parseFloat(receipt.amount);
        return acc;
      }, {});

      Object.entries(userSummary).forEach(([email, data]) => {
        console.log(`\nUsuario: ${email}`);
        console.log(`Propiedades: ${Array.from(data.propiedades).join(', ')}`);
        console.log(`Total recibos: ${data.totalRecibos}`);
        console.log(`Monto total: ${data.montoTotal.toFixed(2)}`);
      });
    }

    // Solo procesar los recibos pendientes
    const pendingReceipts = receipts.filter(receipt => receipt.status === 'pending');
    console.log(`\n=== Procesamiento de Pagos ===`);
    console.log(`Recibos pendientes a procesar: ${pendingReceipts.length}`);
    console.log(`Excedente a aplicar por recibo: ${excessAmount}`);

    // Resumen de procesamiento
    const summary = {
      procesados: 0,
      montoTotal: 0,
      excedenteTotal: 0,
      pagosPorUsuario: {}
    };

    // Para cada recibo pendiente, crear un pago con excedente
    for (const receipt of pendingReceipts) {
      const originalAmount = parseFloat(receipt.amount);
      const totalPayment = originalAmount + excessAmount;

      console.log(`\nProcesando recibo ${receipt.id}:`);
      console.log(`Usuario: ${receipt.User.email}`);
      if (receipt.property) {
        console.log(`Propiedad: ${receipt.property.number}`);
      }
      console.log(`Monto original: ${originalAmount}`);
      console.log(`Monto con excedente: ${totalPayment}`);

      // Crear el pago
      const payment = await Payment.create({
        amount: totalPayment,
        method: paymentMethod,
        status: status,
        receiptId: receipt.id,
        condominiumId: receipt.condominiumId,
        userId: receipt.userId,
        payment_details: {
          reference: `AUTO-${receipt.id}`,
          notes: `Pago automático con excedente de ${excessAmount} para pruebas`,
          date: new Date(),
          credit_applied: 0,
          excess_amount: excessAmount,
          property_number: receipt.property ? receipt.property.number : 'N/A'
        }
      });

      console.log(`Pago creado: ID ${payment.id}`);

      // Actualizar el recibo
      await receipt.update({
        status: 'paid',
        pending_amount: 0
      });

      // Obtener el usuario actualizado antes de modificar su crédito
      const currentUser = await User.findByPk(receipt.userId);
      const newCreditAmount = parseFloat(currentUser.credit_amount || 0) + excessAmount;
      
      // Actualizar el crédito del usuario
      await currentUser.update({
        credit_amount: newCreditAmount
      });

      console.log(`Crédito actualizado para usuario ${receipt.User.email}: ${newCreditAmount}`);

      // Actualizar resumen
      summary.procesados++;
      summary.montoTotal += totalPayment;
      summary.excedenteTotal += excessAmount;

      if (!summary.pagosPorUsuario[receipt.User.email]) {
        summary.pagosPorUsuario[receipt.User.email] = {
          pagos: 0,
          montoTotal: 0,
          excedenteTotal: 0,
          propiedades: new Set()
        };
      }
      summary.pagosPorUsuario[receipt.User.email].pagos++;
      summary.pagosPorUsuario[receipt.User.email].montoTotal += totalPayment;
      summary.pagosPorUsuario[receipt.User.email].excedenteTotal += excessAmount;
      if (receipt.property) {
        summary.pagosPorUsuario[receipt.User.email].propiedades.add(receipt.property.number);
      }
    }

    // Mostrar resumen final
    console.log('\n=== Resumen Final ===');
    console.log(`Total recibos procesados: ${summary.procesados}`);
    console.log(`Monto total procesado: ${summary.montoTotal.toFixed(2)}`);
    console.log(`Excedente total aplicado: ${summary.excedenteTotal.toFixed(2)}`);

    if (Object.keys(summary.pagosPorUsuario).length > 0) {
      console.log('\nResumen por usuario:');
      Object.entries(summary.pagosPorUsuario).forEach(([email, data]) => {
        console.log(`\nUsuario: ${email}`);
        console.log(`Propiedades: ${Array.from(data.propiedades).join(', ')}`);
        console.log(`Total pagos: ${data.pagos}`);
        console.log(`Monto total: ${data.montoTotal.toFixed(2)}`);
        console.log(`Excedente total: ${data.excedenteTotal.toFixed(2)}`);
      });
    }

    // Mostrar créditos finales
    console.log('\n=== Créditos Finales ===');
    const usersWithCredit = await User.findAll({
      where: {
        credit_amount: {
          [sequelize.Op.gt]: 0
        }
      },
      attributes: ['email', 'credit_amount']
    });

    usersWithCredit.forEach(user => {
      console.log(`${user.email}: ${parseFloat(user.credit_amount).toFixed(2)}`);
    });

    console.log('\nProceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar el script con la configuración por defecto
createBulkPaymentsWithExcess(); 