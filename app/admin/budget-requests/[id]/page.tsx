"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

interface BudgetRequest {
  id: number;
  title: string;
  description: string;
  details: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  condominiumId: number;
  suppliers: {
    id: number;
    name: string;
    email: string;
    contactInfo?: {
      name?: string;
      lastname?: string;
      phone?: string;
      movil?: string;
      address?: string;
    };
    economicActivities: {
      id: number;
      name: string;
    }[];
  }[];
  budgets: {
    id: number;
    status: string;
    amount: number;
    supplierId: number;
    supplier: {
      name: string;
    };
    createdAt: string;
  }[];
}

export default function BudgetRequestDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [request, setRequest] = useState<BudgetRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use params.id directly since we're in a client component
  const id = params.id;

  useEffect(() => {
    // Only redirect if token is missing or userInfo is not available
    if (!isLoading && !token) {
      router.push('/login');
      return;
    }

    // For admin users, check if condominiumId is available
    if (!isLoading && userInfo?.role === 'admin' || userInfo?.role === 'superadmin') {
      if (!userInfo?.condominiumId) {
        console.error('Admin user missing condominiumId');
        setError('No se pudo obtener la información del condominio');
        setLoading(false);
        return;
      }
    }

    if (!isLoading && token) {
      fetchBudgetRequest();
    }
  }, [token, userInfo, isLoading, router, id]);

  const fetchBudgetRequest = async () => {
    try {
      if (!token) {
        setError("No se pudo obtener la información de autenticación");
        setLoading(false);
        return;
      }

      // For admin users, check if condominiumId is available
      if (userInfo?.role === 'admin' || userInfo?.role === 'superadmin') {
        if (!userInfo?.condominiumId) {
          setError("No se pudo obtener la información del condominio");
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`http://localhost:3040/api/budget-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al cargar la solicitud de presupuesto");
      }

      const data = await response.json();
      setRequest(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget request:", error);
      setError(error instanceof Error ? error.message : "Error al cargar la solicitud de presupuesto");
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3040/api/budget-requests/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la solicitud");
      }

      // Reload budget request
      await fetchBudgetRequest();
    } catch (error) {
      console.error("Error al actualizar el estado de la solicitud:", error);
      setError(error instanceof Error ? error.message : "Error al actualizar el estado de la solicitud");
    }
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando...</div>
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

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Solicitud no encontrada
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Link
                href="/admin/budget-requests"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft className="text-xl" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Detalles de la Solicitud</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>

          <div className="bg-white shadow-xl rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{request.title}</h2>
            </div>

            {request.status === 'pending' && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <FiX className="mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <FiCheck className="mr-2" />
                    Iniciar
                  </button>
                </div>
              </div>
            )}

            {request.status === 'in_progress' && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <FiX className="mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <FiCheck className="mr-2" />
                    Completar
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1 text-gray-900">{request.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Detalles Adicionales</h3>
                  <p className="mt-1 text-gray-900">{request.details || "No hay detalles adicionales"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Vencimiento</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(request.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proveedores Seleccionados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.suppliers?.map(supplier => (
                  <div key={supplier.id} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Empresa: {supplier.name}</h4>
                    <p className="text-sm text-gray-500">{supplier.email}</p>
                    {supplier.contactInfo && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Contacto:</p>
                        <p className="text-sm text-gray-500">
                          {supplier.contactInfo.name || ''} {supplier.contactInfo.lastname || ''}
                        </p>
                        {supplier.contactInfo.phone && (
                          <p className="text-sm text-gray-500">Tel: {supplier.contactInfo.phone}</p>
                        )}
                        {supplier.contactInfo.movil && (
                          <p className="text-sm text-gray-500">Móvil: {supplier.contactInfo.movil}</p>
                        )}
                        {supplier.contactInfo.address && (
                          <p className="text-sm text-gray-500">Dirección: {supplier.contactInfo.address}</p>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Actividades:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {supplier.economicActivities?.map(activity => (
                          <span
                            key={activity.id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {activity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Presupuestos Recibidos</h3>
              {!request.budgets?.length ? (
                <p className="text-gray-500">No se han recibido presupuestos aún</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proveedor
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
                      {request.budgets?.map(budget => (
                        <tr key={budget.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {budget.supplier?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${budget.amount?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                              {getStatusText(budget.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(budget.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/supplier/budgets/${budget.id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Ver
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
      </div>
    </div>
  );
} 