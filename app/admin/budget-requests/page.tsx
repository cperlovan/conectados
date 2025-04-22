"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiFilter, FiPlus, FiClipboard } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface BudgetRequest {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  condominiumId: number;
  suppliers: {
    id: number;
    name: string;
    email: string;
    contactInfo: {
      name: string;
      lastname: string;
      phone: string;
    };
  }[];
  budgets: {
    id: number;
    status: string;
    amount: number;
    supplierId: number;
  }[];
}

interface BudgetRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function BudgetRequestsList() {
  const router = useRouter();
  const { token, userInfo, isLoading: isTokenLoading, error: tokenError } = useToken();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BudgetRequest[]>([]);
  const [stats, setStats] = useState<BudgetRequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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
      console.log('Token loading complete, fetching budget requests...', { 
        hasToken: !!token, 
        hasUserInfo: !!userInfo,
        userRole: userInfo?.role,
        condominiumId: userInfo?.condominiumId
      });
      
      fetchBudgetRequests();
    }
  }, [token, userInfo, isTokenLoading, tokenError, router]);

  // Apply filters whenever requests, selectedStatus, or selectedMonth changes
  useEffect(() => {
    applyFilters();
  }, [requests, selectedStatus, selectedMonth]);

  const applyFilters = () => {
    let filtered = [...requests];
    
    // Apply status filter
    if (selectedStatus !== null) {
      filtered = filtered.filter((request) => request.status === selectedStatus);
    }
    
    // Apply month filter
    if (selectedMonth !== null) {
      filtered = filtered.filter((request) => {
        const dueDate = new Date(request.dueDate);
        return dueDate.getMonth() === selectedMonth;
      });
    }
    
    setFilteredRequests(filtered);
    
    // Update stats based on filtered requests
    const newStats = {
      total: filtered.length,
      pending: filtered.filter((r) => r.status === 'pending').length,
      inProgress: filtered.filter((r) => r.status === 'in_progress').length,
      completed: filtered.filter((r) => r.status === 'completed').length,
      cancelled: filtered.filter((r) => r.status === 'cancelled').length
    };
    
    setStats(newStats);
  };

  const fetchBudgetRequests = async () => {
    try {
      if (!token || !userInfo) {
        console.error('Missing authentication data:', { hasToken: !!token, hasUserInfo: !!userInfo });
        setError('No se pudo cargar la información de autenticación');
        setLoading(false);
        return;
      }

      // Check if user is an admin
      if (userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
        console.error('User is not authorized:', userInfo.role);
        setError('No tienes permisos para acceder a esta página');
        setLoading(false);
        return;
      }

      if (!userInfo.condominiumId) {
        console.error('Missing condominiumId for admin user:', userInfo);
        setError('No se encontró el ID del condominio. Por favor, contacta al administrador.');
        setLoading(false);
        return;
      }

      const endpoint = `http://localhost:3040/api/budget-requests/condominium/${userInfo.condominiumId}`;
      
      console.log('Fetching budget requests from endpoint:', endpoint);
      
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
        throw new Error(errorData.message || 'Error al cargar las solicitudes de presupuesto');
      }

      const data = await response.json();
      console.log('Budget requests data received:', { 
        count: data.budgetRequests?.length || 0,
        stats: data.stats
      });
      
      // Set all requests
      const requests = data.budgetRequests || [];
      setRequests(requests);
      
      // Initial filtering will be applied by the useEffect
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar las solicitudes de presupuesto:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar las solicitudes de presupuesto');
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3040/api/budget-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado de la solicitud');
      }

      // Reload budget requests
      await fetchBudgetRequests();
    } catch (error) {
      console.error('Error al actualizar el estado de la solicitud:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el estado de la solicitud');
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value === 'all' ? null : value);
  };

  const handleMonthFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMonth(value === 'all' ? null : parseInt(value, 10));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Progreso";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando solicitudes de presupuesto...</div>
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
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">Solicitudes de Presupuesto</h1>
            {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
              <Link
                href="/admin/budget-requests/new"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Nueva Solicitud
              </Link>
            )}
          </div>

          {/* Conditional Rendering: Loading / Error / Empty / Content */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando solicitudes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : requests.length === 0 ? (
            // Empty State 
            <div className="text-center py-20 border-t border-gray-200 mt-6">
              <FiClipboard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No hay solicitudes de presupuesto</h3>
              <p className="mt-2 text-base text-gray-500">
                Actualmente no se han creado solicitudes de presupuesto para este condominio.
              </p>
              {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
                <div className="mt-8">
                  <Button onClick={() => router.push('/admin/budget-requests/new')}>
                    <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                    Crear Nueva Solicitud
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Content when requests exist
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 border-b border-gray-200 pb-6">
                <div className="bg-gray-50 p-4 rounded shadow border">
                  <h3 className="text-lg font-semibold text-gray-700">Total</h3>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded shadow border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800">Pendientes</h3>
                  <p className="text-2xl font-semibold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded shadow border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800">En Progreso</h3>
                  <p className="text-2xl font-semibold text-blue-900">{stats.inProgress}</p>
                </div>
                <div className="bg-green-50 p-4 rounded shadow border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800">Completadas</h3>
                  <p className="text-2xl font-semibold text-green-900">{stats.completed}</p>
                </div>
                <div className="bg-red-50 p-4 rounded shadow border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800">Canceladas</h3>
                  <p className="text-2xl font-semibold text-red-900">{stats.cancelled}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <FiFilter className="mr-2 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-700">Filtrar Solicitudes</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <select
                    value={selectedStatus || 'all'}
                    onChange={handleStatusFilterChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <select
                    value={selectedMonth === null ? 'all' : selectedMonth}
                    onChange={handleMonthFilterChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los meses (Fecha Límite)</option>
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
                </div>
              </div>

              {/* Requests Table */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-10 border-t border-gray-200">
                  <p className="text-gray-600">No hay solicitudes que coincidan con los filtros seleccionados.</p>
                </div>
               ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Límite</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedores</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.suppliers?.length || 0} asignados
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link href={`/admin/budget-requests/${request.id}`} className="text-indigo-600 hover:text-indigo-900">
                              Ver Detalles
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 