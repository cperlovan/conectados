"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../../hook/useToken";
import Header from "../../../../components/Header";

interface Invoice {
  id: number;
  budgetId: number;
  number: string;
  amount: number;
  status: string;
}

interface Budget {
  id: number;
  title: string;
  amount: number;
  status: string;
}

export default function EditInvoice({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useToken();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [formData, setFormData] = useState<Invoice>({
    id: 0,
    budgetId: 0,
    number: "",
    amount: 0,
    status: "pending",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // Cargar la factura
        const invoiceResponse = await fetch(`http://localhost:3040/api/invoices/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!invoiceResponse.ok) throw new Error("Error al cargar la factura");
        const invoiceData = await invoiceResponse.json();
        setFormData(invoiceData);

        // Cargar presupuestos
        const budgetsResponse = await fetch("http://localhost:3040/api/budgets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!budgetsResponse.ok) throw new Error("Error al cargar presupuestos");
        const budgetsData = await budgetsResponse.json();
        setBudgets(budgetsData.filter((b: Budget) => b.status === "approved"));
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si se selecciona un presupuesto, establecer el monto automáticamente
    if (name === "budgetId") {
      const selectedBudget = budgets.find((b) => b.id === parseInt(value));
      if (selectedBudget) {
        setFormData((prev) => ({
          ...prev,
          amount: selectedBudget.amount,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`http://localhost:3040/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al actualizar la factura");
      }

      router.push(`/supplier/invoices/${params.id}`);
    } catch (error: any) {
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Editar Factura</h1>

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
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.title} - ${budget.amount.toFixed(2)}
                  </option>
                ))}
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

            <div className="mb-4">
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

            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push(`/supplier/invoices/${params.id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 