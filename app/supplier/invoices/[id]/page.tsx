"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";

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

export default function InvoiceDetails({ params }: { params: { id: string } }) {
  const { id } = React.use(params as any) as { id: string };
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    console.log('Estado inicial de autenticación:', {
      token: !!token,
      userInfo,
      isLoading
    });

    if (isLoading) {
      console.log('Cargando estado de autenticación...');
      return;
    }

    if (!token) {
      console.log('No se encontró token, redirigiendo a login...');
      router.push("/login");
      return;
    }

    if (!userInfo) {
      console.log('No se encontró información del usuario, redirigiendo a login...');
      router.push("/login");
      return;
    }

    console.log('Autenticación exitosa:', {
      role: userInfo.role,
      email: userInfo.email
    });
  }, [token, userInfo, isLoading, router]);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!token || !userInfo || isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`http://localhost:3040/api/invoices/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al obtener los detalles de la factura');
        }

        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al cargar los detalles de la factura');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, token, userInfo, isLoading]);

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
    // Por ahora, como no tenemos payments en la estructura, retornamos el monto total
    return Number(invoice.amount);
  };

  const formatAmount = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
  };

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!token || !invoice) return;
    
    try {
      setUpdating(true);
      setError("");
      
      console.log('Enviando actualización de estado:', {
        status: newStatus,
        invoiceId: Number(id)
      });
      
      const response = await fetch(`http://localhost:3040/api/invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          // Incluir otros campos requeridos de la factura
          number: invoice.number,
          amount: invoice.amount,
          budgetId: invoice.budgetId
        }),
      });

      console.log('Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${newStatus === 'approved' ? 'aprobar' : 'rechazar'} la factura`);
      }

      const data = await response.json();
      
      // Actualizar el estado local con los nuevos datos
      setInvoice(prev => ({
        ...prev!,
        status: newStatus
      }));
      
      alert(`Factura ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
    } catch (err) {
      console.error("Error completo al actualizar el estado:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el estado de la factura");
    } finally {
      setUpdating(false);
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
              {(userInfo?.role === 'proveedor' || userInfo?.role === 'supplier') && invoice?.status === 'pending' && (
                <Link
                  href={`/supplier/invoices/${invoice.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Editar
                </Link>
              )}
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

            {userInfo?.role === 'admin' && invoice.status === 'pending' && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Procesando...' : 'Rechazar'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Procesando...' : 'Aprobar'}
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Presupuesto</h3>
                  <p className="mt-1 text-gray-900">{invoice.Budget?.title || 'No disponible'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción del Presupuesto</h3>
                  <p className="mt-1 text-gray-900">{invoice.Budget?.description || 'No disponible'}</p>
                </div>

                {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
                  <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Información del Proveedor</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Empresa</h4>
                        <p className="text-sm text-gray-900">{invoice.Supplier?.name || 'N/A'}</p>
                      </div>
                      {invoice.Supplier?.type && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Tipo</h4>
                          <p className="text-sm text-gray-900">{invoice.Supplier.type}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto Total</h3>
                  <p className="mt-1 text-gray-900">{formatAmount(invoice.amount)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Vencimiento</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Emisión</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(invoice.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {invoice.notes && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Notas</h3>
                    <p className="mt-1 text-gray-900">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 