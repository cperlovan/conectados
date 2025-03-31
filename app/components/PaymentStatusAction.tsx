'use client'

import { useState } from 'react'
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

// Función para obtener texto descriptivo del estado
function getStatusText(status: string): string {
  switch (status) {
    case 'verified':
      return 'verificado exitosamente';
    case 'approved':
      return 'aprobado exitosamente';
    case 'rejected':
      return 'rechazado';
    case 'pending':
      return 'en espera de verificación';
    default:
      return `actualizado a ${status}`;
  }
}

interface PaymentStatusActionProps {
  paymentId: number
  currentStatus: string
  onStatusUpdated: (payment: any) => void
}

export default function PaymentStatusAction({
  paymentId,
  currentStatus,
  onStatusUpdated
}: PaymentStatusActionProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Identificar si los botones deben estar habilitados según el estado actual
  const showApproveButton = currentStatus !== 'approved'
  const showRejectButton = currentStatus !== 'rejected'
  const showVerifyButton = currentStatus !== 'verified'

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    
    try {
      // Mostrar toast de carga
      toast.loading('Actualizando estado del pago...', { id: 'status-update' })
      
      // Llamar a la API directamente
      const response = await fetch('/api/update-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId,
          status: newStatus
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Actualizar UI con el nuevo estado
        toast.success(`Pago ${getStatusText(newStatus)}`)
        
        // Forzar una recarga de datos después de la actualización
        if (onStatusUpdated) {
          setTimeout(() => {
            onStatusUpdated(data.payment)
          }, 500)
        }
        
        // Forzar una actualización de datos en la página después de la actualización
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Mostrar error
        console.error('Error en actualización:', data.error)
        toast.error(`Error al actualizar: ${data.error || 'Intente nuevamente'}`, { id: 'status-update' })
        
        // Si hay datos de pago, actualizar igualmente la UI
        if (data.payment) {
          onStatusUpdated(data.payment)
        }
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al comunicarse con el servidor', { id: 'status-update' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="text-lg font-medium text-gray-700 mb-4">Acciones</h2>
      
      <div className="flex flex-wrap gap-3">
        {/* Botón de verificar */}
        {showVerifyButton && (
          <button
            onClick={() => handleUpdateStatus('verified')}
            disabled={isUpdating}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              currentStatus === 'verified'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <FiCheckCircle className="mr-2" />
            {currentStatus === 'verified' ? 'Ya Verificado' : 'Marcar como Verificado'}
          </button>
        )}
        
        {/* Botón de aprobar */}
        {showApproveButton && (
          <button
            onClick={() => handleUpdateStatus('approved')}
            disabled={isUpdating}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              currentStatus === 'approved'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <FiCheckCircle className="mr-2" />
            {currentStatus === 'approved' ? 'Ya Aprobado' : 'Aprobar Pago'}
          </button>
        )}
        
        {/* Botón de rechazar */}
        {showRejectButton && (
          <button
            onClick={() => handleUpdateStatus('rejected')}
            disabled={isUpdating}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              currentStatus === 'rejected'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <FiXCircle className="mr-2" />
            {currentStatus === 'rejected' ? 'Ya Rechazado' : 'Rechazar Pago'}
          </button>
        )}
      </div>
      
      {isUpdating && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          Actualizando estado...
        </div>
      )}
    </div>
  )
} 