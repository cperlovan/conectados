"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";
import { FiArrowLeft, FiEye, FiPlus } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from 'lucide-react';

interface BudgetRequest {
  id: number;
  title: string;
  description: string;
  details?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  condominiumId: number;
  budgets: {
    id: number;
    status: string;
    amount: number;
    supplierId: number;
    createdAt: string;
    description?: string;
    items?: {
      id: number;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  }[];
}

// Helper function to update user info with supplier ID
const updateUserInfoWithSupplierId = async (token: string, userInfo: any) => {
  if (!userInfo?.id) {
    console.error("Cannot fetch supplier ID: User ID is missing");
    throw new Error("ID de usuario no encontrado");
  }
  
  console.log("Fetching supplier ID for user:", userInfo.id);
  
  const response = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    console.error("Failed to fetch supplier info:", response.status, response.statusText);
    throw new Error("Error al obtener información del proveedor");
  }
  
  const data = await response.json();
  console.log("Supplier data received:", data);
  
  if (!data || !data.id) {
    console.error("No supplier ID found in response:", data);
    throw new Error("No se encontró el ID del proveedor");
  }
  
  console.log("Supplier ID obtained:", data.id);
  
  // Update the user info object directly
  return {
    ...userInfo,
    supplierId: data.id
  };
};

