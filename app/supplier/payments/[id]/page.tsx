'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToken } from '../../../hook/useToken'
import Header from '../../../components/Header'
import { FiArrowLeft, FiFileText, FiPrinter } from 'react-icons/fi'
import { getSupplierPaymentById } from '../../../actions/supplierPayments'

interface Supplier {
  id: number
  name: string
  type?: string
}

interface Invoice {
  id: number
  number: string
  amount: number | string
  status: string
  Budget?: {
    id: number
    title: string
  }
}

interface SupplierPayment {
  id: number
  invoiceId: number
  supplierId: number
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber?: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
  Invoice?: Invoice
  Supplier?: Supplier
}

export default function SupplierPaymentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { token, userInfo, isLoading } = useToken()
  const [payment, setPayment] = useState<SupplierPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supplierId, setSupplierId] = useState<number | null>(null)

  useEffect(() => {
    const fetchPayment = async () => {
      if (!token || !userInfo || isLoading) {
        return
      }

      try {
        setLoading(true)
        setError('')

        if (userInfo.role !== 'supplier' && userInfo.role !== 'proveedor') {
          router.push('/unauthorized')
          return
        }

        // Obtener el ID del proveedor asociado al usuario
        const supplierResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api'}/suppliers/user/${userInfo.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (!supplierResponse.ok) {
          throw new Error("Error al obtener el perfil de proveedor")
        }

        const supplierData = await supplierResponse.json()
        console.log("Datos del proveedor:", supplierData)
        
        setSupplierId(supplierData.id)

        const result = await getSupplierPaymentById(Number(params.id))

        if (!result.success) {
          throw new Error(result.error || 'Error al cargar los datos del pago')
        }

        // Verificar que el pago corresponde a este proveedor
        if (result.payment.supplierId !== supplierData.id) {
          throw new Error('No tienes permisos para ver este pago')
        }

        setPayment(result.payment)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Error al cargar el pago')
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [token, userInfo, isLoading, params.id, router])

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodLabel = (method: string): string => {
    const methods: Record<string, string> = {
      bank_transfer: 'Transferencia Bancaria',
      check: 'Cheque',
      cash: 'Efectivo',
      credit_card: 'Tarjeta de Crédito',
      mobile_payment: 'Pago Móvil',
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles del pago...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'No se encontró el pago especificado'}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/supplier/payments')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              Volver a la lista de pagos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              href="/supplier/payments"
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Pago Recibido #{payment.id}
            </h1>
          </div>
          <div className="flex space-x-2">
            {payment.Invoice && (
              <Link
                href={`/supplier/invoices/${payment.invoiceId}`}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                <FiFileText className="mr-2" /> Ver Factura
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              <FiPrinter className="mr-2" /> Imprimir
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Información del Pago Recibido</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalles del Pago</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">ID de Pago</p>
                    <p className="font-medium">{payment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-medium text-green-700 text-xl">
                      ${formatAmount(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-medium">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Referencia</p>
                    <p className="font-medium">{payment.referenceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Pago</p>
                    <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'completed' || payment.status === 'completado'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'cancelled' || payment.status === 'cancelado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.status === 'completed' ? 'Completado' : 
                       payment.status === 'cancelled' ? 'Cancelado' : 
                       payment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Factura</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Factura</p>
                    <p className="font-medium">
                      {payment.Invoice?.number || `#${payment.invoiceId}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Servicio/Presupuesto</p>
                    <p className="font-medium">
                      {payment.Invoice?.Budget?.title || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Registro</p>
                    <p className="font-medium">{formatDateTime(payment.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Descripción / Observaciones</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">
                  {payment.description || 'No se proporcionó descripción.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 