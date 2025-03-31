import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Falta el ID del usuario' },
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
    
    console.log(`[API Route] Obteniendo pagos para el usuario ${userId}`)
    
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
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al obtener recibos: ${receiptsResponse.status} ${receiptsResponse.statusText}` 
        },
        { status: receiptsResponse.status }
      )
    }
    
    const receipts = await receiptsResponse.json()
    
    if (!receipts || receipts.length === 0) {
      return NextResponse.json({ success: true, payments: [] })
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
    
    // Loguear algunos pagos para verificar su estructura
    if (allPayments.length > 0) {
      console.log(`[API Route] Muestra de pago de usuario ${userId}:`, JSON.stringify(allPayments[0], null, 2))
      
      // Verificar las propiedades del recibo asociado si existe
      if (allPayments[0].receipt) {
        console.log(`[API Route] Propiedades del recibo asociado:`, Object.keys(allPayments[0].receipt))
        
        // Verificar si el recibo tiene información sobre si está pagado
        if ('paid' in allPayments[0].receipt) {
          console.log(`[API Route] Estado 'paid' del recibo:`, allPayments[0].receipt.paid)
        } else if ('isPaid' in allPayments[0].receipt) {
          console.log(`[API Route] Estado 'isPaid' del recibo:`, allPayments[0].receipt.isPaid)
        } else if ('status' in allPayments[0].receipt) {
          console.log(`[API Route] Estado 'status' del recibo:`, allPayments[0].receipt.status)
        } else {
          console.log(`[API Route] El recibo no tiene información directa de pago`)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      payments: allPayments
    })
  } catch (error) {
    console.error('[API Route] Error en user-payments:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
} 