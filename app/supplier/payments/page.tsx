'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToken } from '../../hook/useToken'
import Header from '../../components/Header'
import { FiEye } from 'react-icons/fi'
import { getPaymentsBySupplier } from '../../actions/supplierPayments'

interface Invoice {
  id: number
  number: string
  amount: number | string
  status: string
}

interface SupplierPayment {
  id: number
  invoiceId?: number | null
  supplierId: number
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber?: string
  description: string
  status: string
  invoice?: Invoice
}

export default function SupplierPaymentsPage() {
  const router = useRouter()
  const { token, userInfo, isLoading } = useToken()
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supplierId, setSupplierId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
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

        // Obtener los pagos del proveedor
        const paymentsResult = await getPaymentsBySupplier(supplierData.id)

        if (!paymentsResult.success) {
          throw new Error(paymentsResult.error || 'Error al cargar los pagos recibidos')
        }

        console.log('Pagos obtenidos:', paymentsResult.payments)
        setPayments(paymentsResult.payments || [])
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, userInfo, isLoading, router])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pagos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Pagos Recibidos del Condominio
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay pagos recibidos registrados
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.invoice?.number || (payment.invoiceId ? `#${payment.invoiceId}` : 'N/A')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${formatAmount(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.paymentMethod}
                      </div>
                      {payment.referenceNumber && (
                        <div className="text-xs text-gray-500">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link
                          href={`/supplier/payments/${payment.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="Ver detalles"
                        >
                          <FiEye className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
} 