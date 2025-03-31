'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/app/hook/useToken';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { FiDollarSign, FiCalendar, FiCreditCard, FiAlertCircle, FiCheckCircle, FiFilter, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { fetchAPI, Payment, getAllPayments } from '@/app/utils/api';

export default function AdminPayments() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    year: 'all',
    property: 'all',
    method: 'all',
    search: ''
  });
  const [properties, setProperties] = useState<{id: number, type?: string, number?: string | null}[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login');
      return;
    }

    // Verify user is admin
    if (userInfo && userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
      router.push('/');
      return;
    }

    fetchPayments();
  }, [token, userInfo, router, isLoading]);

  const fetchPayments = async () => {
    if (isLoading) return;
    if (!token) return;
    
    try {
      setRefreshing(true);
      
      // Check if userInfo and condominiumId are available
      if (!userInfo || !userInfo.condominiumId) {
        setError('No se encuentra disponible la información del condominio');
        return;
      }
      
      // Fetch all payments from API with condominiumId
      const paymentsData = await getAllPayments(token, userInfo.condominiumId);
      setPayments(paymentsData);
      
      // Extract unique properties, years and payment methods for filters
      if (paymentsData.length > 0) {
        // Unique properties
        const propertiesMap = new Map<number, {type?: string, number?: string | null}>();
        
        paymentsData.forEach((payment: Payment) => {
          if (payment.receipt && payment.receipt.property) {
            const propId = payment.receipt.property.id;
            if (propId && !propertiesMap.has(propId)) {
              propertiesMap.set(propId, {
                type: payment.receipt.property.type,
                number: payment.receipt.property.number || undefined
              });
            }
          }
        });
        
        const uniqueProperties = Array.from(propertiesMap.entries()).map(([id, prop]) => ({ 
          id, 
          type: prop.type,
          number: prop.number ? prop.number : undefined
        }));
        
        // Unique years
        const uniqueYears = Array.from(new Set(paymentsData.map(
          (payment: Payment) => {
            const date = new Date(payment.date);
            return date.getFullYear().toString();
          }
        ))).sort((a, b) => parseInt(b as string) - parseInt(a as string)) as string[];
        
        // Unique payment methods
        const uniqueMethods = Array.from(new Set(paymentsData.map(
          (payment: Payment) => payment.method
        ))) as string[];
        
        setProperties(uniqueProperties);
        setYears(uniqueYears);
        setMethods(uniqueMethods);
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (payments.length > 0) {
      let result = [...payments];
      
      // Apply status filter
      if (filters.status !== 'all') {
        result = result.filter(payment => payment.status.toLowerCase() === filters.status);
      }
      
      // Apply year filter
      if (filters.year !== 'all') {
        result = result.filter(payment => {
          const date = new Date(payment.date);
          return date.getFullYear().toString() === filters.year;
        });
      }
      
      // Apply property filter
      if (filters.property !== 'all') {
        result = result.filter(payment => 
          payment.receipt && payment.receipt.property && payment.receipt.property.id && 
          payment.receipt.property.id.toString() === filters.property
        );
      }
      
      // Apply method filter
      if (filters.method !== 'all') {
        result = result.filter(payment => payment.method.toLowerCase() === filters.method.toLowerCase());
      }
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(payment => 
          // Search by payment ID
          payment.id.toString().includes(searchLower) ||
          // Search by reference
          (payment.reference && payment.reference.toLowerCase().includes(searchLower)) ||
          // Search by property number
          (payment.receipt?.property?.number && payment.receipt.property.number.toLowerCase().includes(searchLower))
        );
      }
      
      setFilteredPayments(result);
      // Calculate total pages
      setTotalPages(Math.ceil(result.length / itemsPerPage));
    }
  }, [filters, payments, itemsPerPage]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Aprobado
          </span>
        );
      case 'pending':
      case 'pendiente':
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
      case 'rechazado':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Rechazado
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Verificado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs flex items-center">
            {status}
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

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error de formato';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Verificación de Pagos</h1>
            <button 
              onClick={fetchPayments}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
              disabled={refreshing}
            >
              <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> 
              {refreshing ? 'Actualizando...' : 'Refrescar'}
            </button>
          </div>
          
          <div className="text-gray-500 text-sm mb-6">
            Total: <span className="font-medium">{payments.length}</span> pagos registrados
          </div>
          
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="approved">Aprobados</option>
                  <option value="pending">Pendientes</option>
                  <option value="rejected">Rechazados</option>
                  <option value="verified">Verificados</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Año</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Propiedad</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.property}
                  onChange={(e) => handleFilterChange('property', e.target.value)}
                >
                  <option value="all">Todas</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.type ? `${property.type} ${property.number ? `(${property.number})` : ''}` : 'Sin propiedad'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Método de Pago</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {methods.map(method => (
                    <option key={method} value={method}>
                      {method === 'transfer' || method === 'bank_transfer' ? 'Transferencia' : 
                       method === 'cash' ? 'Efectivo' : 
                       method === 'credit_card' ? 'Tarjeta de Crédito' : 
                       method === 'debit_card' ? 'Tarjeta de Débito' : 
                       method === 'mobile_payment' ? 'Pago Móvil' :
                       method}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Buscar</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ID, referencia, propiedad..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron pagos con los filtros seleccionados</p>
            </div>
          ) : (
            <>
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
                        Recibo/Propiedad
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
                    {currentItems.map((payment) => (
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
                                Recibo #{payment.receipt.id} - {payment.receipt.month} {payment.receipt.year}
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
                            href={`/admin/payment/${payment.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Detalles
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="py-4 flex justify-center mt-4">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 