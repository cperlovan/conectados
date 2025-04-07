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
  notes?: string;
  supplier?: {
    id: number;
    name: string;
    email: string;
  };
  budget?: {
    id: number;
    title: string;
    amount: number;
    status: string;
  };
}

interface Budget {
  id: number;
  title: string;
  amount: number | string;
  status: string;
  supplier?: {
    id: number;
    name: string;
  };
}

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  supplierId?: number;
}

export default function EditInvoice({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, userInfo } = useToken() as { token: string | null, userInfo: TokenPayload | null };
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [formData, setFormData] = useState<Invoice>({
    id: Number(params.id),
    budgetId: 0,
    number: "",
    amount: 0,
    status: "pending",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !userInfo || initialized) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        console.log('Verificando permisos:', {
          role: userInfo.role,
          supplierId: userInfo.supplierId,
          userId: userInfo.id
        });

        // Verificar que el usuario sea proveedor o supplier
        if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier') {
          console.log('Error de permisos: Usuario no es proveedor o supplier', { role: userInfo.role });
          router.push('/unauthorized');
          return;
        }

        // Obtener la factura
        const invoiceResponse = await fetch(`http://localhost:3040/api/invoices/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Respuesta de factura:', {
          status: invoiceResponse.status,
          ok: invoiceResponse.ok
        });

        if (!invoiceResponse.ok) {
          const errorData = await invoiceResponse.json();
          console.error('Error al obtener la factura:', errorData);
          throw new Error(errorData.message || 'Error al obtener la factura');
        }

        const invoiceData = await invoiceResponse.json();
        console.log('Datos de la factura:', {
          id: invoiceData.id,
          supplierId: invoiceData.supplierId,
          userSupplierId: userInfo.supplierId
        });

        // Verificar que la factura pertenezca al proveedor
        if (invoiceData.supplierId !== userInfo.supplierId) {
          router.push('/unauthorized');
          return;
        }

        setFormData({
          id: invoiceData.id,
          budgetId: invoiceData.budgetId || 0,
          number: invoiceData.number || '',
          amount: invoiceData.amount || 0,
          status: invoiceData.status || 'pending',
          budget: invoiceData.budget,
          supplier: invoiceData.supplier
        });

        // Obtener presupuestos aprobados
        const budgetsResponse = await fetch(`http://localhost:3040/api/budgets/supplier/${userInfo.supplierId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Respuesta de presupuestos:', {
          status: budgetsResponse.status,
          ok: budgetsResponse.ok
        });

        if (!budgetsResponse.ok) {
          const errorData = await budgetsResponse.json();
          console.error('Error al obtener los presupuestos:', errorData);
          throw new Error(errorData.message || 'Error al obtener los presupuestos');
        }

        const budgetsData = await budgetsResponse.json();
        const approvedBudgets = budgetsData.budgets?.filter((budget: Budget) => budget.status === 'approved') || [];
        console.log('Presupuestos aprobados:', approvedBudgets.length);
        setBudgets(approvedBudgets);
        setInitialized(true);
      } catch (error: any) {
        console.error('Error en fetchData:', error);
        setError(error.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, userInfo, params.id, router, initialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "budgetId") {
      const selectedBudget = budgets.find(b => b.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        budgetId: parseInt(value) || 0,
        amount: selectedBudget ? parseFloat(String(selectedBudget.amount)) || 0 : prev.amount
      }));
    } else if (name === "amount") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userInfo || (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier')) {
      setError('No tienes permiso para realizar esta acción');
      return;
    }

    try {
      setSaving(true);
      setError('');

      console.log('Enviando actualización de factura:', {
        invoiceId: params.id,
        userRole: userInfo.role,
        supplierId: userInfo.supplierId,
        formData
      });

      const response = await fetch(`http://localhost:3040/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Respuesta de actualización:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al actualizar la factura:', errorData);
        throw new Error(errorData.message || 'Error al actualizar la factura');
      }

      const data = await response.json();
      console.log('Factura actualizada exitosamente:', data);
      router.push('/supplier/invoices');
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      setError(error.message || 'Error al actualizar la factura');
    } finally {
      setSaving(false);
    }
  };

  if (!token || !userInfo) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando sesión...</p>
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos de la factura...</p>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/supplier/invoices')}
              className="text-blue-600 hover:text-blue-800"
            >
              Volver a la lista de facturas
            </button>
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
            {formData.budget && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Presupuesto Actual</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Título</p>
                    <p className="font-medium">{formData.budget.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monto</p>
                    <p className="font-medium">${typeof formData.budget.amount === 'string' 
                      ? parseFloat(formData.budget.amount).toFixed(2) 
                      : formData.budget.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

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
                    {budget.title} - ${typeof budget.amount === 'string' 
                      ? parseFloat(budget.amount).toFixed(2) 
                      : budget.amount.toFixed(2)}
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

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/supplier/invoices')}
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