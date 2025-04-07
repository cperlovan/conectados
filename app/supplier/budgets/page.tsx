"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import Cookies from 'js-cookie';
import { getToken, getUser } from '@/lib/auth';
import { Budget } from '@/types/budget';

interface BudgetStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function BudgetsList() {
  const router = useRouter();
  const { token, userInfo, isLoading: isTokenLoading, error: tokenError } = useToken();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<BudgetStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
        if (!userInfo.supplierId) {
          console.error('Missing supplierId for supplier user:', userInfo);
          setError('No se encontró el ID del proveedor. Por favor, contacta al administrador.');
          setLoading(false);
          return;
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
      
      // Calcular estadísticas según el rol del usuario
      const budgets = data.budgets || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let filteredBudgets = budgets;
      if (userInfo.role === 'proveedor' || userInfo.role === 'supplier') {
        // Para proveedores, filtrar solo sus presupuestos del mes actual
        filteredBudgets = budgets.filter((budget: Budget) => {
          const budgetDate = new Date(budget.createdAt);
          return budgetDate.getMonth() === currentMonth && 
                 budgetDate.getFullYear() === currentYear;
        });
      }

      // Calcular estadísticas basadas en los presupuestos filtrados
      const stats = {
        total: filteredBudgets.length,
        pending: filteredBudgets.filter((b: Budget) => b.status === 'pending').length,
        approved: filteredBudgets.filter((b: Budget) => b.status === 'approved').length,
        rejected: filteredBudgets.filter((b: Budget) => b.status === 'rejected').length
      };
      
      setBudgets(budgets);
      setStats(stats);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando presupuestos...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          {userInfo && (userInfo.role === 'proveedor' || userInfo.role === 'supplier') && (
            <Link
              href="/supplier/budgets/new"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Nuevo Presupuesto
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        {budgets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No hay presupuestos creados</p>
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
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{budget.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {budget.supplier?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {budget.supplier?.name || 'N/A'}
                      </div>
                      {userInfo && (userInfo.role === 'admin' || userInfo.role === 'superadmin') && (
                        <>
                          <div className="text-xs text-gray-500">
                            Contacto: {budget.supplier?.User?.ContactInfo ?
                              `${budget.supplier.User.ContactInfo.name} ${budget.supplier.User.ContactInfo.lastname}`.trim() || 'N/A'
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {budget.supplier?.User?.email || ''}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{budget.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${typeof budget.amount === 'number' ? budget.amount.toFixed(2) : Number(budget.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(budget.dueDate).toLocaleDateString()}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Diálogo de confirmación para eliminar */}
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
                onClick={() => handleDelete(deleteConfirmId)}
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