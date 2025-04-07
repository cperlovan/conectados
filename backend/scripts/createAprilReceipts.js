const { sequelize, Op } = require('../config/database')
const { Receipt, Payment, User, Property } = require('../relations')

async function createAprilReceipts() {
  try {
    console.log('Iniciando creación de recibos de abril 2025...')

    // Obtener todas las propiedades activas con sus usuarios
    const properties = await Property.findAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'credit_amount']
      }]
    })

    console.log(`Encontradas ${properties.length} propiedades activas`)

    // Crear recibos y procesar pagos
    const results = {
      receiptsCreated: 0,
      automaticPayments: 0,
      pendingReceipts: 0,
      totalAmount: 0,
      creditsUsed: 0
    }

    // Iniciar transacción
    const transaction = await sequelize.transaction()

    try {
      for (const property of properties) {
        if (!property.user) {
          console.log(`Advertencia: Propiedad ${property.number} no tiene usuario asignado`)
          continue
        }

        // Crear recibo para abril 2025
        const receipt = await Receipt.create({
          amount: 2447.28, // Monto fijo para abril
          status: 'pending',
          dueDate: '2025-04-30',
          pending_amount: 2447.28,
          credit_balance: 0,
          visible: true,
          userId: property.user.id,
          condominiumId: property.condominiumId,
          propertyId: property.id,
          month: 4,
          year: 2025
        }, { transaction })

        results.receiptsCreated++
        results.totalAmount += receipt.amount

        // Verificar si el usuario tiene suficiente crédito
        const userCredit = parseFloat(property.user.credit_amount)
        
        if (userCredit >= receipt.amount) {
          // Crear pago automático usando el crédito
          await Payment.create({
            amount: receipt.amount,
            receiptId: receipt.id,
            userId: property.user.id,
            paymentDate: new Date(),
            status: 'completed',
            method: 'credit',
            condominiumId: property.condominiumId,
            payment_details: {
              reference: `AUTO-CREDIT-${receipt.id}`,
              notes: 'Pago automático con crédito disponible',
              date: new Date(),
              credit_applied: receipt.amount
            }
          }, { transaction })

          // Actualizar el recibo
          await receipt.update({
            status: 'paid',
            pending_amount: 0
          }, { transaction })

          // Actualizar el crédito del usuario
          await property.user.update({
            credit_amount: userCredit - receipt.amount
          }, { transaction })

          results.automaticPayments++
          results.creditsUsed += receipt.amount

          console.log(`Pago automático procesado para propiedad ${property.number}, usuario ${property.user.email}`)
        } else {
          results.pendingReceipts++
          console.log(`Crédito insuficiente para propiedad ${property.number}, usuario ${property.user.email}`)
        }
      }

      await transaction.commit()

      // Mostrar resumen
      console.log('\nResumen de la operación:')
      console.log('------------------------')
      console.log(`Recibos creados: ${results.receiptsCreated}`)
      console.log(`Pagos automáticos: ${results.automaticPayments}`)
      console.log(`Recibos pendientes: ${results.pendingReceipts}`)
      console.log(`Monto total: $${results.totalAmount.toFixed(2)}`)
      console.log(`Créditos utilizados: $${results.creditsUsed.toFixed(2)}`)

      // Mostrar créditos restantes
      console.log('\nCréditos restantes por usuario:')
      const users = await User.findAll({
        where: {
          credit_amount: {
            [Op.gt]: 0
          }
        },
        attributes: ['email', 'credit_amount']
      })

      users.forEach(user => {
        console.log(`${user.email}: $${parseFloat(user.credit_amount).toFixed(2)}`)
      })

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Error durante la operación:', error)
    throw error
  }
}

// Ejecutar el script
createAprilReceipts()
  .then(() => {
    console.log('Script completado exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error al ejecutar el script:', error)
    process.exit(1)
  }) 