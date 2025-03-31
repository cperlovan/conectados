import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de las cookies
    const cookiesStore = await cookies()
    const token = cookiesStore.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No estás autenticado' },
        { status: 401 }
      )
    }
    
    // Obtener datos de la petición
    const { paymentId, status } = await request.json()
    
    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos (paymentId o status)' },
        { status: 400 }
      )
    }
    
    console.log(`[API Route] Actualizando estado del pago ${paymentId} a ${status}`)
    
    // Realizar la petición al backend
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
      // No cacheamos esta respuesta
      cache: 'no-store'
    })
    
    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      const text = await response.text()
      console.error(`[API Route] Error al actualizar el pago ${paymentId}:`, text)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Error del servidor: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }
    
    // Procesar la respuesta
    const data = await response.json()
    
    console.log(`[API Route] Actualización exitosa del pago ${paymentId}. Respuesta completa:`, JSON.stringify(data, null, 2))
    
    // Verificar que el estado se actualizó correctamente
    if (data.status !== status) {
      return NextResponse.json(
        {
          success: false,
          error: `El servidor no actualizó el estado. Estado actual: ${data.status}`,
          payment: data
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      success: true,
      payment: data
    })
  } catch (error) {
    console.error('[API Route] Error en update-payment-status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('paymentId')
  
  if (!paymentId) {
    return NextResponse.json(
      { success: false, error: 'Falta el ID del pago' },
      { status: 400 }
    )
  }
  
  try {
    // Obtener el token de las cookies
    const cookiesStore = await cookies()
    const token = cookiesStore.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No estás autenticado' },
        { status: 401 }
      )
    }
    
    console.log(`[API Route] Obteniendo pago ${paymentId}`)
    
    // Añadir timestamp para evitar cache
    const timestamp = new Date().getTime()
    const url = `${API_BASE_URL}/payments/${paymentId}?_nocache=${timestamp}`
    
    // Realizar la petición al backend
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
      return NextResponse.json(
        { 
          success: false, 
          error: `Error del servidor: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }
    
    // Procesar la respuesta
    const data = await response.json()
    
    console.log(`[API Route] Obteniendo pago ${paymentId}. Respuesta completa:`, JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      payment: data
    })
  } catch (error) {
    console.error('[API Route] Error en get-payment:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
} 