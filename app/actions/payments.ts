'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Payment, PaymentStatus, PaymentUpdateResponse } from '../types/payment'

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

/**
 * Obtiene el token de las cookies
 */
async function getTokenFromCookies() {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || ''
  } catch (error) {
    console.error('Error al obtener token de cookies:', error)
    return ''
  }
}

/**
 * Server Action para actualizar el estado de un pago
 * Esta función se ejecuta en el servidor, lo que garantiza que la actualización
 * se realice correctamente incluso si el cliente tiene problemas
 */
export async function updatePaymentStatus(paymentId: number, newStatus: PaymentStatus): Promise<PaymentUpdateResponse> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      throw new Error('No autorizado')
    }

    // 1. Obtener el pago actual
    const getPaymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!getPaymentResponse.ok) {
      throw new Error('Error al obtener información del pago')
    }

    const currentPayment: Payment = await getPaymentResponse.json()

    // 2. Actualizar el estado del pago
    const updatePaymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...currentPayment,
        status: newStatus
      })
    })

    if (!updatePaymentResponse.ok) {
      throw new Error('Error al actualizar el estado del pago')
    }

    const updatedPayment: Payment = await updatePaymentResponse.json()

    // 3. Actualizar el recibo si es necesario
    if (currentPayment.receiptId) {
      const receiptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/receipts/${currentPayment.receiptId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!receiptResponse.ok) {
        throw new Error('Error al obtener información del recibo')
      }

      const receipt = await receiptResponse.json()
      
      // Calcular montos pendientes y créditos
      const totalPaid = updatedPayment.amount
      const expectedAmount = receipt.amount
      const currentPendingAmount = receipt.pending_amount || receipt.amount
      
      // Si es el primer pago, usar el monto total del recibo
      // Si es un pago subsecuente, usar el monto pendiente actual
      const newPendingAmount = currentPendingAmount - totalPaid
      const hasCredit = newPendingAmount < 0

      // Actualizar el estado del recibo y los montos
      const receiptUpdate = {
        ...receipt,
        status: newStatus === 'verified' 
          ? (newPendingAmount <= 0 ? 'paid' : 'partial')
          : receipt.status,
        pending_amount: hasCredit ? 0 : newPendingAmount,
        credit_balance: hasCredit ? Math.abs(newPendingAmount) : 0
      }

      const updateReceiptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/receipts/${currentPayment.receiptId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiptUpdate)
      })

      if (!updateReceiptResponse.ok) {
        throw new Error('Error al actualizar el estado del recibo')
      }
    }
    
    // Revalidar las rutas
    revalidatePath('/admin/payments/[id]')
    revalidatePath('/admin/payments')
    revalidatePath('/owner/payments')
    revalidatePath(`/admin/payment/${paymentId}`)
    
    return { success: true, payment: updatedPayment }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar el pago'
    }
  }
}

/**
 * Recupera un pago por su ID
 */
export async function getPaymentByIdServer(paymentId: number) {
  try {
    // Obtener el token de las cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    console.log(`[Server Action] Obteniendo pago ${paymentId}`)
    
    // Añadir timestamp para evitar cache
    const timestamp = new Date().getTime()
    const url = `${API_BASE_URL}/payments/${paymentId}?_nocache=${timestamp}`
    
    // Realizar la petición al backend desde el servidor
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // No cacheamos esta respuesta
      cache: 'no-store'
    })
    
    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      return { 
        success: false, 
        error: `Error del servidor: ${response.status} ${response.statusText}`
      }
    }
    
    // Procesar la respuesta
    const data = await response.json()
    
    return {
      success: true,
      payment: data
    }
  } catch (error) {
    console.error('[Server Action] Error en getPaymentByIdServer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene los pagos asociados a un usuario
 */
export async function getUserPaymentsServer(userId: number) {
  try {
    // Obtener el token de las cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    console.log(`[Server Action] Obteniendo pagos para el usuario ${userId}`)
    
    // Añadir timestamp para evitar cache
    const timestamp = new Date().getTime()
    
    // Primero obtenemos los recibos del usuario
    const receiptsUrl = `${API_BASE_URL}/receipts/user/${userId}?_nocache=${timestamp}`
    const receiptsResponse = await fetch(receiptsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    })
    
    if (!receiptsResponse.ok) {
      return { 
        success: false, 
        error: `Error al obtener recibos: ${receiptsResponse.status} ${receiptsResponse.statusText}`
      }
    }
    
    const receipts = await receiptsResponse.json()
    
    if (!receipts || receipts.length === 0) {
      return { success: true, payments: [] }
    }
    
    // Luego obtenemos los pagos para cada recibo
    const paymentsPromises = receipts
      .filter((receipt: any) => receipt.id)
      .map((receipt: any) => {
        const paymentsUrl = `${API_BASE_URL}/payments/receipt/${receipt.id}?_nocache=${timestamp}`
        return fetch(paymentsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          cache: 'no-store'
        })
        .then(response => {
          if (!response.ok) {
            console.warn(`No se pudieron obtener pagos para el recibo ${receipt.id}`)
            return []
          }
          return response.json()
        })
        .catch(error => {
          console.error(`Error al obtener pagos para el recibo ${receipt.id}:`, error)
          return []
        })
      })
    
    const paymentsArrays = await Promise.all(paymentsPromises)
    
    // Aplanamos y procesamos los pagos
    const allPayments = paymentsArrays.flat().map((payment: any) => {
      if (!payment) return null
      
      // Añadir información del recibo si no está presente
      if (!payment.receipt) {
        const receipt = receipts.find((r: any) => r.id === payment.receiptId)
        if (receipt) {
          payment.receipt = receipt
        }
      }
      
      return payment
    }).filter(Boolean)
    
    return { success: true, payments: allPayments }
  } catch (error) {
    console.error('[Server Action] Error en getUserPaymentsServer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
} 