'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToken } from '../../../hook/useToken'
import Header from '../../../components/Header'
import { createSupplierPayment } from '../../../actions/supplierPayments'

interface Invoice {
  id: number
  number: string
  amount: number | string
  status: string
  supplierId: number
  Supplier?: {
    id: number
    name: string
  }
  Budget?: {
    title: string
  }
}

export default function NewSupplierPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, userInfo, isLoading } = useToken()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formState, setFormState] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  const invoiceId = searchParams.get('invoiceId')

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!token || !userInfo || isLoading) {
        return
      }

      if (!invoiceId) {
        setError('No se especificó la factura')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        if (!['admin', 'superadmin'].includes(userInfo.role)) {
          router.push('/unauthorized')
          return
        }

        const response = await fetch(`http://localhost:3040/api/invoices/${invoiceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Error al cargar la información de la factura')
        }

        const data = await response.json()
        setInvoice(data)
        // Precargar el monto de la factura en el formulario
        setFormState(prev => ({ 
          ...prev, 
          amount: typeof data.amount === 'string' ? data.amount : data.amount.toString() 
        }))
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Error al cargar la factura')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [token, userInfo, isLoading, invoiceId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoice) {
      setError('No se ha cargado la información de la factura')
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      
      const formData = new FormData()
      formData.append('invoiceId', invoice.id.toString())
      formData.append('amount', formState.amount)
      formData.append('paymentMethod', formState.paymentMethod)
      formData.append('referenceNumber', formState.referenceNumber)
      formData.append('description', formState.description)
      formData.append('paymentDate', formState.paymentDate)
      
      const result = await createSupplierPayment(formData)
      
      if (!result.success) {
        throw new Error(result.error || 'Error al registrar el pago')
      }
      
      // Redireccionar a la lista de pagos
      router.push('/admin/supplier-payments')
      router.refresh()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información de la factura...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'No se encontró la factura especificada'}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/admin/supplier-payments')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Volver a la lista de pagos
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registrar Pago a Proveedor
          </h1>
          <p className="text-gray-600">
            Complete el formulario para registrar el pago de la factura.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Detalles de la Factura</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de Factura</p>
                <p className="text-lg font-medium">{invoice.number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Proveedor</p>
                <p className="text-lg font-medium">{invoice.Supplier?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Servicio/Presupuesto</p>
                <p className="text-lg font-medium">{invoice.Budget?.title || `Presupuesto #${invoice.id}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Monto</p>
                <p className="text-lg font-medium text-green-700">${formatAmount(invoice.amount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Información de Pago</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Monto a Pagar
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formState.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formState.paymentMethod}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bank_transfer">Transferencia Bancaria</option>
                    <option value="check">Cheque</option>
                    <option value="cash">Efectivo</option>
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="mobile_payment">Pago Móvil</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Referencia
                  </label>
                  <input
                    type="text"
                    id="referenceNumber"
                    name="referenceNumber"
                    value={formState.referenceNumber}
                    onChange={handleChange}
                    placeholder="Ej: # Transferencia, cheque, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formState.paymentDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción / Observaciones
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Incluya cualquier detalle relevante sobre el pago"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/supplier-payments')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Procesando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 