"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "@/app/hook/useToken";
import Header from "@/app/components/Header";
import Link from "next/link";
import { FiDollarSign, FiCalendar, FiCreditCard, FiAlertCircle, FiCheckCircle, FiFilter, FiPlus, FiRefreshCw, FiArrowRight, FiFileText } from "react-icons/fi";
import { getPaymentsByUserId, Payment } from "@/app/utils/api";
import { getUserPaymentsServer } from "@/app/actions/payments";
import { toast } from "react-hot-toast";

export default function OwnerPayments() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Redirigir al login si no hay token
    if (!token && !isLoading) {
      router.push('/login');
      return;
    }

    // Verificar que el usuario sea propietario
    if (userInfo && userInfo.role !== 'owner') {
      router.push('/');
      return;
    }

    const fetchPayments = async () => {
      try {
        if (!userInfo || !userInfo.id) {
          console.error('No se encontró ID de usuario');
          setError('No se pudo obtener información del usuario');
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // Intentar obtener pagos con la API
        const response = await fetch(`/api/user-payments?userId=${userInfo.id}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener pagos: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('Pagos obtenidos con API:', result.payments);
          setPayments(result.payments || []);
        } else {
          console.warn('API falló, usando método de cliente:', result.error);
          
          // Fallback a cliente
          const paymentsData = await getPaymentsByUserId(userInfo.id, token || "");
          console.log('Pagos obtenidos con cliente:', paymentsData);
          setPayments(paymentsData || []);
        }
        
        setError('');
      } catch (err) {
        console.error('Error al obtener pagos:', err);
        setError(err instanceof Error ? err.message : 'Error al obtener los pagos');
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar pagos si tenemos token y datos de usuario
    if (token && userInfo && !isLoading) {
      fetchPayments();
    }
  }, [token, userInfo, isLoading, router]);
  
  // Función para actualizar los pagos manualmente
  const handleRefresh = async () => {
    if (!userInfo || !userInfo.id) return;
    
    setRefreshing(true);
    toast.loading('Actualizando pagos...', { id: 'refresh-payments' });
    
    try {
      // Intentar usar la API primero
      const response = await fetch(`/api/user-payments?userId=${userInfo.id}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener pagos: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPayments(result.payments || []);
        toast.success('Pagos actualizados correctamente', { id: 'refresh-payments' });
      } else {
        // Fallback a cliente
        const paymentsData = await getPaymentsByUserId(userInfo.id, token || "");
        setPayments(paymentsData || []);
        toast.success('Pagos actualizados correctamente', { id: 'refresh-payments' });
      }
    } catch (err) {
      console.error('Error al actualizar pagos:', err);
      toast.error('Error al actualizar pagos', { id: 'refresh-payments' });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Fecha no disponible";
      
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

  const getStatusBadge = (status: string) => {
    // Convert to lowercase and trim for consistent comparison
    const statusLower = (status || '').toLowerCase().trim();
    
    switch (statusLower) {
      case 'approved':
      case 'aprobado':
      case 'aprovado': // Common misspelling
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Aprobado
          </span>
        );
      case 'pending':
      case 'pendiente':
      case 'pendiente de aprobación':
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
      case 'rechazado':
      case 'rechazo':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Rechazado
          </span>
        );
      case 'verified':
      case 'verificado':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Verificado
          </span>
        );
      default:
        console.log("Estado desconocido:", status);
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs flex items-center">
            {status || 'Desconocido'}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'transfer':
      case 'transferencia':
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
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
            {method}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pagos...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              title="Actualizar pagos"
            >
              <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar datos'}
            </button>
            
            <Link
              href="/payment/new"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FiPlus className="mr-1" /> Registrar Pago
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="text-gray-500 text-sm mb-6">
            Total: <span className="font-medium">{payments.length}</span> pagos registrados
          </div>
          
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron pagos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
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
                        <div className="text-sm text-gray-900">#{payment.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(payment.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiDollarSign className="text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(payment.method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCreditCard className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {payment.reference || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.receipt ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {payment.receipt.property ? (
                                <>
                                  {payment.receipt.property.type && 
                                   `${payment.receipt.property.type.charAt(0).toUpperCase() + payment.receipt.property.type.slice(1)}`}
                                  {payment.receipt.property.number && ` ${payment.receipt.property.number}`}
                                </>
                              ) : 'Sin propiedad'}
                            </div>
                            <div className="text-gray-500">
                              {payment.receipt.month} {payment.receipt.year}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pago directo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/payment/${payment.id}`}
                          className="inline-flex items-center px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Ver detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 