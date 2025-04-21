'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToken } from '../../hook/useToken'
import Header from '../../components/Header'
import { FiEye, FiDollarSign, FiFileText } from 'react-icons/fi'
import { getPendingInvoices, getSupplierPayments } from '../../actions/supplierPayments'

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
  issueDate: string
  dueDate: string
  supplierId: number
  Supplier?: Supplier
  supplier?: Supplier
  budgetId?: number
  Budget?: {
    id?: number
    title?: string
    description?: string
  }
  budget?: {
    id?: number
    title?: string
    description?: string
  }
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
  Invoice?: Invoice
  Supplier?: Supplier
}

export default function SupplierPaymentsPage() {
  const router = useRouter()
  const { token, userInfo, isLoading } = useToken()
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !userInfo || isLoading) {
        return
      }

      try {
        setLoading(true)
        setError('')

        if (!['admin', 'superadmin'].includes(userInfo.role)) {
          router.push('/unauthorized')
          return
        }

        if (!userInfo.condominiumId) {
          throw new Error('No se encontró el ID del condominio')
        }

        // Usar Server Actions para obtener los datos
        const [invoicesResult, paymentsResult] = await Promise.all([
          getPendingInvoices(userInfo.condominiumId),
          getSupplierPayments(userInfo.condominiumId)
        ])

        if (!invoicesResult.success) {
          throw new Error(invoicesResult.error || 'Error al cargar las facturas pendientes')
        }

        if (!paymentsResult.success) {
          throw new Error(paymentsResult.error || 'Error al cargar los pagos a proveedores') 
        }

        console.log('Facturas pendientes obtenidas:', invoicesResult.invoices)
        setPendingInvoices(invoicesResult.invoices || [])
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
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
            Pagos a Proveedores
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Pestañas */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Facturas Pendientes
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Historial de Pagos
          </button>
        </div>

        {/* Contenido de pestañas */}
        {activeTab === 'pending' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {pendingInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay facturas pendientes de pago
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio/Presupuesto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Emisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {invoice.Supplier?.name || invoice.supplier?.name || 'N/A'}
                          {(invoice.Supplier?.type || invoice.supplier?.type) && (
                            <span className="text-gray-500 text-xs ml-1">
                              ({invoice.Supplier?.type || invoice.supplier?.type})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {invoice.Budget?.title || invoice.budget?.title || `Presupuesto #${invoice.budgetId || 'N/A'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${formatAmount(invoice.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(invoice.issueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            href={`/admin/invoices/${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Ver factura"
                          >
                            <FiEye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/admin/supplier-payments/new?invoiceId=${invoice.id}`}
                            className="text-green-600 hover:text-green-900"
                            title="Registrar pago"
                          >
                            <FiDollarSign className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay pagos a proveedores registrados
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
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
                          {payment.Invoice?.number || (payment.invoiceId ? `#${payment.invoiceId}` : 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.Supplier?.name || 'N/A'}
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
                            href={`/admin/supplier-payments/${payment.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
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
        )}
      </div>
    </div>
  )
} 