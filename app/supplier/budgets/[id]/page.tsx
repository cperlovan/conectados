"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";

interface Budget {
  id: number;
  title: string;
  description: string;
  amount: number;
  details: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BudgetDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useToken();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBudget = async () => {
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:3040/api/budgets/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al cargar el presupuesto");
        const data = await response.json();
        setBudget(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar el presupuesto");
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [token, params.id]);

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

  if (error || !budget) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Presupuesto no encontrado"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Detalles del Presupuesto</h1>
            <div className="space-x-4">
              <Link
                href={`/supplier/budgets/${budget.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Editar
              </Link>
              <Link
                href="/supplier/budgets"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">{budget.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(budget.status)}`}>
                  {budget.status}
                </span>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1 text-gray-900">{budget.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                  <p className="mt-1 text-gray-900">${budget.amount.toFixed(2)}</p>
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