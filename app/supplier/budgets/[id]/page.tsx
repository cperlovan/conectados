"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import Header from "../../../components/Header";
import Link from "next/link";
import { Budget } from "@/types/budget";

export default function BudgetDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchBudget();
    getUserRole();
  }, [params.id]);

  const getUserRole = async () => {
    try {
      const user = await getUser();
      if (user) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error("Error al obtener el rol del usuario:", error);
    }
  };

  const fetchBudget = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("No se pudo cargar el token de autenticación");
        return;
      }

      const response = await fetch(`http://localhost:3040/api/budgets/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar el presupuesto");
      }

      const data = await response.json();
      setBudget(data);
      setLoading(false);
    } catch (error) {
      setError("Error al cargar el presupuesto");
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "approved" | "rejected") => {
    try {
      const token = await getToken();
      if (!token) {
        setError("No se pudo cargar el token de autenticación");
        return;
      }

      // Mostrar un mensaje de carga
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3040/api/budgets/${params.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response from server:', data);
        throw new Error(data.message || "Error al actualizar el estado del presupuesto");
      }

      // Actualizar el presupuesto localmente
      setBudget(data.budget);
      setLoading(false);
    } catch (error) {
      console.error('Error al actualizar el estado del presupuesto:', error);
      setError(error instanceof Error ? error.message : "Error al actualizar el estado del presupuesto");
      setLoading(false);
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

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Presupuesto no encontrado
          </div>
        </div>
      </div>
    );
  }

  // Determinar si el usuario es un proveedor
  const isSupplier = userRole === 'proveedor' || userRole === 'supplier';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Detalles del Presupuesto</h1>
            <div className="space-x-4">
              {isSupplier && (
                <Link
                  href={`/supplier/budgets/${params.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Editar
                </Link>
              )}
              <Link
                href="/supplier/budgets"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">{budget.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(budget.status)}`}>
                  {budget.status}
                </span>
              </div>
            </div>

            {budget.status === 'pending' && (userRole === 'admin' || userRole === 'superadmin') && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1 text-gray-900">{budget.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                  <p className="mt-1 text-gray-900">
                    ${typeof budget.amount === 'number' 
                      ? budget.amount.toFixed(2) 
                      : Number(budget.amount).toFixed(2)}
                  </p>
                </div>

                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Empresa</p>
                      <p className="mt-1">{budget.supplier?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contacto</p>
                      <p className="mt-1">{budget.supplier?.User?.ContactInfo ? 
                        `${budget.supplier.User.ContactInfo.name} ${budget.supplier.User.ContactInfo.lastname}`.trim() || 'N/A' 
                        : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{budget.supplier?.User?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Detalles Adicionales</h3>
                  <p className="mt-1 text-gray-900">{budget.details || "No hay detalles adicionales"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(budget.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(budget.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
} 