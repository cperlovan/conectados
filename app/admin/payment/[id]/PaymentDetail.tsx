'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { getPaymentById, Payment, updatePaymentStatus } from '@/app/utils/api'
import { FiCalendar, FiDollarSign, FiCreditCard, FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Link from 'next/link'

interface PaymentDetailProps {
  paymentId: string
}

export default function PaymentDetail({ paymentId }: PaymentDetailProps) {
  const router = useRouter()
  const { token, userInfo, isLoading } = useToken()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login')
      return
    }

    // Verify user is admin
    if (userInfo && userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
      router.push('/')
      return
    }

    const fetchPaymentData = async () => {
      if (!token || isLoading) return
      
      try {
        setLoading(true)
        const paymentIdNumber = parseInt(paymentId)
        
        if (isNaN(paymentIdNumber)) {
          throw new Error('ID de pago inválido')
        }
        
        if (!userInfo || !userInfo.condominiumId) {
          throw new Error('No se encuentra disponible la información del condominio')
        }
        
        const paymentData = await getPaymentById(paymentIdNumber, token, userInfo.condominiumId)
        setPayment(paymentData)
      } catch (err) {
        console.error('Error al cargar el pago:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del pago')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [token, userInfo, isLoading, paymentId, router])

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible'
      
      const date = new Date(dateString)
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida'
      }
      
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date)
    } catch (error) {
      console.error('Error al formatear fecha:', error)
      return 'Error de formato'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!payment || !token || !userInfo || !userInfo.condominiumId) return
    
    try {
      setProcessing(true)
      
      // Update payment status
      await updatePaymentStatus(payment.id, newStatus, token, userInfo.condominiumId)
      
      // Update local state
      setPayment({
        ...payment,
        status: newStatus
      })
      
      setStatusUpdateMessage({
        type: 'success',
        message: `El estado del pago ha sido actualizado a "${newStatus === 'approved' ? 'Aprobado' : newStatus === 'rejected' ? 'Rechazado' : newStatus}"`
      })
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatusUpdateMessage(null)
      }, 5000)
    } catch (err) {
      console.error('Error al actualizar el estado del pago:', err)
      setStatusUpdateMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al actualizar el estado del pago'
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center inline-flex">
            <FiCheckCircle className="mr-1" />
            Aprobado
          </span>
        )
      case 'pending':
      case 'pendiente':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center inline-flex">
            <FiCalendar className="mr-1" />
            Pendiente
          </span>
        )
      case 'rejected':
      case 'rechazado':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm flex items-center inline-flex">
            <FiXCircle className="mr-1" />
            Rechazado
          </span>
        )
      case 'verified':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center inline-flex">
            <FiCheckCircle className="mr-1" />
            Verificado
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm flex items-center inline-flex">
            {status}
          </span>
        )
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'transfer':
      case 'transferencia':
      case 'bank_transfer':
        return 'Transferencia Bancaria'
      case 'cash':
      case 'efectivo':
        return 'Efectivo'
      case 'credit_card':
      case 'tarjeta_credito':
        return 'Tarjeta de Crédito'
      case 'debit_card':
      case 'tarjeta_debito':
        return 'Tarjeta de Débito'
      case 'mobile_payment':
        return 'Pago Móvil'
      default:
        return method
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del pago...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-6">
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              <p>Error: {error}</p>
            </div>
            <Link
              href="/admin/payments"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiArrowLeft className="mr-1" /> Volver a la lista de pagos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No se encontró información para este pago</p>
            <Link
              href="/admin/payments"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiArrowLeft className="mr-1" /> Volver a la lista de pagos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/payments"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-1" /> Volver a la lista de pagos
        </Link>
      </div>
      
      {statusUpdateMessage && (
        <div className={`mb-6 p-4 rounded-md ${statusUpdateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusUpdateMessage.message}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Pago #{payment.id}</h1>
            <div className="ml-4">
              {getStatusBadge(payment.status)}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Información del Pago</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <FiCalendar />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Fecha de Pago</h3>
                    <p className="text-base font-medium text-gray-900">{formatDate(payment.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <FiDollarSign />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                    <p className="text-base font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <FiCreditCard />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Método de Pago</h3>
                    <p className="text-base font-medium text-gray-900">{getPaymentMethodText(payment.method)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <FiCreditCard />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Referencia</h3>
                    <p className="text-base font-medium text-gray-900">{payment.reference || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Información del Recibo</h2>
              
              {payment.receipt ? (
                <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Recibo #</span>
                    <p className="text-base font-medium text-gray-900">{payment.receipt.id}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Período</span>
                    <p className="text-base font-medium text-gray-900">
                      {payment.receipt.month} {payment.receipt.year}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Propiedad</span>
                    <p className="text-base font-medium text-gray-900">
                      {payment.receipt.property ? (
                        <>
                          {payment.receipt.property.type && (
                            payment.receipt.property.type.charAt(0).toUpperCase() + payment.receipt.property.type.slice(1)
                          )}
                          {payment.receipt.property.number && ` ${payment.receipt.property.number}`}
                          {payment.receipt.property.block && ` (Bloque ${payment.receipt.property.block})`}
                          {payment.receipt.property.floor && `, Piso ${payment.receipt.property.floor}`}
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>
                  
                  <Link
                    href={`/receipt/${payment.receipt.id}`}
                    className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver Recibo Completo
                  </Link>
                </div>
              ) : (
                <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                  <p className="text-gray-500">Pago directo sin recibo asociado</p>
                </div>
              )}
              
              {/* Options for Admins */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Acciones de Administrador</h3>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={payment.status === 'approved' || processing}
                    className={`px-4 py-2 rounded-md ${
                      payment.status === 'approved'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } flex items-center`}
                  >
                    <FiCheckCircle className="mr-1" />
                    {processing ? 'Procesando...' : 'Aprobar Pago'}
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={payment.status === 'rejected' || processing}
                    className={`px-4 py-2 rounded-md ${
                      payment.status === 'rejected'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } flex items-center`}
                  >
                    <FiXCircle className="mr-1" />
                    {processing ? 'Procesando...' : 'Rechazar Pago'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 