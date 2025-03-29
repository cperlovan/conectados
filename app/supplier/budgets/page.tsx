"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import Cookies from 'js-cookie';

interface Budget {
  id: number;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  economicActivities: Array<{
    id: number;
    name: string;
  }>;
  supplier: {
    id: number;
    name: string;
    email: string;
  };
}

export default function BudgetsList() {
  const router = useRouter();
  const { token, userInfo, isLoading: isTokenLoading } = useToken();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 // app/supplier/budgets/page.tsx
useEffect(() => {
  const fetchBudgets = async () => {
    if (isTokenLoading) {
      console.log("Token aún cargando...");
      return;
    }

    if (!token || !userInfo) {
      console.log("No hay token o userInfo disponible");
      router.push("/login");
      return;
    }

    try {
      // Primero obtener el ID del proveedor asociado al usuario
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
      console.log("Datos del proveedor:", supplierData);

      // Luego obtener los presupuestos usando el ID del proveedor
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
        const errorData = await budgetsResponse.json();
        throw new Error(errorData.message || "Error al obtener los presupuestos");
      }

      const data = await budgetsResponse.json();
      console.log("Presupuestos recibidos:", data);
      setBudgets(data);
    } catch (err) {
      console.error("Error al obtener presupuestos:", err);
      setError(err instanceof Error ? err.message : "Error al obtener los presupuestos");
    } finally {
      setIsLoading(false);
    }
  };

  fetchBudgets();
}, [token, userInfo, isTokenLoading, router]);

  const getStatusColor = (status: string) => {
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
  };

  if (isTokenLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando presupuestos...</div>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <Link
            href="/supplier/budgets/new"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nuevo Presupuesto
          </Link>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No hay presupuestos creados</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{budget.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{budget.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${typeof budget.amount === 'number' ? budget.amount.toFixed(2) : Number(budget.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(budget.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/supplier/budgets/${budget.id}`}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/supplier/budgets/${budget.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 