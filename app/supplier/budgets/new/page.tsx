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

export default function NewBudget() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    status: "pending"
  });

  useEffect(() => {
    const fetchActivities = async () => {
      if (!token) {
        console.log("No hay token disponible");
        return;
      }
      
      try {
        console.log("Intentando cargar actividades económicas...");
        console.log("Token:", token.substring(0, 20) + "...");
        
        const response = await fetch("http://localhost:3040/api/economic-activities", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: "include"
        });

        console.log("Estado de la respuesta:", response.status);
        console.log("Headers de la respuesta:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Error al cargar las actividades económicas: ${response.status}`);
        }

        const data = await response.json();
        console.log("Datos recibidos:", data);
        setActivities(data);
      } catch (error) {
        console.error("Error completo al cargar actividades:", error);
        setError(error instanceof Error ? error.message : "Error al cargar las actividades económicas");
      }
    };

    fetchActivities();
  }, [token]);

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatDateForServer = (dateString: string) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split("/");
    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

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
    setLoading(true);
    setError("");

    try {
      if (!token || !userInfo?.condominiumId || !userInfo?.id) {
        throw new Error("No hay token o información del usuario disponible");
      }

      // Validar campos requeridos
      if (!formData.title.trim()) {
        throw new Error("El título es obligatorio");
      }
      if (!formData.description.trim()) {
        throw new Error("La descripción es obligatoria");
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("El monto debe ser mayor a 0");
      }
      if (!formData.dueDate) {
        throw new Error("La fecha de vencimiento es obligatoria");
      }

      // Validar formato de fecha
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!dateRegex.test(formData.dueDate)) {
        throw new Error("La fecha debe tener el formato dd/mm/yyyy");
      }

      // Validar que se seleccione al menos una actividad económica
      if (selectedActivities.length === 0) {
        throw new Error("Debe seleccionar al menos una actividad económica");
      }

      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        dueDate: formatDateForServer(formData.dueDate),
        economicActivities: selectedActivities,
        condominiumId: userInfo.condominiumId,
        supplierId: userInfo.id
      };

      console.log("Datos a enviar:", data);

      const response = await fetch("http://localhost:3040/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error al crear el presupuesto: ${response.status}`);
      }

      const result = await response.json();
      console.log("Presupuesto creado:", result);

      router.push("/supplier/budgets");
    } catch (err) {
      console.error("Error al crear presupuesto:", err);
      setError(err instanceof Error ? err.message : "Error al crear el presupuesto");
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

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
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