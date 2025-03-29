"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";

interface Invoice {
  id: number;
  budgetId: number;
  number: string;
  amount: number | string;
  status: string;
  createdAt: string;
  updatedAt: string;
  budget?: {
    title: string;
  };
}

export default function InvoicesList() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token || !userInfo) {
        setLoading(false);
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

        // Luego obtener las facturas del proveedor
        const invoicesResponse = await fetch(
          `http://localhost:3040/api/invoices/supplier/${supplierData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!invoicesResponse.ok) {
          throw new Error("Error al cargar facturas");
        }
        
        const data = await invoicesResponse.json();
        console.log("Facturas recibidas:", data);
        setInvoices(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar las facturas");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, userInfo]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para formatear el monto
  const formatAmount = (amount: number | string): string => {
    // Convertir a número si es un string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Verificar si es un número válido
    if (isNaN(numAmount)) {
      return '0.00';
    }
    
    return numAmount.toFixed(2);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
          <Link
            href="/supplier/invoices/new"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nueva Factura
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No hay facturas creadas</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {invoice.budget?.title || `Presupuesto #${invoice.budgetId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${formatAmount(invoice.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/supplier/invoices/${invoice.id}`}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/supplier/invoices/${invoice.id}/edit`}
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