// Debug function to validate the budget request API endpoint
const debugCheckBudgetRequestApi = async (id: string, token: string) => {
  console.log("DEBUG: Testing budget request API endpoint for ID:", id);
  try {
    const response = await fetch(`http://localhost:3040/api/budget-requests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("DEBUG: API Response Status:", response.status);
    
    if (!response.ok) {
      console.error("DEBUG: API Error Response:", response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log("DEBUG: API Response Data:", data);
    return true;
  } catch (error) {
    console.error("DEBUG: API Request Error:", error);
    return false;
  }
};

export default function BudgetRequestDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [budgetRequest, setBudgetRequest] = useState<BudgetRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Access the id directly from params since we're in a client component
  const id = params.id;

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Esperar a que se complete la carga del token
      if (isLoading) return;
      
      if (!token || !userInfo) {
        console.log('No hay token o información de usuario, redirigiendo a login');
        router.push("/login");
        return;
      }

      // Verificar que el usuario sea un proveedor
      if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier') {
        console.log('Usuario no es proveedor, redirigiendo');
        router.push("/unauthorized");
        return;
      }

      // Asegurarse de que tengamos el supplierId
      if (!userInfo.supplierId) {
        try {
          console.log('Intentando obtener supplierId para usuario:', userInfo.id);
          const response = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Error al obtener información del proveedor');
          }

          const data = await response.json();
          console.log('Respuesta al obtener supplierId:', data);
          
          if (data && data.id) {
            console.log('SupplierId obtenido:', data.id);
            // Actualizar el userInfo con el supplierId
            userInfo.supplierId = data.id;
          } else {
            console.error('No se encontró el ID del proveedor en la respuesta');
            setError('No se pudo obtener la información del proveedor');
            return;
          }
        } catch (error) {
          console.error('Error al obtener supplierId:', error);
          setError('Error al obtener información del proveedor');
          return;
        }
      }

      // Proceder a obtener la solicitud de presupuesto
      fetchBudgetRequest();
    };

    checkAuthAndFetch();
  }, [token, userInfo, isLoading, router, id]);

  const fetchBudgetRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`http://localhost:3040/api/budget-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener la solicitud de presupuesto");
      }

      const data = await response.json();
      setBudgetRequest(data);
    } catch (err) {
      console.error("Error al obtener la solicitud de presupuesto:", err);
      setError(err instanceof Error ? err.message : "Error al obtener la solicitud de presupuesto");
    } finally {
      setLoading(false);
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
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getBudgetStatus = (budgets: any[]) => {
    if (!budgets || budgets.length === 0) {
      return "pending";
    }
    
    const hasApproved = budgets.some(b => b.status === "approved");
    const hasRejected = budgets.some(b => b.status === "rejected");
    const hasPending = budgets.some(b => b.status === "pending");
    
    if (hasApproved) return "completed";
    if (hasRejected && !hasPending) return "cancelled";
    return "in_progress";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles de la solicitud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !budgetRequest) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiEye className="mr-2" />
            {error || "No se encontró la solicitud de presupuesto"}
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const status = getBudgetStatus(budgetRequest.budgets);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Encabezado */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{budgetRequest.title}</h1>
              <div className="text-gray-500 text-sm">
                Creada el {new Date(budgetRequest.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Estado y Fecha de Vencimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Estado</div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Fecha de Vencimiento</div>
              <div className="text-sm font-medium">
                {new Date(budgetRequest.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Descripción</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{budgetRequest.description}</p>
            </div>
          </div>

          {/* Detalles Adicionales */}
          {budgetRequest.details && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Detalles Adicionales</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{budgetRequest.details}</p>
              </div>
            </div>
          )}

          {/* Presupuestos */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Presupuestos</h2>
              {status !== "completed" && status !== "cancelled" && (
                <button
                  onClick={async () => {
                    try {
                      // Ensure supplier ID is available before proceeding
                      let currentUserInfo = userInfo;
                      
                      if (!currentUserInfo?.supplierId) {
                        console.log("No supplier ID available, attempting to fetch it");
                        try {
                          // Fetch supplier ID and update the user info
                          currentUserInfo = await updateUserInfoWithSupplierId(token!, currentUserInfo);
                          console.log("Updated user info with supplier ID:", currentUserInfo);
                        } catch (error) {
                          console.error('Error obtaining supplierId:', error);
                          setError("No se pudo obtener el ID del proveedor. Por favor, contacte al administrador.");
                          return;
                        }
                      }
                      
                      // Validate the budget request API endpoint before navigating
                      if (token) {
                        const isApiValid = await debugCheckBudgetRequestApi(params.id, token);
                        
                        if (!isApiValid) {
                          console.error("Budget request API endpoint validation failed");
                          setError("No se pudo validar la solicitud de presupuesto. Por favor, inténtelo de nuevo.");
                          return;
                        }
                      } else {
                        console.error("No token available for API validation");
                        setError("No se pudo validar la autenticación. Por favor, inicie sesión nuevamente.");
                        return;
                      }
                      
                      if (token && currentUserInfo && currentUserInfo.supplierId) {
                        // Store the updated supplierId in localStorage for the new page to access
                        localStorage.setItem('tempSupplierId', currentUserInfo.supplierId.toString());
                        
                        // Navigate using a clearer URL format with explicit supplier ID
                        const url = `/supplier/budgets/new?requestId=${params.id}&supplierId=${currentUserInfo.supplierId}`;
                        console.log("Navigation URL:", url);
                        console.log("Budget request ID being passed:", params.id);
                        console.log("Supplier ID being passed:", currentUserInfo.supplierId);
                        router.push(url);
                      } else {
                        console.error("Missing required authentication data for budget creation", { 
                          token: !!token, 
                          userInfo: currentUserInfo,
                          supplierId: currentUserInfo?.supplierId 
                        });
                        setError("No se puede crear un presupuesto. Asegúrese de estar autenticado correctamente.");
                      }
                    } catch (error) {
                      console.error("Error creating budget:", error);
                      setError("Se produjo un error al intentar crear el presupuesto. Por favor, inténtelo de nuevo.");
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-2" />
                  Crear Presupuesto
                </button>
              )}
            </div>

            {budgetRequest.budgets.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                No hay presupuestos creados para esta solicitud
              </div>
            ) : (
              <div className="space-y-4">
                {budgetRequest.budgets.map((budget) => (
                  <div key={budget.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ${budget.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Creado el {new Date(budget.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        budget.status === "approved" ? "bg-green-100 text-green-800" :
                        budget.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {
                          budget.status === "approved" ? "Aprobado" :
                          budget.status === "rejected" ? "Rechazado" :
                          "Pendiente"
                        }
                      </span>
                    </div>

                    {budget.description && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 mb-1">Descripción</div>
                        <p className="text-sm text-gray-700">{budget.description}</p>
                      </div>
                    )}

                    {budget.items && budget.items.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-500 mb-2">Items</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {budget.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.total.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <Link
                        href={`/supplier/budgets/${budget.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Ver Detalles del Presupuesto
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 