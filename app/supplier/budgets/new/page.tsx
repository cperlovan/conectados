"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
}

// Utility functions for date formatting
const formatDateForDisplay = (date: string): string => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

const formatDateForServer = (date: string): string => {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
};

export default function NewBudget() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierCondominiumId, setSupplierCondominiumId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
  });

  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!token || !userInfo?.id) return;
      
      try {
        console.log('Obteniendo datos del proveedor para usuario:', userInfo.id);
        const response = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al obtener datos del proveedor");
        }

        const data = await response.json();
        console.log('Datos del proveedor obtenidos:', data);
        
        if (!data?.id) {
          throw new Error("No se encontró el ID del proveedor");
        }

        setSupplierId(data.id);
        
        // Guardar el condominiumId del proveedor
        if (data.condominiumId) {
          console.log('CondominiumId del proveedor:', data.condominiumId);
          setSupplierCondominiumId(data.condominiumId);
        } else {
          console.error('No se encontró el condominiumId del proveedor');
          setError("No se pudo obtener el condominio del proveedor");
        }
      } catch (err) {
        console.error("Error fetching supplier data:", err);
        setError(err instanceof Error ? err.message : "Error al obtener datos del proveedor");
      }
    };

    fetchSupplierData();
  }, [token, userInfo]);

  useEffect(() => {
    const fetchEconomicActivities = async () => {
      if (!token) return;

      try {
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
        setLoading(false);
      }
    };

    fetchEconomicActivities();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "dueDate") {
      // Si el valor está vacío, limpiar el campo
      if (!value) {
        setFormData(prev => ({
          ...prev,
          [name]: ""
        }));
        return;
      }

      // Convertir el formato yyyy-mm-dd a dd/mm/yyyy
      const formattedDate = formatDateForDisplay(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
    
    // Validar que tengamos toda la información necesaria
    if (!token) {
      setError("No se pudo obtener el token de autenticación");
      return;
    }
    
    if (!userInfo) {
      setError("No se pudo obtener la información del usuario");
      return;
    }
    
    if (!supplierCondominiumId) {
      setError("No se pudo obtener el condominio del proveedor");
      return;
    }
    
    if (!supplierId) {
      setError("No se pudo obtener el ID del proveedor");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('Enviando datos para crear presupuesto:', {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        dueDate: formatDateForServer(formData.dueDate),
        supplierId,
        condominiumId: supplierCondominiumId,
        economicActivities: selectedActivities
      });
      
      const response = await fetch("http://localhost:3040/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString()),
          dueDate: formatDateForServer(formData.dueDate),
          supplierId,
          condominiumId: supplierCondominiumId,
          economicActivities: selectedActivities
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al crear presupuesto:', errorData);
        throw new Error(errorData.message || "Error al crear el presupuesto");
      }
      
      const data = await response.json();
      console.log('Presupuesto creado exitosamente:', data);
      
      router.push("/supplier/budgets");
    } catch (error) {
      console.error("Error al crear el presupuesto:", error);
      setError(error instanceof Error ? error.message : "Error al crear el presupuesto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Crear Nuevo Presupuesto</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
              placeholder="Ingrese el título del presupuesto"
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
              placeholder="Ingrese la descripción del presupuesto"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
              Monto
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="Ingrese el monto"
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
              value={formData.dueDate ? new Date(formData.dueDate.split("/").reverse().join("-")).toISOString().split("T")[0] : ""}
              onChange={handleChange}
              required
              data-date-format="dd/mm/yyyy"
            />
            <p className="text-sm text-gray-500 mt-1">Seleccione la fecha de vencimiento</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Actividades Económicas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activities.map(activity => (
                <label key={activity.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => handleActivityChange(activity.id)}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{activity.name}</span>
                </label>
              ))}
            </div>
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
              {loading ? "Creando..." : "Crear Presupuesto"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/supplier/budgets")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 