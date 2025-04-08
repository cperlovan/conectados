"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiFilter, FiPlus } from "react-icons/fi";

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Presupuesto</h1>
          <Link
            href="/admin/budget-requests/new"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Nueva Solicitud
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center mb-2">
            <FiFilter className="mr-2 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-700">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedStatus === null ? 'all' : selectedStatus}
                onChange={handleStatusFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={selectedMonth === null ? 'all' : selectedMonth}
                onChange={handleMonthFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Total</h3>
            <p className="text-2xl">{stats.total}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Pendientes</h3>
            <p className="text-2xl">{stats.pending}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">En Progreso</h3>
            <p className="text-2xl">{stats.inProgress}</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Completadas</h3>
            <p className="text-2xl">{stats.completed}</p>
          </div>
          <div className="bg-red-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Canceladas</h3>
            <p className="text-2xl">{stats.cancelled}</p>
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No hay solicitudes de presupuesto</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuestos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.suppliers.length} proveedor{request.suppliers.length !== 1 ? 'es' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.budgets.length} presupuesto{request.budgets.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/budget-requests/${request.id}`}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Ver
                      </Link>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'in_progress')}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Iniciar
                        </button>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'completed')}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Completar
                        </button>
                      )}
                      {(request.status === 'pending' || request.status === 'in_progress') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 