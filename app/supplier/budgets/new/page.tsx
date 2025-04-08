"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { Loader2 } from 'lucide-react'

interface BudgetRequest {
  id: number;
  title: string;
  description: string;
  details?: string;
  dueDate: string;
}

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewBudget() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, userInfo, isLoading } = useToken();
  const [budgetRequest, setBudgetRequest] = useState<BudgetRequest | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  // Set request ID on component mount
  useEffect(() => {
    const id = searchParams.get("requestId");
    console.log("Request ID from URL:", id);
    if (id) {
      setRequestId(id);
    } else {
      console.log("No requestId found in URL parameters");
      setLoading(false);
    }
    
    // Check for supplierId in URL or localStorage
    const supplierIdFromUrl = searchParams.get("supplierId");
    const supplierIdFromStorage = localStorage.getItem('tempSupplierId');
    
    console.log("SupplierId from URL:", supplierIdFromUrl);
    console.log("SupplierId from localStorage:", supplierIdFromStorage);
    
    // If we have supplierId in URL or localStorage, ensure userInfo has it
    if ((supplierIdFromUrl || supplierIdFromStorage) && userInfo && !userInfo.supplierId) {
      const supplierId = supplierIdFromUrl || supplierIdFromStorage;
      console.log("Setting supplierId from external source:", supplierId);
      if (supplierId) {
        // Convert the string to a number
        userInfo.supplierId = parseInt(supplierId, 10);
        console.log("Converted supplierId to number:", userInfo.supplierId);
      }
    }
  }, [searchParams, userInfo]);

  // Set default due date to 14 days from now
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  // Handle authentication and data fetching
  useEffect(() => {
    // Don't do anything while token is loading
    if (isLoading) {
      console.log("Token is still loading...");
      return;
    }
    
    // Check authentication after token is loaded
    if (!token || !userInfo) {
      console.log("Authentication missing, redirecting to login", { token: !!token, userInfo: !!userInfo });
      router.push("/login");
      return;
    }

    if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier') {
      console.log("User is not a supplier, redirecting to home", { role: userInfo.role });
      router.push("/");
      return;
    }

    // Only fetch budget request if we have a requestId
    if (requestId) {
      console.log("Fetching budget request data", { 
        requestId, 
        hasToken: !!token,
        userRole: userInfo?.role,
        supplierId: userInfo?.supplierId
      });
      
      fetchBudgetRequest(requestId);
    } else {
      console.log("No request ID provided - creating standalone budget");
      setLoading(false);
    }
  }, [token, userInfo, isLoading, requestId, router]);

  // Update the data handling when a budget request is loaded to set initial values
  useEffect(() => {
    if (budgetRequest) {
      // Initialize the title based on the budget request
      setTitle(`Presupuesto para: ${budgetRequest.title}`);
      
      // If the budget request has a dueDate, we can use that or keep our default
      if (budgetRequest.dueDate) {
        const requestDueDate = new Date(budgetRequest.dueDate);
        setDueDate(requestDueDate.toISOString().split('T')[0]);
      }
    }
  }, [budgetRequest]);

  const fetchBudgetRequest = async (requestId: string) => {
    try {
      setLoading(true);
      setError("");
      console.log("===== DEBUG: BUDGET REQUEST FETCH START =====");
      console.log("Fetching budget request with ID:", requestId);
      console.log("Request ID type:", typeof requestId);
      console.log("User info available:", !!userInfo);
      if (userInfo) {
        console.log("User ID:", userInfo.id);
        console.log("User role:", userInfo.role);
        console.log("Supplier ID:", userInfo.supplierId);
      }
      console.log("Token available:", !!token);
      console.log("Token length:", token ? token.length : 0);

      // Check for supplier ID first
      if (!userInfo?.supplierId) {
        console.error("Missing supplierId, checking URL and localStorage");
        
        // Check URL parameters and localStorage for supplierId
        const supplierIdFromUrl = searchParams.get("supplierId");
        const supplierIdFromStorage = localStorage.getItem('tempSupplierId');
        
        if (supplierIdFromUrl || supplierIdFromStorage) {
          const supplierId = supplierIdFromUrl || supplierIdFromStorage;
          console.log("Found supplierId from external source:", supplierId);
          
          if (userInfo && supplierId) {
            // Convert the string to a number
            userInfo.supplierId = parseInt(supplierId, 10);
            console.log("Updated userInfo with supplierId from external source");
          }
        } else {
          console.error("No supplierId found in URL or localStorage, attempting to fetch it");
          try {
            // Try to fetch the supplier ID if not available
            const supplierResponse = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo?.id}`, {
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
              console.log('SupplierId obtained:', supplierData.id);
              // Update userInfo with the supplierId
              if (userInfo) {
                userInfo.supplierId = supplierData.id;
              }
            } else {
              throw new Error('No se encontró el ID del proveedor');
            }
          } catch (error) {
            console.error('Error obtaining supplierId:', error);
            throw new Error('No se pudo obtener el ID del proveedor. Por favor, contacte al administrador.');
          }
        }
      }

      // Make sure requestId is a valid integer
      const parsedRequestId = parseInt(requestId, 10);
      if (isNaN(parsedRequestId)) {
        console.error("RequestId is not a valid number:", requestId);
        throw new Error("ID de solicitud inválido");
      }
      
      console.log("Making API request to:", `http://localhost:3040/api/budget-requests/${parsedRequestId}`);
      console.log("Using headers:", {
        Authorization: `Bearer ${token?.substring(0, 15)}...`,
      });

      const response = await fetch(`http://localhost:3040/api/budget-requests/${parsedRequestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Budget request response status:", response.status);
      console.log("Budget request response ok:", response.ok);
      console.log("Budget request response status text:", response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error("Budget request not found (404)");
          throw new Error("No se encontró la solicitud de presupuesto");
        }
        
        console.log("Attempting to parse error response...");
        
        const errorData = await response.json().catch((err) => {
          console.error("Failed to parse error response:", err);
          return {};
        });
        
        console.error("Error fetching budget request:", errorData);
        throw new Error(errorData.message || "Error al obtener la solicitud de presupuesto");
      }

      console.log("Parsing successful response...");
      const data = await response.json();
      console.log("Budget request data received:", data);
      
      // Check if we have a valid budget request in the response
      if (!data) {
        console.error("No data received from API");
        throw new Error("No se encontró la solicitud de presupuesto");
      }
      
      // Handle different possible response structures
      if (data.budgetRequest) {
        console.log("Setting budget request from data.budgetRequest");
        setBudgetRequest(data.budgetRequest);
      } else if (data.id) {
        // The data itself is the budget request
        console.log("Setting budget request directly from data");
        setBudgetRequest(data);
      } else {
        console.error("Invalid budget request data structure:", data);
        throw new Error("Formato de respuesta inválido para la solicitud de presupuesto");
      }
      
      console.log("===== DEBUG: BUDGET REQUEST FETCH COMPLETE =====");
    } catch (err) {
      console.error("===== DEBUG: BUDGET REQUEST FETCH ERROR =====");
      console.error("Error fetching budget request:", err);
      setError(err instanceof Error ? err.message : "Error al obtener la solicitud de presupuesto");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    console.log("===== DEBUG: BUDGET SUBMISSION START =====");
    
    try {
      // Validate form first
      if (items.length === 0) {
        console.error("No items in budget");
        throw new Error("Debe agregar al menos un ítem al presupuesto");
      }

      // Check if any item has missing data
      const invalidItems = items.filter(
        (item) => !item.description || item.quantity <= 0 || item.unitPrice <= 0
      );
      
      if (invalidItems.length > 0) {
        console.error("Invalid items found:", invalidItems);
        throw new Error("Todos los ítems deben tener descripción, cantidad y precio válidos");
      }
      
      console.log("User info available:", !!userInfo);
      if (userInfo) {
        console.log("User role:", userInfo.role);
        console.log("Current supplier ID:", userInfo.supplierId);
      }
      
      // Check for supplier ID from multiple sources
      if (!userInfo?.supplierId) {
        console.error("Missing supplierId in handleSubmit, checking URL and localStorage");
        
        // Check URL parameters and localStorage for supplierId
        const supplierIdFromUrl = searchParams.get("supplierId");
        const supplierIdFromStorage = localStorage.getItem('tempSupplierId');
        
        console.log("SupplierId from URL:", supplierIdFromUrl);
        console.log("SupplierId from localStorage:", supplierIdFromStorage);
        
        if (supplierIdFromUrl || supplierIdFromStorage) {
          const supplierId = supplierIdFromUrl || supplierIdFromStorage;
          console.log("Found supplierId from external source:", supplierId);
          
          if (userInfo && supplierId) {
            userInfo.supplierId = parseInt(supplierId, 10);
            console.log("Updated userInfo with supplierId from external source in handleSubmit");
          }
        } else {
          console.error("No supplierId found in URL or localStorage, attempting to fetch it");
          try {
            // Try to fetch the supplier ID if not available
            const supplierResponse = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo?.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!supplierResponse.ok) {
              throw new Error('Error al obtener información del proveedor');
            }
            
            const supplierData = await supplierResponse.json();
            console.log('Supplier data received in handleSubmit:', supplierData);
            
            if (supplierData && supplierData.id) {
              console.log('SupplierId obtained in handleSubmit:', supplierData.id);
              // Update userInfo with the supplierId
              if (userInfo) {
                userInfo.supplierId = supplierData.id;
              } else {
                throw new Error('No hay información de usuario disponible');
              }
            } else {
              throw new Error('No se encontró el ID del proveedor');
            }
          } catch (error) {
            console.error('Error obtaining supplierId in handleSubmit:', error);
            throw new Error('No se pudo obtener el ID del proveedor. Por favor, contacte al administrador.');
          }
        }
      }
      
      // Calculate total amount from items
      const totalAmount = calculateTotal();
      
      const budgetData: any = {
        title,
        description,
        dueDate,
        amount: totalAmount,
        supplierId: userInfo?.supplierId,
        items: items.map(({ id, ...item }) => item),
      };
      
      // Add budgetRequestId only if we have one
      if (requestId) {
        console.log(`Creating budget for request ID: ${requestId}`);
        const parsedRequestId = parseInt(requestId, 10);
        if (isNaN(parsedRequestId)) {
          console.error("Invalid request ID:", requestId);
          throw new Error("ID de solicitud inválido");
        }
        budgetData.budgetRequestId = parsedRequestId;
      } else if (budgetRequest?.id) {
        console.log(`Creating budget for request: ${budgetRequest.id}`);
        budgetData.budgetRequestId = budgetRequest.id;
      } else {
        console.log("Creating standalone budget");
      }

      console.log("Sending budget data:", budgetData);
      console.log("Using token for request, available:", !!token);
      
      // Clean up temporary storage
      localStorage.removeItem('tempSupplierId');

      const response = await fetch("http://localhost:3040/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(budgetData),
      });

      console.log("Budget creation response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating budget:", errorData);
        throw new Error(errorData.message || "Error al crear el presupuesto");
      }

      const data = await response.json();
      console.log("Budget created successfully:", data);
      alert("Presupuesto creado exitosamente");
      
      // Handle different response structures
      if (data.budget && data.budget.id) {
        // If the response contains a budget object with an id
        router.push(`/supplier/budgets/${data.budget.id}`);
      } else if (data.id) {
        // If the response is the budget object itself
        router.push(`/supplier/budgets/${data.id}`);
      } else {
        // Fallback to budgets list if we can't determine the ID
        console.warn("Could not determine new budget ID from response:", data);
        router.push("/supplier/budgets");
      }
    } catch (err) {
      console.error("Error creating budget:", err);
      setError(err instanceof Error ? err.message : "Error al crear el presupuesto");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando solicitud de presupuesto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && requestId) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Error</h1>
            </div>
            
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Clear the error and continue without budget request
                  setError("");
                  setRequestId(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crear presupuesto sin solicitud
              </button>
            </div>
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
          {/* Encabezado */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Nuevo Presupuesto</h1>
              {budgetRequest && (
                <div className="text-gray-500 text-sm">
                  Para la solicitud: {budgetRequest.title}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Título del Presupuesto */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título del Presupuesto
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título del presupuesto"
                required
              />
            </div>
            
            {/* Fecha de Vencimiento */}
            <div className="mb-6">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Descripción del Presupuesto */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del Presupuesto
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe los detalles de tu presupuesto..."
                required
              />
            </div>

            {/* Items del Presupuesto */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Items del Presupuesto</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-1" />
                  Agregar Item
                </button>
              </div>

              {items.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No hay items agregados al presupuesto
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Unitario
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          Total: ${item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total y Botones */}
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium">
                Total: ${calculateTotal().toFixed(2)}
              </div>
              <div className="space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creando..." : "Crear Presupuesto"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 