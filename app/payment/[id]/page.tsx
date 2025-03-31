'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToken } from '@/app/hook/useToken';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { FiArrowLeft, FiDollarSign, FiCalendar, FiCreditCard, FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiInfo } from 'react-icons/fi';
import { getPaymentById, Payment, checkPaymentUpdateSupport } from '@/app/utils/api';
import { toast } from 'react-hot-toast';
import PaymentStatusAction from '@/app/components/PaymentStatusAction';
import { getPaymentByIdServer } from '@/app/actions/payments';

interface PaymentDetailPageProps {
  params: {
    id: string;
  };
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [supportsUpdates, setSupportsUpdates] = useState<boolean | null>(null);
  
  // Comprobar si el usuario es administrador
  const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'superadmin';

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login');
      return;
    }

    // Verify user is admin or owner
    if (userInfo && userInfo.role !== 'admin' && userInfo.role !== 'superadmin' && userInfo.role !== 'owner') {
      router.push('/');
      return;
    }

    const fetchPaymentData = async () => {
      if (!token || isLoading) return;
      
      try {
        setLoading(true);
        const paymentId = parseInt(params.id);
        
        if (isNaN(paymentId)) {
          throw new Error('ID de pago inválido');
        }
        
        // Utilizar la API para obtener datos del pago
        const response = await fetch(`/api/update-payment-status?paymentId=${paymentId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener el pago: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.payment) {
          setPayment(result.payment);
        } else {
          // Si falla la API, intentar con el método cliente como fallback
          if (!userInfo || !userInfo.condominiumId) {
            throw new Error('No se encuentra disponible la información del condominio');
          }
          
          // Comprobar si el backend soporta actualización de pagos
          if (isAdmin) {
            const updateSupported = await checkPaymentUpdateSupport(token);
            setSupportsUpdates(updateSupported);
            
            if (!updateSupported) {
              console.warn('El backend no soporta actualización de pagos');
              setStatusUpdateMessage({
                type: 'warning',
                message: 'El backend no soporta actualizaciones de estado. Se utilizará almacenamiento local.'
              });
            }
          }
          
          const paymentData = await getPaymentById(paymentId, token, userInfo.condominiumId);
          setPayment(paymentData);
        }
      } catch (err) {
        console.error('Error al cargar el pago:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del pago');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [token, userInfo, isLoading, params.id, router, isAdmin]);

  // Añadir este useEffect para mostrar mensajes de actualización de estado
  useEffect(() => {
    if (statusUpdateMessage) {
      // Limpiamos cualquier mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setStatusUpdateMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [statusUpdateMessage]);

  // Función para refrescar los datos del pago usando Server Action
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      const paymentId = parseInt(params.id);
      if (isNaN(paymentId)) {
        throw new Error('ID de pago inválido');
      }
      
      // Mostrar toast de carga
      toast.loading('Actualizando datos...', { id: 'refresh-payment' });
      
      // Usar API para obtener datos actualizados
      const response = await fetch(`/api/update-payment-status?paymentId=${paymentId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.payment) {
        setPayment(result.payment);
        toast.success('Datos actualizados correctamente', { id: 'refresh-payment' });
      } else {
        // Fallback al método cliente
        if (userInfo && userInfo.condominiumId && token) {
          const paymentData = await getPaymentById(paymentId, token, userInfo.condominiumId);
          setPayment(paymentData);
          toast.success('Datos actualizados correctamente', { id: 'refresh-payment' });
        } else {
          throw new Error(result.error || 'No se pudo actualizar los datos');
        }
      }
    } catch (err) {
      console.error('Error al refrescar los datos:', err);
      toast.error('Error al actualizar los datos', { id: 'refresh-payment' });
    } finally {
      setRefreshing(false);
    }
  };

  // Función para manejar la actualización de estado desde el componente hijo
  const handleStatusUpdate = (updatedPayment: Payment) => {
    setPayment(updatedPayment);
    setStatusUpdateMessage({
      type: 'success',
      message: `El estado del pago ha sido actualizado a ${getStatusText(updatedPayment.status)}`
    });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      
      // Ensure the date string is properly formatted
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateString}`);
        return "Fecha no disponible";
      }
      
      // Format date using Intl.DateTimeFormat
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error al formatear fecha:", error, "Fecha original:", dateString);
      return "Fecha no disponible";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    // Convert to lowercase and trim for consistent comparison
    const statusLower = (status || '').toLowerCase().trim();
    
    switch (statusLower) {
      case 'approved':
      case 'aprobado':
      case 'aprovado':
        return 'Aprobado';
      case 'pending':
      case 'pendiente':
      case 'pendiente de aprobación':
        return 'Pendiente';
      case 'rejected':
      case 'rechazado':
      case 'rechazo':
        return 'Rechazado';
      case 'verified':
      case 'verificado':
        return 'Verificado';
      default:
        return status || 'Desconocido';
    }
  };

  const getStatusBadge = (status: string) => {
    // Convert to lowercase and trim for consistent comparison
    const statusLower = (status || '').toLowerCase().trim();
    
    switch (statusLower) {
      case 'approved':
      case 'aprobado':
      case 'aprovado': // Common misspelling
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center">
            <FiCheckCircle className="mr-1" />
            Aprobado
          </span>
        );
      case 'pending':
      case 'pendiente':
      case 'pendiente de aprobación':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center">
            <FiAlertCircle className="mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
      case 'rechazado':
      case 'rechazo':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm flex items-center">
            <FiXCircle className="mr-1" />
            Rechazado
          </span>
        );
      case 'verified':
      case 'verificado':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center">
            <FiCheckCircle className="mr-1" />
            Verificado
          </span>
        );
      default:
        console.log("Estado desconocido:", status);
        return (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm flex items-center">
            {status || 'Desconocido'}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'transfer':
      case 'transferencia':
      case 'bank_transfer':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
            Transferencia
          </span>
        );
      case 'cash':
      case 'efectivo':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
            Efectivo
          </span>
        );
      case 'credit_card':
      case 'tarjeta_credito':
        return (
          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
            Tarjeta de Crédito
          </span>
        );
      case 'debit_card':
      case 'tarjeta_debito':
        return (
          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs">
            Tarjeta de Débito
          </span>
        );
      case 'mobile_payment':
        return (
          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
            Pago Móvil
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
            {method}
          </span>
        );
    }
  };

  const renderPropertyInfo = () => {
    if (!payment || !payment.receipt || !payment.receipt.property) {
      return <p className="text-gray-600">Información de propiedad no disponible</p>;
    }
    
    const property = payment.receipt.property;
    
    const formattedPropertyInfo = [];
    
    // Add property type if available
    if (property.type) {
      formattedPropertyInfo.push(property.type.charAt(0).toUpperCase() + property.type.slice(1));
    }
    
    // Add block if available
    if (property.block) {
      formattedPropertyInfo.push(`Bloque ${property.block}`);
    }
    
    // Add number if available
    if (property.number) {
      formattedPropertyInfo.push(`#${property.number}`);
    }
    
    // Add floor if available
    if (property.floor) {
      formattedPropertyInfo.push(`Piso ${property.floor}`);
    }
    
    // If we have any property info, display it
    if (formattedPropertyInfo.length > 0) {
      return <p className="text-gray-700">{formattedPropertyInfo.join(' - ')}</p>;
    }
    
    // Fallback
    return <p className="text-gray-600">Sin detalles de propiedad</p>;
  };

  const renderBackButton = () => {
    // Determine where to redirect based on user role
    const backURL = isAdmin ? '/admin/payments' : '/owner/payments';
    
    return (
      <Link
        href={backURL}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <FiArrowLeft className="mr-2" />
        Volver a lista de pagos
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles del pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
          <div className="mt-4">
            {renderBackButton()}
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró información del pago</p>
            <div className="mt-4 flex justify-center">
              {renderBackButton()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>{renderBackButton()}</div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            title="Actualizar datos"
          >
            <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>

        {/* Mostrar mensaje de actualización de estado si existe */}
        {statusUpdateMessage && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            statusUpdateMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : statusUpdateMessage.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            {statusUpdateMessage.type === 'success' ? (
              <FiCheckCircle className="mr-2" />
            ) : statusUpdateMessage.type === 'error' ? (
              <FiXCircle className="mr-2" />
            ) : (
              <FiAlertCircle className="mr-2" />
            )}
            {statusUpdateMessage.message}
          </div>
        )}
        
        {/* Mostrar mensaje si el backend no soporta actualización de pagos */}
        {isAdmin && supportsUpdates === false && (
          <div className="mb-6 p-4 rounded-md flex items-center bg-blue-50 border border-blue-200 text-blue-700">
            <FiInfo className="mr-2" />
            <span>
              El sistema está utilizando Server Actions para actualizar el estado de pagos, garantizando mayor fiabilidad en las actualizaciones.
            </span>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiDollarSign className="mr-2 text-blue-600" />
                Detalles del Pago #{payment.id}
              </h1>
              <div>{getStatusBadge(payment.status)}</div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Información del Pago</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="block text-sm text-gray-500">Fecha</span>
                      <span className="block font-medium flex items-center">
                        <FiCalendar className="text-gray-400 mr-1" />
                        {formatDate(payment.date)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="block text-sm text-gray-500">Monto</span>
                      <span className="block font-medium flex items-center">
                        <FiDollarSign className="text-gray-400 mr-1" />
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="block text-sm text-gray-500">Método de Pago</span>
                      <span className="block">{getPaymentMethodBadge(payment.method)}</span>
                    </div>
                    
                    <div>
                      <span className="block text-sm text-gray-500">Referencia</span>
                      <span className="block font-medium flex items-center">
                        <FiCreditCard className="text-gray-400 mr-1" />
                        {payment.reference || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Información del Recibo</h2>
                  
                  {payment.receipt ? (
                    <div className="space-y-3">
                      <div>
                        <span className="block text-sm text-gray-500">Recibo ID</span>
                        <span className="block font-medium">#{payment.receipt.id}</span>
                      </div>
                      
                      <div>
                        <span className="block text-sm text-gray-500">Período</span>
                        <span className="block font-medium">
                          {payment.receipt.month} {payment.receipt.year}
                        </span>
                      </div>
                      
                      <div>
                        <span className="block text-sm text-gray-500">Propiedad</span>
                        <span className="block">{renderPropertyInfo()}</span>
                      </div>
                      
                      <div className="pt-2">
                        <Link
                          href={`/receipt/${payment.receipt.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FiArrowLeft className="mr-1 rotate-180" />
                          Ver Recibo
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Pago no asociado a un recibo</p>
                  )}
                </div>
              </div>
              
              {/* Botones de acción para administradores - Ahora usando el nuevo componente */}
              {isAdmin && (
                <PaymentStatusAction 
                  paymentId={payment.id}
                  currentStatus={payment.status}
                  onStatusUpdated={handleStatusUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}