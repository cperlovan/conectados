const { sequelize, Op } = require('../config/database');
const { Receipt, Payment, User } = require('../relations');

async function resetMarchPayments() {
  try {
    // Obtener todos los recibos de marzo 2025
    const receipts = await Receipt.findAll({
      where: {
        month: 3,
        year: 2025
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'credit_amount']
      }]
    });

    console.log(`\n=== Resumen Inicial ===`);
    console.log(`Recibos encontrados: ${receipts.length}`);

    // Eliminar pagos asociados
    for (const receipt of receipts) {
      const payment = await Payment.findOne({
        where: { receiptId: receipt.id }
      });

      if (payment) {
        // Restar el excedente del crédito del usuario
        const user = await User.findByPk(payment.userId);
        if (user) {
          const excessAmount = payment.payment_details.excess_amount || 0;
          const newCreditAmount = Math.max(0, parseFloat(user.credit_amount || 0) - excessAmount);
          await user.update({ credit_amount: newCreditAmount });
          console.log(`Actualizado crédito de ${user.email}: ${newCreditAmount}`);
        }

        // Eliminar el pago
        await payment.destroy();
        console.log(`Eliminado pago para recibo ${receipt.id}`);
      }

      // Resetear el recibo a pendiente
      await receipt.update({
        status: 'pending',
        pending_amount: receipt.amount
      });
      console.log(`Reseteado recibo ${receipt.id} a pendiente`);
    }

    // Mostrar créditos finales
    console.log('\n=== Créditos Finales ===');
    const usersWithCredit = await User.findAll({
      where: {
        credit_amount: {
          [Op.gt]: 0
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

resetMarchPayments(); 