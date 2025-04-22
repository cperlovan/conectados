"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import Image from 'next/image';
import { FiFileText, FiPlus } from 'react-icons/fi';
import { Button } from "../../components/ui/button";

interface Invoice {
  id: number;
  number: string;
  budgetId: number;
  supplierId: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  issueDate: string;
  dueDate: string;
  description: string;
  budget?: {
    id: number;
    description: string;
    amount: number;
  };
  supplier?: {
    id: number;
    name: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
}

export default function InvoicesList() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, paid: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta factura?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3040/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la factura');
      }

      setInvoices(invoices.filter(invoice => invoice.id !== id));
      alert('Factura eliminada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la factura');
    }
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token || !userInfo || isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        let endpoint = '';

        if (userInfo?.role === 'admin' || userInfo?.role === 'superadmin') {
          if (!userInfo.condominiumId) {
            throw new Error('No se encontró el ID del condominio');
          }
          endpoint = `http://localhost:3040/api/invoices/condominium/${userInfo.condominiumId}`;
        } else if (userInfo?.role === 'proveedor') {
          try {
            const supplierResponse = await fetch(
              `http://localhost:3040/api/suppliers/user/${userInfo.id}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!supplierResponse.ok) {
              const errorData = await supplierResponse.json().catch(() => ({}));
              throw new Error(errorData.message || 'Error al obtener información del proveedor');
            }

            const supplierData = await supplierResponse.json();
            console.log('Supplier data received:', supplierData);

            if (!supplierData?.id) {
              throw new Error('No se encontró el ID del proveedor');
            }

            endpoint = `http://localhost:3040/api/invoices/supplier/${supplierData.id}`;
          } catch (supplierError) {
            throw supplierError;
          }
        } else {
          throw new Error('Rol no autorizado');
        }

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al obtener las facturas');
        }

        const data = await response.json();
        
        // Asegurarse de que data.invoices existe, si no, usar un array vacío
        setInvoices(data.invoices || []);
        
        // Asegurarse de que data.stats existe, si no, usar valores por defecto
        if (data.stats) {
          setStats(data.stats);
        } else {
          // Calcular stats localmente si no vienen del servidor
          const invoices = data.invoices || [];
          setStats({
            total: invoices.length,
            pending: invoices.filter((i: Invoice) => i.status === 'pending').length,
            paid: invoices.filter((i: Invoice) => i.status === 'paid').length,
            cancelled: invoices.filter((i: Invoice) => i.status === 'cancelled').length
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al cargar las facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, userInfo, isLoading]);

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

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return '0.00';
    }
    
    return numAmount.toFixed(2);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">Facturas</h1>
            {(userInfo?.role === 'proveedor' || userInfo?.role === 'supplier') && (
              <Link
                href="/supplier/invoices/new"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Nueva Factura
              </Link>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 border-t border-gray-200 mt-6">
              <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No hay facturas registradas</h3>
              <p className="mt-2 text-base text-gray-500">
                Aún no has creado ni recibido ninguna factura.
                {(userInfo?.role === 'supplier' || userInfo?.role === 'proveedor') && " ¡Empieza creando una!"}
              </p>
              {(userInfo?.role === 'supplier' || userInfo?.role === 'proveedor') && (
                <div className="mt-8">
                  <Button 
                    onClick={() => router.push('/supplier/invoices/new')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center text-sm font-medium transition-colors duration-150 ease-in-out"
                  >
                    <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                    Crear Primera Factura
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-t border-gray-200 pt-6">
                <div className="bg-gray-50 p-4 rounded shadow border">
                  <h3 className="text-lg font-semibold text-gray-700">Total</h3>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded shadow border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800">Pendientes</h3>
                  <p className="text-2xl font-semibold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-green-50 p-4 rounded shadow border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800">Pagadas</h3>
                  <p className="text-2xl font-semibold text-green-900">{stats.paid}</p>
                </div>
                <div className="bg-red-50 p-4 rounded shadow border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800">Canceladas</h3>
                  <p className="text-2xl font-semibold text-red-900">{stats.cancelled}</p>
                </div>
              </div>
              
              <div className="overflow-x-auto pt-6 border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Presupuesto
                      </th>
                      {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proveedor
                        </th>
                      )}
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
                            {invoice.budget?.description || `Presupuesto #${invoice.budgetId}`}
                          </div>
                        </td>
                        {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {invoice.supplier?.name || 'N/A'}
                            </div>
                          </td>
                        )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/supplier/invoices/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </Link>
                            {userInfo?.role === 'proveedor' && invoice.status === 'pending' && (
                              <>
                                <Link
                                  href={`/supplier/invoices/${invoice.id}/edit`}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Editar
                                </Link>
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => window.open(`/supplier/invoices/${invoice.id}/print`, '_blank')}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Imprimir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 