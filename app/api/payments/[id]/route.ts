import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener el pago')
    }

    const payment = await response.json()
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener el pago' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers()
    const token = headersList.get('authorization')?.split(' ')[1]
    const body = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el body contenga los campos necesarios
    if (!body.status && !body.amount && !body.method && !body.receiptId && !body.payment_details) {
      return NextResponse.json(
        { error: 'Se requiere al menos un campo para actualizar' },
        { status: 400 }
      )
    }

    // Asegurarnos de que el status se envíe correctamente
    const updateData = {
      ...body,
      status: body.status // Asegurar que el status se incluya en la actualización
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al actualizar el pago')
    }

    const updatedPayment = await response.json()
    
    // Verificar que el estado se actualizó correctamente
    if (body.status && updatedPayment.status !== body.status) {
      return NextResponse.json(
        { 
          error: `El estado no se actualizó correctamente. Estado actual: ${updatedPayment.status}`,
          payment: updatedPayment
        },
        { status: 400 }
      )
    }

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar el pago' },
      { status: 500 }
    )
  }
} 