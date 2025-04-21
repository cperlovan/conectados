'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

/**
 * Obtiene el token de las cookies
 */
async function getTokenFromCookies() {
  try {
    // Esperar a que se resuelva la promesa de cookies()
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('token')
    return tokenCookie?.value || ''
  } catch (error) {
    console.error('Error al obtener token de cookies:', error)
    return ''
  }
}

// Interfaz para la metadata de pagos almacenada en gastos
interface PaymentMetadata {
  paymentMethod: string;
  referenceNumber: string;
  invoiceId: number;
  paymentDate: string;
  status: string;
}

/**
 * Obtiene facturas aprobadas pendientes de pago
 */
export async function getPendingInvoices(condominiumId: number) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    const url = `${API_BASE_URL}/invoices/condominium/${condominiumId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener facturas: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Comprobar si la respuesta tiene la estructura esperada
    console.log('Respuesta API facturas:', data)
    
    // Filtrar solo las facturas aprobadas
    // La respuesta probablemente tiene una estructura como { invoices: [...], stats: {...} }
    const invoices = data.invoices || data
    const pendingInvoices = Array.isArray(invoices) 
      ? invoices.filter(invoice => invoice.status === 'approved')
      : []
    
    console.log('Facturas pendientes filtradas:', pendingInvoices.length)
    return { success: true, invoices: pendingInvoices }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Registra un pago a proveedor utilizando el nuevo endpoint
 */
export async function createSupplierPayment(formData: FormData) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    // Extraer datos del formulario
    const invoiceId = Number(formData.get('invoiceId'))
    const amount = Number(formData.get('amount'))
    const paymentMethod = formData.get('paymentMethod') as string
    const referenceNumber = formData.get('referenceNumber') as string
    const description = formData.get('description') as string
    const paymentDate = formData.get('paymentDate') as string
    
    // Validaciones básicas
    if (!invoiceId || isNaN(invoiceId)) {
      return { success: false, error: 'ID de factura inválido' }
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Monto de pago inválido' }
    }
    
    if (!paymentMethod) {
      return { success: false, error: 'Método de pago requerido' }
    }
    
    // 1. Primero obtenemos la información de la factura
    const invoiceResponse = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!invoiceResponse.ok) {
      throw new Error('Error al obtener información de la factura')
    }
    
    const invoice = await invoiceResponse.json()
    
    // 2. Crear el pago usando el nuevo endpoint
    const paymentData = {
      invoiceId,
      supplierId: invoice.supplierId,
      condominiumId: invoice.condominiumId,
      amount,
      paymentMethod,
      referenceNumber,
      description: description || 'Pago de factura',
      paymentDate: paymentDate || new Date().toISOString(),
      status: 'completed'
    }
    
    const paymentResponse = await fetch(`${API_BASE_URL}/supplier-payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })
    
    if (!paymentResponse.ok) {
      throw new Error('Error al registrar el pago')
    }
    
    const result = await paymentResponse.json()
    
    // Revalidar rutas
    revalidatePath('/admin/supplier-payments')
    revalidatePath('/admin/invoices')
    revalidatePath('/expenses')
    
    return { success: true, payment: result.payment }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene todos los pagos a proveedores de un condominio
 */
export async function getSupplierPayments(condominiumId: number) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    // Usar el nuevo endpoint para obtener pagos a proveedores
    const url = `${API_BASE_URL}/supplier-payments/condominium/${condominiumId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener pagos: ${response.status}`)
    }
    
    const payments = await response.json()
    
    return { success: true, payments: Array.isArray(payments) ? payments : [] }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene un pago específico por su ID
 */
export async function getSupplierPaymentById(paymentId: number) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    // Usar el nuevo endpoint
    const url = `${API_BASE_URL}/supplier-payments/${paymentId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener el pago: ${response.status}`)
    }
    
    const payment = await response.json()
    
    return { success: true, payment }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Actualiza un pago a proveedor existente
 */
export async function updateSupplierPayment(paymentId: number, formData: FormData) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    // Extraer datos del formulario
    const paymentMethod = formData.get('paymentMethod') as string
    const referenceNumber = formData.get('referenceNumber') as string
    const description = formData.get('description') as string
    const paymentDate = formData.get('paymentDate') as string
    const status = formData.get('status') as string
    
    // Preparar datos para actualizar
    const updateData = {
      paymentMethod,
      referenceNumber,
      description,
      paymentDate,
      status
    }
    
    // Actualizar el pago
    const response = await fetch(`${API_BASE_URL}/supplier-payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      throw new Error(`Error al actualizar el pago: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Revalidar rutas
    revalidatePath('/admin/supplier-payments')
    revalidatePath(`/admin/supplier-payments/${paymentId}`)
    revalidatePath('/admin/invoices')
    
    return { success: true, payment: result.payment }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Cancela un pago a proveedor (eliminación lógica)
 */
export async function cancelSupplierPayment(paymentId: number) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    // Cancelar el pago (usar DELETE para marcar como cancelado)
    const response = await fetch(`${API_BASE_URL}/supplier-payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error al cancelar el pago: ${response.status}`)
    }
    
    // Revalidar rutas
    revalidatePath('/admin/supplier-payments')
    revalidatePath(`/admin/supplier-payments/${paymentId}`)
    revalidatePath('/admin/invoices')
    
    return { success: true, message: 'Pago cancelado correctamente' }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene los pagos recibidos por un proveedor específico
 */
export async function getPaymentsBySupplier(supplierId: number) {
  try {
    const token = await getTokenFromCookies()
    
    if (!token) {
      return { success: false, error: 'No estás autenticado' }
    }
    
    const url = `${API_BASE_URL}/supplier-payments/supplier/${supplierId}`
    console.log('Consultando URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': 'proveedor'  // Añadir rol explícitamente
      },
      cache: 'no-store'
    })
    
    console.log('Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        // Intentar ver el mensaje de error
        const errorText = await response.text().catch(() => 'Error de permisos')
        console.error('Error detallado:', errorText)
        throw new Error(`Error de permisos al obtener pagos: ${errorText}`)
      }
      throw new Error(`Error al obtener pagos: ${response.status}`)
    }
    
    const payments = await response.json()
    
    return { success: true, payments: Array.isArray(payments) ? payments : [] }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
} 