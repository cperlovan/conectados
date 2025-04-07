'use client'

import { useState } from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { updatePaymentStatus } from '@/app/actions/payments'
import { useFormStatus } from 'react-dom'
import { PaymentStatus } from '@/app/types/payment'

function getStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'verified':
      return 'verificado exitosamente'
    case 'approved':
      return 'aprobado exitosamente'
    case 'rejected':
      return 'rechazado'
    case 'pending':
      return 'pendiente de verificación'
    default:
      return `actualizado a ${status}`
  }
}

function getStatusBadge(status: PaymentStatus) {
  const baseStyles = 'px-2 py-1 rounded-full text-sm font-medium'
  
  switch (status) {
    case 'verified':
      return (
        <span className={`${baseStyles} bg-green-100 text-green-800`}>
          Verificado
        </span>
      )
    case 'approved':
      return (
        <span className={`${baseStyles} bg-blue-100 text-blue-800`}>
          Aprobado
        </span>
      )
    case 'rejected':
      return (
        <span className={`${baseStyles} bg-red-100 text-red-800`}>
          Rechazado
        </span>
      )
    case 'pending':
      return (
        <span className={`${baseStyles} bg-yellow-100 text-yellow-800`}>
          Pendiente de Verificación
        </span>
      )
    default:
      return (
        <span className={`${baseStyles} bg-gray-100 text-gray-800`}>
          {status}
        </span>
      )
  }
}

function StatusButton({ 
  onClick, 
  disabled, 
  variant = 'blue',
  icon: Icon,
  children 
}: { 
  onClick: () => void
  disabled: boolean
  variant?: 'blue' | 'green' | 'red'
  icon: typeof FiCheckCircle | typeof FiXCircle
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  
  const baseStyles = 'flex items-center px-4 py-2 rounded-md text-white'
  const variantStyles = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className={`${baseStyles} ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : variantStyles[variant]
      }`}
    >
      <Icon className="mr-2" />
      {children}
    </button>
  )
}

interface PaymentStatusActionProps {
  paymentId: number
  currentStatus: PaymentStatus
  onStatusUpdated?: (payment: any) => void
}

export default function PaymentStatusAction({
  paymentId,
  currentStatus,
  onStatusUpdated
}: PaymentStatusActionProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showVerifyButton = !['verified', 'approved'].includes(currentStatus)
  const showApproveButton = !['approved', 'verified'].includes(currentStatus)
  const showRejectButton = !['rejected'].includes(currentStatus)

  const handleUpdateStatus = async (newStatus: PaymentStatus) => {
    setIsUpdating(true)
    setError(null)
    
    try {
      toast.loading('Actualizando estado del pago...', { id: 'status-update' })
      
      const result = await updatePaymentStatus(paymentId, newStatus)
      
      if (result.success) {
        toast.success(`Pago ${getStatusText(newStatus)}`)
        if (onStatusUpdated) {
          onStatusUpdated(result.payment)
        }
      } else {
        setError(result.error || 'Error desconocido')
        toast.error(`Error al actualizar: ${result.error || 'Error desconocido'}`, { id: 'status-update' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error al actualizar estado:', error)
      toast.error('Error al comunicarse con el servidor', { id: 'status-update' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-700">Acciones</h2>
        {getStatusBadge(currentStatus)}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {showVerifyButton && (
          <StatusButton
            onClick={() => handleUpdateStatus('verified')}
            disabled={isUpdating}
            variant="blue"
            icon={FiCheckCircle}
          >
            {currentStatus === 'verified' ? 'Ya Verificado' : 'Marcar como Verificado'}
          </StatusButton>
        )}
        
        {showApproveButton && (
          <StatusButton
            onClick={() => handleUpdateStatus('approved')}
            disabled={isUpdating}
            variant="green"
            icon={FiCheckCircle}
          >
            {currentStatus === 'approved' ? 'Ya Aprobado' : 'Aprobar Pago'}
          </StatusButton>
        )}
        
        {showRejectButton && (
          <StatusButton
            onClick={() => handleUpdateStatus('rejected')}
            disabled={isUpdating}
            variant="red"
            icon={FiXCircle}
          >
            {currentStatus === 'rejected' ? 'Ya Rechazado' : 'Rechazar Pago'}
          </StatusButton>
        )}
      </div>
      
      {isUpdating && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          Actualizando estado...
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
} 