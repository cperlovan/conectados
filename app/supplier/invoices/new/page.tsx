"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface Budget {
  id: number;
  title: string;
  description: string;
  amount: number | string;
  dueDate: string;
  status: string;
  supplierId: number;
  economicActivities?: Array<{
    id: number;
    name: string;
  }>;
  supplier?: {
    id: number;
    name: string;
    type: string;
    userId: number;
    condominiumId: number;
    User?: {
      id: number;
      name: string;
      email: string;
      ContactInfo?: {
        name: string;
        lastname: string;
      };
    };
  };
}

export default function NewInvoice() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [formData, setFormData] = useState({
    budgetId: "",
    number: "",
    amount: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!token || !userInfo) return;

      try {
        // 1. Obtener el proveedor por ID de usuario
        const supplierResponse = await fetch(
          `http://localhost:3040/api/suppliers/user/${userInfo.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!supplierResponse.ok) {
          throw new Error("Error al obtener el perfil de proveedor");
        }

        const supplierData = await supplierResponse.json();
        
        if (!supplierData || !supplierData.id) {
          throw new Error("No se encontró el ID del proveedor");
        }
        
        // 2. Obtener presupuestos usando el ID del proveedor
        const budgetsResponse = await fetch(
          `http://localhost:3040/api/budgets/supplier/${supplierData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!budgetsResponse.ok) {
          throw new Error("Error al cargar presupuestos");
        }
        
        const data = await budgetsResponse.json();
        
        // Filtrar solo presupuestos aprobados (comparación case-insensitive)
        let approvedBudgets = Array.isArray(data?.budgets) 
          ? data.budgets.filter((b: Budget) => {
              const budgetStatus = (b.status || '').toLowerCase();
              return budgetStatus === "approved" || budgetStatus === "aprobado";
            }) 
          : [];
        
        setBudgets(approvedBudgets);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Error al cargar los presupuestos");
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [token, userInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si se selecciona un presupuesto, establecer el monto automáticamente
    if (name === "budgetId" && value) {
      const budgetId = parseInt(value, 10);
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      if (selectedBudget) {
        setFormData((prev) => ({
          ...prev,
          amount: typeof selectedBudget.amount === 'number' 
            ? selectedBudget.amount.toString() 
            : selectedBudget.amount,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Verificar que el usuario sea proveedor
      if (!userInfo?.role || userInfo.role.toLowerCase() !== 'proveedor') {
        throw new Error('No tienes permisos para crear facturas. Solo los proveedores pueden crear facturas.');
      }

      // Primero obtener el ID del proveedor
      const supplierResponse = await fetch(
        `http://localhost:3040/api/suppliers/user/${userInfo?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-User-Role": "proveedor"
          },
        }
      );

      if (!supplierResponse.ok) {
        throw new Error("Error al obtener la información del proveedor");
      }

      const supplierData = await supplierResponse.json();
      console.log("Datos del proveedor para la factura:", supplierData);

      if (!supplierData || !supplierData.id) {
        throw new Error("No se encontró la información del proveedor");
      }

      // Preparar los datos de la factura
      const response = await fetch("http://localhost:3040/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": "proveedor"
        },
        body: JSON.stringify({
          budgetId: Number(formData.budgetId),
          number: formData.number,
          amount: Number(formData.amount),
          supplierId: Number(supplierData.id)
        }),
      });

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error detallado:", errorData);
        throw new Error(errorData.message || "Error al crear la factura");
      }

      const responseData = await response.json();
      console.log("Respuesta exitosa:", responseData);

      router.push("/supplier/invoices");
    } catch (error: any) {
      console.error("Error completo:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Nueva Factura</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label htmlFor="budgetId" className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto
              </label>
              <select
                id="budgetId"
                name="budgetId"
                value={formData.budgetId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Seleccione un presupuesto</option>
                {budgets.map((budget) => {
                  const amount = typeof budget.amount === 'number' 
                    ? budget.amount.toFixed(2) 
                    : parseFloat(budget.amount as string).toFixed(2);
                  
                  // Mostrar el estado como parte de la opción y deshabilitar los no aprobados
                  const isApproved = budget.status === "approved";
                  return (
                    <option 
                      key={budget.id} 
                      value={budget.id}
                      disabled={!isApproved}
                      style={{ color: isApproved ? 'black' : 'gray' }}
                    >
                      {budget.title} - ${amount} 
                      {budget.status ? ` (${budget.status})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Factura
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/supplier/invoices")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear Factura"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 