'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/app/hook/useToken';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiCreditCard, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiFilter, 
  FiSearch, 
  FiRefreshCw, 
  FiChevronUp, 
  FiChevronDown,
  FiColumns,
  FiList,
  FiGrid,
  FiLayout,
  FiHome
} from 'react-icons/fi';
import { fetchAPI, Payment, getAllPayments } from '@/app/utils/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  // Add state for column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    date: true,
    amount: true,
    method: true,
    reference: true,
    property: true,
    status: true,
    actions: true
  });

  // Add view mode state
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const sortData = (data: Payment[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Payment] || '';
      let bValue: any = b[sortConfig.key as keyof Payment] || '';

      // Manejar casos especiales
      if (sortConfig.key === 'property') {
        aValue = a.receipt?.property?.number || '';
        bValue = b.receipt?.property?.number || '';
      } else if (sortConfig.key === 'receipt') {
        aValue = a.receipt?.id || 0;
        bValue = b.receipt?.id || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  useEffect(() => {
    if (payments.length > 0) {
      let result = [...payments];
      
      // Aplicar ordenamiento
      result = sortData(result);
      
      // Aplicar filtros existentes
      if (filters.status !== 'all') {
        result = result.filter(payment => payment.status.toLowerCase() === filters.status);
      }
      
      if (filters.year !== 'all') {
        result = result.filter(payment => {
          const date = new Date(payment.date);
          return date.getFullYear().toString() === filters.year;
        });
      }
      
      if (filters.property !== 'all') {
        result = result.filter(payment => 
          payment.receipt && payment.receipt.property && payment.receipt.property.id && 
          payment.receipt.property.id.toString() === filters.property
        );
      }
      
      if (filters.method !== 'all') {
        result = result.filter(payment => payment.method.toLowerCase() === filters.method.toLowerCase());
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(payment => 
          payment.id.toString().includes(searchLower) ||
          (payment.reference && payment.reference.toLowerCase().includes(searchLower)) ||
          (payment.receipt?.property?.number && payment.receipt.property.number.toLowerCase().includes(searchLower))
        );
      }
      
      setFilteredPayments(result);
      setTotalPages(Math.ceil(result.length / itemsPerPage));
    }
  }, [filters, payments, itemsPerPage, sortConfig]);

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

  // Add function to toggle column visibility
  const toggleColumnVisibility = (columnId: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Add Kanban board component
  const KanbanBoard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((payment) => (
          <div key={payment.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <div className="font-bold text-xl text-gray-800">#{payment.id}</div>
                  {getPaymentMethodBadge(payment.method)}
                </div>
                {getStatusBadge(payment.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold block mb-2">Fecha:</span>
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-400 mr-2" />
                    {formatDate(payment.date)}
                  </div>
                </div>
                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold block mb-2">Monto:</span>
                  <div className="flex items-center text-lg font-medium text-gray-900">
                    <FiDollarSign className="text-gray-400 mr-2" />
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
                {payment.reference && (
                  <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg col-span-2">
                    <span className="font-semibold block mb-2">Referencia:</span>
                    <div className="flex items-center">
                      <FiCreditCard className="text-gray-400 mr-2" />
                      {payment.reference}
                    </div>
                  </div>
                )}
              </div>

              {payment.receipt && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-gray-900 text-sm font-semibold mb-3">Detalles del Recibo:</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    {payment.receipt.property && (
                      <p className="text-gray-700 text-sm mb-2 flex items-center">
                        <FiHome className="text-blue-500 mr-2" />
                        <span className="font-medium">{payment.receipt.property.type} {payment.receipt.property.number}</span>
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Recibo:</span> #{payment.receipt.id}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Período:</span> {payment.receipt.month}/{payment.receipt.year}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <Link
                href={`/admin/payment/${payment.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center hover:bg-blue-50 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Ver Detalles
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
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

          {/* Add View Mode Selector */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Vista:</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                    viewMode === 'table'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiList className="mr-1" />
                  <span>Tabla</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                    viewMode === 'kanban'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiLayout className="mr-1" />
                  <span>Tarjetas</span>
                </button>
              </div>
            </div>

            {viewMode === 'table' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FiColumns />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.id}
                    onCheckedChange={() => toggleColumnVisibility('id')}
                  >
                    ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.date}
                    onCheckedChange={() => toggleColumnVisibility('date')}
                  >
                    Fecha
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.amount}
                    onCheckedChange={() => toggleColumnVisibility('amount')}
                  >
                    Monto
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.method}
                    onCheckedChange={() => toggleColumnVisibility('method')}
                  >
                    Método
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.reference}
                    onCheckedChange={() => toggleColumnVisibility('reference')}
                  >
                    Referencia
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.property}
                    onCheckedChange={() => toggleColumnVisibility('property')}
                  >
                    Recibo/Propiedad
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumnVisibility('status')}
                  >
                    Estado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={() => toggleColumnVisibility('actions')}
                  >
                    Acciones
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Render view based on selected mode */}
          {viewMode === 'table' ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {visibleColumns.id && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>ID</span>
                            {sortConfig.key === 'id' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.date && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Fecha</span>
                            {sortConfig.key === 'date' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.amount && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Monto</span>
                            {sortConfig.key === 'amount' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.method && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('method')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Método</span>
                            {sortConfig.key === 'method' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.reference && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('reference')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Referencia</span>
                            {sortConfig.key === 'reference' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.property && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('property')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Recibo/Propiedad</span>
                            {sortConfig.key === 'property' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Estado</span>
                            {sortConfig.key === 'status' && (
                              <span>
                                {sortConfig.direction === 'asc' ? (
                                  <FiChevronUp className="inline" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <FiChevronDown className="inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.actions && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        {visibleColumns.id && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">#{payment.id}</div>
                          </td>
                        )}
                        {visibleColumns.date && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiCalendar className="text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {formatDate(payment.date)}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.amount && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiDollarSign className="text-gray-400 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.method && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentMethodBadge(payment.method)}
                          </td>
                        )}
                        {visibleColumns.reference && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiCreditCard className="text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {payment.reference || 'N/A'}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.property && (
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
                        )}
                        {visibleColumns.status && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/payment/${payment.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalles
                            </Link>
                          </td>
                        )}
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
          ) : (
            <KanbanBoard />
          )}
        </div>
      </div>
    </div>
  );
} 