"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import { FiPlus, FiX } from "react-icons/fi";

interface Supplier {
  id: number;
  name: string;
  type: string;
  User?: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    telephone?: string;
    movil?: string;
    address?: string;
  };
  EconomicActivities?: {
    id: number;
    name: string;
    description: string;
  }[];
}

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
}

export default function NewBudgetRequest() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    details: "",
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!token || !userInfo?.condominiumId) return;
      
      try {
        setLoadingData(true);
        console.log("Fetching suppliers for condominium:", userInfo.condominiumId);
        const response = await fetch(`http://localhost:3040/api/suppliers/condominium/${userInfo.condominiumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al obtener los proveedores");
        }

        const data = await response.json();
        console.log("Suppliers data received:", data);
        
        // Check if data is an array or has a suppliers property
        const suppliersData = Array.isArray(data) ? data : (data.suppliers || []);
        console.log("Processed suppliers data:", suppliersData);
        
        // Map the data to match the expected structure
        const mappedSuppliers = suppliersData.map((supplier: any) => {
          console.log("Processing supplier:", supplier);
          return {
            id: supplier.id,
            name: supplier.name,
            type: supplier.type,
            User: supplier.User,
            EconomicActivities: supplier.EconomicActivities || []
          };
        });
        
        console.log("Mapped suppliers:", mappedSuppliers);
        setSuppliers(mappedSuppliers);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError(err instanceof Error ? err.message : "Error al obtener los proveedores");
      } finally {
        setLoadingData(false);
      }
    };

    const fetchEconomicActivities = async () => {
      if (!token) return;

      try {
        setLoadingData(true);
        const response = await fetch("http://localhost:3040/api/economic-activities", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al cargar las actividades económicas");
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        setError("Error al cargar las actividades económicas");
      } finally {
        setLoadingData(false);
      }
    };

    fetchSuppliers();
    fetchEconomicActivities();
  }, [token, userInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSupplierChange = (supplierId: number) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      }
      return [...prev, supplierId];
    });
  };

  const handleActivityChange = (activityId: number) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      }
      return [...prev, activityId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !userInfo?.condominiumId) {
      setError("No se pudo obtener la información de autenticación");
      return;
    }

    if (selectedSuppliers.length === 0) {
      setError("Debe seleccionar al menos un proveedor");
      return;
    }

    if (selectedActivities.length === 0) {
      setError("Debe seleccionar al menos una actividad económica");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Submitting budget request with data:", {
        ...formData,
        condominiumId: userInfo.condominiumId,
        supplierIds: selectedSuppliers,
        economicActivityIds: selectedActivities
      });
      
      const response = await fetch("http://localhost:3040/api/budget-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          condominiumId: userInfo.condominiumId,
          supplierIds: selectedSuppliers,
          economicActivityIds: selectedActivities
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        throw new Error(errorData.message || "Error al crear la solicitud de presupuesto");
      }

      const result = await response.json();
      console.log("Budget request created successfully:", result);
      
      router.push("/admin/budget-requests");
    } catch (error) {
      console.error("Error al crear la solicitud de presupuesto:", error);
      setError(error instanceof Error ? error.message : "Error al crear la solicitud de presupuesto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Nueva Solicitud de Presupuesto</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-700">Cargando datos...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Título
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ingrese el título de la solicitud"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Descripción
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Ingrese la descripción de la solicitud"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
                Detalles Adicionales
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={4}
                placeholder="Ingrese detalles adicionales (opcional)"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Fecha de Vencimiento
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Proveedores
              </label>
              {suppliers.length === 0 ? (
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">No hay proveedores disponibles para este condominio.</p>
                  <p className="text-sm text-gray-400 mt-2">Por favor, registre proveedores antes de crear una solicitud.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suppliers.map(supplier => (
                    <div
                      key={supplier.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSuppliers.includes(supplier.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSupplierChange(supplier.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                          <p className="text-sm text-gray-500">{supplier.User?.email || "Sin email"}</p>
                          <p className="text-sm text-gray-500">
                            {supplier.User?.name || ""} {supplier.User?.lastname || ""}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSuppliers.includes(supplier.id)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSuppliers.includes(supplier.id) ? (
                            <FiX className="text-white text-xs" />
                          ) : (
                            <FiPlus className="text-gray-400 text-xs" />
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Actividades:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {supplier.EconomicActivities && supplier.EconomicActivities.length > 0 ? (
                            supplier.EconomicActivities.map(activity => (
                              <span
                                key={activity.id}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {activity.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Sin actividades registradas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedSuppliers.length === 0 && (
                <p className="text-red-500 text-sm mt-2">Debe seleccionar al menos un proveedor</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Actividades Económicas
              </label>
              {activities.length === 0 ? (
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">No hay actividades económicas disponibles.</p>
                  <p className="text-sm text-gray-400 mt-2">Por favor, contacte al administrador del sistema.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activities.map(activity => (
                    <label 
                      key={activity.id} 
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedActivities.includes(activity.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedActivities.includes(activity.id)}
                        onChange={() => handleActivityChange(activity.id)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="text-gray-700 font-medium">{activity.name}</span>
                        {activity.description && (
                          <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedActivities.length === 0 && (
                <p className="text-red-500 text-sm mt-2">Debe seleccionar al menos una actividad económica</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Solicitud"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/budget-requests")}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 