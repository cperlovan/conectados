"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";

interface Invoice {
  id: number;
  budgetId: number;
  number: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  budget: {
    title: string;
    description: string;
    amount: number;
  };
  payments: {
    id: number;
    amount: number;
    date: string;
    method: string;
  }[];
}

export default function InvoiceDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useToken();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:3040/api/invoices/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al cargar la factura");
        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar la factura");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [token, params.id]);

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

  const calculateRemainingAmount = () => {
    if (!invoice) return 0;
    const totalPaid = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
    return invoice.amount - totalPaid;
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

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Factura no encontrada"}
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
            <h1 className="text-3xl font-bold text-gray-900">Detalles de la Factura</h1>
            <div className="space-x-4">
              <Link
                href={`/supplier/invoices/${invoice.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Editar
              </Link>
              <Link
                href="/supplier/invoices"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Factura #{invoice.number}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Presupuesto</h3>
                  <p className="mt-1 text-gray-900">{invoice.budget.title}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción del Presupuesto</h3>
                  <p className="mt-1 text-gray-900">{invoice.budget.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto Total</h3>
                  <p className="mt-1 text-gray-900">${invoice.amount.toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto Pendiente</h3>
                  <p className="mt-1 text-gray-900">${calculateRemainingAmount().toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(invoice.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {invoice.payments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Pagos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Método
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 