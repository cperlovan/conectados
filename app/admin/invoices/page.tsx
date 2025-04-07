"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiEye, FiEdit, FiPrinter, FiTrash2 } from "react-icons/fi";

interface Invoice {
  id: number;
  number: string;
  amount: string | number;
  status: string;
  paymentDate: string | null;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  budgetId: number;
  supplierId: number;
  condominiumId: number;
  createdAt: string;
  updatedAt: string;
  Budget?: {
    id: number;
    title: string;
    description: string;
    amount: string | number;
    status: string;
  };
  Supplier?: {
    id: number;
    name: string;
    type: string;
  };
}

export default function AdminInvoicesList() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token || !userInfo || isLoading) {
        console.log('Esperando token y datos de usuario...')
        return
      }

      try {
        setLoading(true)
        setError("")

        if (!['admin', 'superadmin'].includes(userInfo.role)) {
          router.push('/unauthorized');
          return;
        }

        if (!userInfo.condominiumId) {
          throw new Error('No se encontró el ID del condominio')
        }

        const endpoint = `http://localhost:3040/api/invoices/condominium/${userInfo.condominiumId}`
        console.log('Usando endpoint:', endpoint)

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar las facturas')
        }

        const data = await response.json()
        setInvoices(Array.isArray(data) ? data : [])
      } catch (error: any) {
        console.error('Error:', error)
        setError(error.message || 'Error al cargar las facturas')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [token, userInfo, isLoading, router])

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/invoices/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!response.ok) {
        throw new Error('Error al aprobar la factura');
      }

      // Actualizar el estado local
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: 'approved' } : invoice
      ));
      alert('Factura aprobada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar la factura');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/invoices/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!response.ok) {
        throw new Error('Error al rechazar la factura');
      }

      // Actualizar el estado local
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: 'rejected' } : invoice
      ));
      alert('Factura rechazada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al rechazar la factura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando facturas...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Facturas</h1>
          <div className="space-x-4">
            {/* El administrador no puede crear facturas */}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                  Proveedor
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
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.Budget?.title || `Presupuesto #${invoice.budgetId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.Supplier?.name || 'N/A'}
                      {invoice.Supplier?.type && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({invoice.Supplier.type})
                        </span>
                      )}
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
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        title="Ver detalles"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => window.open(`/admin/invoices/${invoice.id}/print`, '_blank')}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title="Imprimir"
                      >
                        <FiPrinter className="h-4 w-4" />
                      </button>
                      {invoice.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(invoice.id)}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            title="Aprobar"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(invoice.id)}
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            title="Rechazar"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 