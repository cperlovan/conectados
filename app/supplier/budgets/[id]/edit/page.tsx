"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { Budget } from "@/types/budget";
import Header from "../../../../components/Header";

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
}

export default function EditBudget({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    details: ''
  });
  const budgetId = params.id;

  useEffect(() => {
    if (budgetId) {
      fetchBudgetAndActivities();
    }
  }, [budgetId]);

  const fetchBudgetAndActivities = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("No se pudo cargar el token de autenticación");
        return;
      }

      // Fetch budget
      const budgetResponse = await fetch(`http://localhost:3040/api/budgets/${budgetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!budgetResponse.ok) {
        const errorData = await budgetResponse.json();
        throw new Error(errorData.message || "Error al cargar el presupuesto");
      }

      const budgetData = await budgetResponse.json();
      console.log("Datos del presupuesto recibidos:", budgetData);
      setBudget(budgetData);
      
      // Initialize form data with budget data
      setFormData({
        title: budgetData.title || '',
        description: budgetData.description || '',
        amount: budgetData.amount || 0,
        dueDate: budgetData.dueDate ? new Date(budgetData.dueDate).toISOString().split('T')[0] : '',
        details: budgetData.details || ''
      });
      
      // Extract economic activities IDs
      if (budgetData.economicActivities && Array.isArray(budgetData.economicActivities)) {
        setSelectedActivities(budgetData.economicActivities.map((a: EconomicActivity) => a.id));
      } else {
        setSelectedActivities([]);
      }

      // Fetch activities
      const activitiesResponse = await fetch("http://localhost:3040/api/economic-activities", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        throw new Error(errorData.message || "Error al cargar las actividades económicas");
      }

      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      setError(error instanceof Error ? error.message : "Error al cargar los datos");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!budget) return;

    try {
      const token = await getToken();
      if (!token) {
        setError("No se pudo cargar el token de autenticación");
        return;
      }

      const updatedBudget = {
        ...formData,
        economicActivities: selectedActivities,
      };

      console.log("Enviando datos actualizados:", updatedBudget);

      const response = await fetch(`http://localhost:3040/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBudget),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al actualizar el presupuesto:", errorData);
        throw new Error(errorData.message || "Error al actualizar el presupuesto");
      }

      const result = await response.json();
      console.log("Presupuesto actualizado exitosamente:", result);
      
      router.push("/supplier/budgets");
    } catch (error) {
      console.error("Error al actualizar el presupuesto:", error);
      setError(error instanceof Error ? error.message : "Error al actualizar el presupuesto");
    }
  };

  const handleActivityToggle = (activityId: number) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  if (loading) {
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
          <div className="mt-4">
            <button
              onClick={() => router.push("/supplier/budgets")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div>Presupuesto no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Editar Presupuesto</h1>
          <button
            onClick={() => router.push("/supplier/budgets")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Detalles Adicionales</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actividades Económicas
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded cursor-pointer ${
                      selectedActivities.includes(activity.id)
                        ? "bg-blue-100 border-blue-500"
                        : "bg-gray-50 border-gray-200"
                    } border`}
                    onClick={() => handleActivityToggle(activity.id)}
                  >
                    <h3 className="font-medium">{activity.name}</h3>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 