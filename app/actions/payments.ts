'use server'

import { cookies } from 'next/headers'

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

/**
 * Obtiene el token de las cookies
 */
async function getTokenFromCookies() {
  try {
    return cookies().get('token')?.value || '';
  } catch (error) {
    console.error('Error al obtener token de cookies:', error);
    return '';
  }
}

/**
 * Server Action para actualizar el estado de un pago
 * Esta función se ejecuta en el servidor, lo que garantiza que la actualización
 * se realice correctamente incluso si el cliente tiene problemas
 */
export async function updatePaymentStatusServer(
  paymentId: number, 
  newStatus: string
) {
  try {
    // Obtener el token de las cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    console.log(`[Server Action] Actualizando estado del pago ${paymentId} a ${newStatus}`)
    
    // Realizar la petición al backend desde el servidor
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus }),
      // No cacheamos esta respuesta
      cache: 'no-store'
    })
    
    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      const text = await response.text()
      console.error(`[Server Action] Error al actualizar el pago ${paymentId}:`, text)
      return { 
        success: false, 
        error: `Error del servidor: ${response.status} ${response.statusText}`
      }
    }
    
    // Procesar la respuesta
    const data = await response.json()
    
    console.log(`[Server Action] Actualización exitosa del pago ${paymentId}:`, data)
    
    // Verificar que el estado se actualizó correctamente
    if (data.status !== newStatus) {
      return { 
        success: false, 
        error: `El servidor no actualizó el estado. Estado actual: ${data.status}`,
        payment: data
      }
    }
    
    return {
      success: true,
      payment: data
    }
  } catch (error) {
    console.error('[Server Action] Error en updatePaymentStatusServer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
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