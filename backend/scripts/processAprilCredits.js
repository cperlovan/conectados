const { Receipt, Payment, User } = require('../relations');
const sequelize = require('../config/database');

async function processAprilCredits() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Iniciando procesamiento de créditos para abril 2025...');
    
    // Obtener todos los recibos pendientes de abril 2025
    const receipts = await Receipt.findAll({
      where: {
        month: 4,
        year: 2025,
        status: 'pending'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'credit_amount']
        },
        {
          model: require('../models/Property'),
          as: 'property',
          attributes: ['number']
        }
      ],
      transaction
    });

    console.log(`Encontrados ${receipts.length} recibos pendientes para abril 2025`);

    // Procesar cada recibo
    for (const receipt of receipts) {
      const user = receipt.User;
      if (!user) {
        console.log(`Recibo ${receipt.id} no tiene usuario asociado, saltando...`);
        continue;
      }

      console.log(`\nProcesando recibo ${receipt.id} para ${user.name || user.email}:`);
      console.log(`- Monto del recibo: $${receipt.amount}`);
      console.log(`- Crédito disponible: $${user.credit_amount}`);

      const receiptAmount = parseFloat(receipt.amount);
      const creditAmount = parseFloat(user.credit_amount);

      if (creditAmount >= receiptAmount) {
        // El usuario tiene suficiente crédito para cubrir todo el recibo
        console.log('- Crédito suficiente para cubrir el recibo completo');
        
        // Crear el pago
        await Payment.create({
          amount: receiptAmount,
          method: 'mobile_payment',
          status: 'approved',
          receiptId: receipt.id,
          condominiumId: receipt.condominiumId,
          userId: user.id,
          payment_details: {
            reference: `CRED-${receipt.id}`,
            notes: 'Pago automático con crédito disponible',
            date: new Date(),
            credit_applied: receiptAmount
          }
        }, { transaction });

        // Actualizar el recibo
        await receipt.update({
          status: 'paid',
          pending_amount: 0
        }, { transaction });

        // Actualizar el crédito del usuario
        await user.update({
          credit_amount: (creditAmount - receiptAmount).toFixed(2)
        }, { transaction });

        console.log(`- Pago procesado: $${receiptAmount}`);
        console.log(`- Nuevo crédito disponible: $${(creditAmount - receiptAmount).toFixed(2)}`);
      } else if (creditAmount > 0) {
        // El usuario tiene crédito pero no es suficiente para cubrir todo el recibo
        console.log('- Crédito parcial disponible');
        
        // Crear el pago parcial
        await Payment.create({
          amount: creditAmount,
          method: 'mobile_payment',
          status: 'approved',
          receiptId: receipt.id,
          condominiumId: receipt.condominiumId,
          userId: user.id,
          payment_details: {
            reference: `CRED-${receipt.id}`,
            notes: 'Pago parcial automático con crédito disponible',
            date: new Date(),
            credit_applied: creditAmount
          }
        }, { transaction });

        // Actualizar el recibo
        await receipt.update({
          status: 'partial',
          pending_amount: (receiptAmount - creditAmount).toFixed(2)
        }, { transaction });

        // Actualizar el crédito del usuario
        await user.update({
          credit_amount: 0
        }, { transaction });

        console.log(`- Pago parcial procesado: $${creditAmount}`);
        console.log(`- Monto pendiente: $${(receiptAmount - creditAmount).toFixed(2)}`);
      } else {
        console.log('- No hay crédito disponible para este usuario');
      }
    }

    await transaction.commit();
    console.log('\nProcesamiento de créditos completado exitosamente');
  } catch (error) {
    await transaction.rollback();
    console.error('Error durante el procesamiento:', error);
  }
}

// Ejecutar el script
processAprilCredits(); 