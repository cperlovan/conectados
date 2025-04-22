"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import Cookies from 'js-cookie';
import { getToken, getUser } from '@/lib/auth';
import { Budget } from '@/types/budget';
import { FiFilter, FiChevronDown, FiChevronUp, FiEye, FiList, FiLayout, FiMail, FiPhone, FiColumns, FiEdit2, FiTrash2, FiPlus, FiFileText } from 'react-icons/fi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { es } from 'date-fns/locale';

interface BudgetStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Column {
  id: string
  label: string
  visible: boolean
  sortable: boolean
}

export default function BudgetsList() {
  const router = useRouter();
  const { token, userInfo, isLoading: isTokenLoading, error: tokenError } = useToken();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<BudgetStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // New state variables for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });
  const [columns, setColumns] = useState<Column[]>([
    { id: 'title', label: 'Título', visible: true, sortable: true },
    { id: 'supplier', label: 'Proveedor', visible: true, sortable: true },
    { id: 'description', label: 'Descripción', visible: true, sortable: true },
    { id: 'amount', label: 'Monto', visible: true, sortable: true },
    { id: 'status', label: 'Estado', visible: true, sortable: true },
    { id: 'dueDate', label: 'Fecha', visible: true, sortable: true },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false },
  ]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isTokenLoading && !token) {
      console.log('No token found, redirecting to login');
      router.push('/login');
      return;
    }

    // If there's a token error, display it
    if (tokenError) {
      console.error('Token error:', tokenError);
      setError(tokenError);
      setLoading(false);
      return;
    }

    // Only fetch data when token loading is complete
    if (!isTokenLoading) {
      console.log('Token loading complete, fetching budgets...', { 
        hasToken: !!token, 
        hasUserInfo: !!userInfo,
        userRole: userInfo?.role,
        supplierId: userInfo?.supplierId
      });
      
      fetchBudgets();
    }
  }, [token, userInfo, isTokenLoading, tokenError, router]);

  // Apply filters whenever budgets or selectedMonth or searchTerm changes
  useEffect(() => {
    applyFilters();
  }, [budgets, selectedMonth, searchTerm]);

  const applyFilters = () => {
    let filtered = [...budgets];
    
    // Apply month filter for all users
    if (selectedMonth !== null) {
      filtered = filtered.filter((budget) => {
        const dueDate = new Date(budget.dueDate);
        return dueDate.getMonth() === selectedMonth;
      });
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((budget) => 
        (budget.title?.toLowerCase() || '').includes(term) ||
        (budget.description?.toLowerCase() || '').includes(term) ||
        (budget.supplier?.name?.toLowerCase() || '').includes(term)
      );
    }
    
    setFilteredBudgets(filtered);
    
    // Update stats based on filtered budgets
    const newStats = {
      total: filtered.length,
      pending: filtered.filter((b) => b.status === 'pending').length,
      approved: filtered.filter((b) => b.status === 'approved').length,
      rejected: filtered.filter((b) => b.status === 'rejected').length
    };
    
    setStats(newStats);
    
    // Update total pages based on filtered results
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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

  const sortData = (data: Budget[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Budget] || '';
      let bValue: any = b[sortConfig.key as keyof Budget] || '';

      // Handle special cases
      if (sortConfig.key === 'supplier') {
        aValue = a.supplier?.name || '';
        bValue = b.supplier?.name || '';
      } else if (sortConfig.key === 'dueDate' || sortConfig.key === 'createdAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Get current page data
  const sortedData = sortData(filteredBudgets);
  const currentBudgets = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const fetchBudgets = async () => {
    try {
      if (!token || !userInfo) {
        console.error('Missing authentication data:', { hasToken: !!token, hasUserInfo: !!userInfo });
        setError('No se pudo cargar la información de autenticación');
        setLoading(false);
        return;
      }

      // Check if user is a supplier or admin
      if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier' && userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
        console.error('User is not authorized:', userInfo.role);
        setError('No tienes permisos para acceder a esta página');
        setLoading(false);
        return;
      }

      let endpoint = '';
      
      // Determine the endpoint based on user role
      if (userInfo.role === 'admin' || userInfo.role === 'superadmin') {
        if (!userInfo.condominiumId) {
          console.error('Missing condominiumId for admin user:', userInfo);
          setError('No se encontró el ID del condominio. Por favor, contacta al administrador.');
          setLoading(false);
          return;
        }
        endpoint = `http://localhost:3040/api/budgets/condominium/${userInfo.condominiumId}`;
      } else {
        // Para usuarios proveedores, intentar obtener el supplierId si no está disponible
        if (!userInfo.supplierId) {
          console.warn('Missing supplierId for supplier user, attempting to fetch it:', userInfo);
          
          try {
            // Intentar obtener el supplierId directamente del backend
            const supplierResponse = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!supplierResponse.ok) {
              throw new Error('Error al obtener información del proveedor');
            }
            
            const supplierData = await supplierResponse.json();
            console.log('Supplier data received:', supplierData);
            
            if (supplierData && supplierData.id) {
              // Actualizar el userInfo con el supplierId obtenido
              userInfo.supplierId = supplierData.id;
              console.log('Updated userInfo with supplierId:', userInfo);
            } else {
              console.error('No se encontró el ID del proveedor en la respuesta');
              setError('No se encontró el ID del proveedor. Por favor, contacta al administrador.');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error al obtener el supplierId:', error);
            setError('Error al obtener información del proveedor. Por favor, contacta al administrador.');
            setLoading(false);
            return;
          }
        }
        
        endpoint = `http://localhost:3040/api/budgets/supplier/${userInfo.supplierId}`;
      }
      
      console.log('Fetching budgets from endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.message || 'Error al cargar los presupuestos');
      }

      const data = await response.json();
      console.log('Budgets data received:', { 
        count: data.budgets?.length || 0,
        stats: data.stats
      });
      
      // Set all budgets
      const budgets = data.budgets || [];
      setBudgets(budgets);
      
      // Initial filtering will be applied by the useEffect
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar los presupuestos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los presupuestos');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApprove = async (budgetId: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/budgets/${budgetId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al aprobar el presupuesto');
      }

      // Recargar los presupuestos
      await fetchBudgets();
    } catch (error) {
      console.error('Error al aprobar el presupuesto:', error);
      setError(error instanceof Error ? error.message : 'Error al aprobar el presupuesto');
    }
  };

  const handleReject = async (budgetId: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/budgets/${budgetId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al rechazar el presupuesto');
      }

      // Recargar los presupuestos
      await fetchBudgets();
    } catch (error) {
      console.error('Error al rechazar el presupuesto:', error);
      setError(error instanceof Error ? error.message : 'Error al rechazar el presupuesto');
    }
  };

  const handleDelete = async (budgetId: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el presupuesto');
      }

      // Recargar los presupuestos
      await fetchBudgets();
      // Cerrar el diálogo de confirmación
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error al eliminar el presupuesto:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar el presupuesto');
      // Cerrar el diálogo de confirmación
      setDeleteConfirmId(null);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMonth(value === 'all' ? null : parseInt(value, 10));
  };

  // Kanban board component
  const KanbanBoard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentBudgets.map((budget) => (
          <div key={budget.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <div className="font-bold text-xl text-gray-800">
                    {budget.title || 'Sin título'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">ID: {budget.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                  {budget.status === 'pending' ? 'Pendiente' : 
                   budget.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-3">
                    <FiMail className="text-gray-400 mr-2" />
                    <span className="font-medium">Proveedor:</span>
                    <span className="ml-2">{budget.supplier?.name || 'N/A'}</span>
                  </div>
                  {budget.description && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">Descripción:</span>
                      <span className="line-clamp-3">{budget.description}</span>
                    </div>
                  )}
                </div>

                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="font-medium">Monto:</span>
                    <span className="ml-2 text-lg font-medium text-blue-600">
                      ${typeof budget.amount === 'number' ? budget.amount.toFixed(2) : Number(budget.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="font-medium">Fecha:</span>
                    <span className="ml-2">
                      {new Date(budget.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
              <Link
                href={`/supplier/budgets/${budget.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <FiEye className="mr-2" />
                Ver
              </Link>
              {(userInfo?.role === 'proveedor' || userInfo?.role === 'supplier') && budget.status === 'pending' && (
                <>
                  <Link
                    href={`/supplier/budgets/${budget.id}/edit`}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <FiEdit2 className="mr-2" />
                    Editar
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(budget.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <FiTrash2 className="mr-2" />
                    Eliminar
                  </button>
                </>
              )}
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando presupuestos...</p>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Presupuestos</h1>
              <p className="text-sm text-gray-500">Administra tus presupuestos enviados o recibidos.</p>
            </div>
            {(userInfo?.role === 'supplier' || userInfo?.role === 'proveedor') && (
              <Button onClick={() => router.push('/supplier/budgets/new')} className="bg-green-600 hover:bg-green-700 text-white">
                <FiPlus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
              </Button>
            )}
          </div>

          {/* Empty State Check */}
          {!loading && !error && budgets.length === 0 ? (
            <div className="text-center py-20 border-t border-gray-200 mt-6">
              <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No hay presupuestos registrados</h3>
              <p className="mt-2 text-base text-gray-500">
                Aún no has creado ni recibido ningún presupuesto.
                {(userInfo?.role === 'supplier' || userInfo?.role === 'proveedor') && " ¡Empieza creando uno!"}
              </p>
              {(userInfo?.role === 'supplier' || userInfo?.role === 'proveedor') && (
                <div className="mt-8">
                  <Button onClick={() => router.push('/supplier/budgets/new')}>
                    <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                    Crear Nuevo Presupuesto
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <> 
              {/* Stats and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border-y border-gray-200 py-4">
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="text-lg font-semibold">Total</h3>
                  <p className="text-2xl">{stats.total}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded shadow">
                  <h3 className="text-lg font-semibold">Pendientes</h3>
                  <p className="text-2xl">{stats.pending}</p>
                </div>
                <div className="bg-green-100 p-4 rounded shadow">
                  <h3 className="text-lg font-semibold">Aprobados</h3>
                  <p className="text-2xl">{stats.approved}</p>
                </div>
                <div className="bg-red-100 p-4 rounded shadow">
                  <h3 className="text-lg font-semibold">Rechazados</h3>
                  <p className="text-2xl">{stats.rejected}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Presupuestos</h1>
                </div>

                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center">
                        <FiEye className="mr-2" />
                        Columnas
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {columns.map(column => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.visible}
                          onCheckedChange={() => toggleColumnVisibility(column.id)}
                        >
                          {column.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Search and filter container */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Buscar por título, descripción o proveedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedMonth === null ? 'all' : selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : parseInt(e.target.value, 10))}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Todos los meses</option>
                      <option value="0">Enero</option>
                      <option value="1">Febrero</option>
                      <option value="2">Marzo</option>
                      <option value="3">Abril</option>
                      <option value="4">Mayo</option>
                      <option value="5">Junio</option>
                      <option value="6">Julio</option>
                      <option value="7">Agosto</option>
                      <option value="8">Septiembre</option>
                      <option value="9">Octubre</option>
                      <option value="10">Noviembre</option>
                      <option value="11">Diciembre</option>
                    </select>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* View mode selector */}
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
              </div>

              {/* Content based on view mode */}
              {filteredBudgets.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600">No hay presupuestos que coincidan con los criterios de búsqueda</p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map(column => column.visible && (
                          <th
                            key={column.id}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => column.sortable && handleSort(column.id)}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{column.label}</span>
                              {column.sortable && sortConfig.key === column.id && (
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
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentBudgets.map((budget) => (
                        <tr key={budget.id} className="hover:bg-gray-50">
                          {columns.find(col => col.id === 'title')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{budget.title}</div>
                            </td>
                          )}
                          {columns.find(col => col.id === 'supplier')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {budget.supplier?.name || 'N/A'}
                              </div>
                              {userInfo && (userInfo.role === 'admin' || userInfo.role === 'superadmin') && budget.supplier?.User && (
                                <div className="text-xs text-gray-500">
                                  {budget.supplier.User.email || ''}
                                </div>
                              )}
                            </td>
                          )}
                          {columns.find(col => col.id === 'description')?.visible && (
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 truncate max-w-xs">{budget.description}</div>
                            </td>
                          )}
                          {columns.find(col => col.id === 'amount')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ${typeof budget.amount === 'number' ? budget.amount.toFixed(2) : Number(budget.amount).toFixed(2)}
                              </div>
                            </td>
                          )}
                          {columns.find(col => col.id === 'status')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                                {budget.status === 'pending' ? 'Pendiente' : 
                                 budget.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                              </span>
                            </td>
                          )}
                          {columns.find(col => col.id === 'dueDate')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(budget.dueDate).toLocaleDateString()}
                            </td>
                          )}
                          {columns.find(col => col.id === 'actions')?.visible && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/supplier/budgets/${budget.id}`}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Ver
                              </Link>
                              {userInfo && (userInfo.role === 'proveedor' || userInfo.role === 'supplier') && budget.status === 'pending' && (
                                <>
                                  <Link
                                    href={`/supplier/budgets/${budget.id}/edit`}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    Editar
                                  </Link>
                                  <button
                                    onClick={() => setDeleteConfirmId(budget.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <KanbanBoard />
              )}

              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    Mostrando {filteredBudgets.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} a {Math.min(currentPage * rowsPerPage, filteredBudgets.length)} de {filteredBudgets.length} resultados
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Confirmation dialog for delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Está seguro que desea eliminar este presupuesto? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmId) handleDelete(deleteConfirmId);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 