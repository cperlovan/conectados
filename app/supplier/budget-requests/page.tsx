"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiFilter, FiEye, FiPlus } from "react-icons/fi";

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
  }[];
}

interface BudgetRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export default function BudgetRequestsList() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [stats, setStats] = useState<BudgetRequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [etag, setEtag] = useState<string | null>(null);

  useEffect(() => {
    // Esperar a que se complete la carga del token
    if (isLoading) return;
    
    // Verificar si hay token y userInfo
    if (!token || !userInfo) {
      console.log("No hay token o userInfo, redirigiendo a login");
      router.push("/login");
      return;
    }
    
    // Verificar si el usuario es un proveedor
    if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier') {
      console.log("El usuario no es un proveedor, redirigiendo a home");
      router.push("/home");
      return;
    }

    fetchBudgetRequests();

    // Usar la API de Visibility para verificar si la página está visible
    let intervalId: NodeJS.Timeout | null = null;
    
    // Función para manejar cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // La página está visible, actualizar los datos
        console.log("Página visible, actualizando datos...");
        fetchBudgetRequests(true);
        
        // Iniciar el intervalo solo cuando la página está visible
        if (!intervalId) {
          intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
              console.log("Actualización programada cada 5 minutos...");
              fetchBudgetRequests(true);
            }
          }, 300000); // 5 minutos (300,000 ms)
        }
      } else {
        // La página no está visible, detener el intervalo
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };
    
    // Registrar el evento de cambio de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Manejar el caso inicial
    handleVisibilityChange();
    
    // Limpiar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [token, userInfo, router, isLoading]);

  const fetchBudgetRequests = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      // Verificar si tenemos el supplierId
      if (userInfo && !userInfo.supplierId) {
        console.log("No hay supplierId, intentando obtenerlo...");
        // Intentar obtener el supplierId si no está disponible
        const supplierResponse = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!supplierResponse.ok) {
          throw new Error("No se pudo obtener la información del proveedor");
        }
        
        const supplierData = await supplierResponse.json();
        console.log("Respuesta al obtener supplierId:", supplierData);
        
        if (!supplierData || !supplierData.id) {
          throw new Error("No se encontró información del proveedor");
        }
        
        // Actualizar el userInfo con el supplierId
        userInfo.supplierId = supplierData.id;
        console.log("SupplierId obtenido:", supplierData.id);
      }

      // Configurar los headers para la petición
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Añadir headers para caché condicional si ya tenemos datos previos
      if (lastUpdated) {
        headers['If-Modified-Since'] = lastUpdated.toUTCString();
      }
      
      if (etag) {
        headers['If-None-Match'] = etag;
      }

      const response = await fetch("http://localhost:3040/api/budget-requests/supplier", {
        headers,
        cache: 'no-store',  // Forzar revalidación
      });

      // Si obtenemos 304 Not Modified, no necesitamos actualizar nada
      if (response.status === 304) {
        console.log("Servidor indica que no hay cambios (304 Not Modified)");
        // Actualizar solo la fecha de verificación, pero no los datos
        setLastUpdated(new Date());
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener las solicitudes de presupuesto");
      }

      // Guardar los headers de caché condicional para futuras peticiones
      const responseEtag = response.headers.get('ETag');
      if (responseEtag) {
        setEtag(responseEtag);
      }
      
      const lastModified = response.headers.get('Last-Modified');
      if (lastModified) {
        const lastModifiedDate = new Date(lastModified);
        // Solo actualizar si es una fecha válida
        if (!isNaN(lastModifiedDate.getTime())) {
          setLastUpdated(lastModifiedDate);
        } else {
          setLastUpdated(new Date());
        }
      } else {
        setLastUpdated(new Date());
      }

      const data = await response.json();
      setBudgetRequests(data.budgetRequests || []);
      setStats(data.stats || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
      });
    } catch (err) {
      console.error("Error al obtener solicitudes de presupuesto:", err);
      setError(err instanceof Error ? err.message : "Error al obtener las solicitudes de presupuesto");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Formatear el tiempo de última actualización
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000); // Diferencia en segundos
    
    if (diff < 60) return `hace ${diff} segundos`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
    return `${lastUpdated.toLocaleDateString()} a las ${lastUpdated.toLocaleTimeString()}`;
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

  const filteredRequests = budgetRequests.filter(request => {
    if (filter === "all") return true;
    
    const status = getBudgetStatus(request.budgets);
    return status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando solicitudes de presupuesto...</p>
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
            <FiEye className="mr-2" />
            {error}
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Solicitudes de Presupuesto</h1>
              <div className="text-gray-500 text-sm">
                Total: <span className="font-medium">{budgetRequests.length}</span> solicitudes
                {lastUpdated && (
                  <span className="ml-3 text-gray-400">
                    Actualizado {formatLastUpdated()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => fetchBudgetRequests()}
              disabled={loading || refreshing}
              className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md flex items-center transition-colors"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </>
              )}
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Filtros</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todas ({stats.total})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "pending"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pendientes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter("in_progress")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "in_progress"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                En Progreso ({stats.inProgress})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Completadas ({stats.completed})
              </button>
            </div>
          </div>

          {/* Lista de solicitudes */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Vencimiento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuestos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No hay solicitudes de presupuesto disponibles
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const status = getBudgetStatus(request.budgets);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(request.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.budgets.length > 0 ? (
                            <div>
                              {request.budgets.map(budget => (
                                <div key={budget.id} className="mb-1">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    budget.status === "approved" ? "bg-green-100 text-green-800" :
                                    budget.status === "rejected" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    ${budget.amount.toFixed(2)} - {
                                      budget.status === "approved" ? "Aprobado" :
                                      budget.status === "rejected" ? "Rechazado" :
                                      "Pendiente"
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin presupuestos</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/supplier/budget-requests/${request.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Ver Detalles
                          </Link>
                          {status !== "completed" && status !== "cancelled" && (
                            <Link
                              href={`/supplier/budgets/new?requestId=${request.id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Crear Presupuesto
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 