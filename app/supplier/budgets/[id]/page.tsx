"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface ContactInfo {
  name?: string
  lastname?: string
  movil?: string
  phone?: string
  address?: string
  companyName?: string
}

interface Supplier {
  id: number
  name: string
  contactInfo: ContactInfo
  User?: {
    email: string
  }
}

interface Budget {
  id: number
  amount: number
  status: string
  description: string
  title: string
  details: string
  createdAt: string
  updatedAt: string
  supplier: Supplier
  total: number
  budgetRequestId: number
  items: BudgetItem[]
}

interface BudgetItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function BudgetDetails() {
  const params = useParams();
  const router = useRouter();
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (tokenLoading) return;

    if (!token || !userInfo) {
      router.push('/login');
      return;
    }

    if (userInfo.role !== 'proveedor' && userInfo.role !== 'supplier' && 
        userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
      router.push('/');
      return;
    }

    const fetchBudget = async () => {
      try {
        const response = await fetch(`http://localhost:3040/api/budgets/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener el presupuesto');
        }

        const data = await response.json();
        setBudget(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar el presupuesto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudget();
  }, [params.id, token, userInfo, tokenLoading, router]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !budget) return;
    setUpdating(true);
    setError(null);

    try {
      // Usar el enfoque RESTful estándar: actualizar el recurso directamente
      const status = newStatus === 'approved' || newStatus === 'aprobado' ? 'approved' : 'rejected';
      
      console.log(`Actualizando presupuesto ${budget.id} a estado: ${status}`);
      
      const response = await fetch(`http://localhost:3040/api/budgets/${budget.id}`, {
        method: 'PUT', // Cambiado de PATCH a PUT para evitar problemas de CORS
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error al actualizar el estado: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Si no se puede parsear como JSON, usamos el mensaje genérico
          console.error('Error parseando respuesta:', e);
        }
        
        throw new Error(errorMessage);
      }

      const updatedBudget = await response.json();
      setBudget(updatedBudget);
      
      // Mostrar mensaje de éxito
      const mensaje = status === 'approved' 
                    ? 'Presupuesto aprobado correctamente' 
                    : 'Presupuesto rechazado correctamente';
      alert(mensaje);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el estado');
      // No mostramos alert para evitar bloquear la interfaz
    } finally {
      setUpdating(false);
    }
  };

  if (tokenLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow-xl rounded-2xl p-8 text-center">
              <div className="text-red-500 text-xl mb-4">{error}</div>
              <p className="text-gray-600 mb-6">
                Se produjo un error al intentar actualizar o cargar el presupuesto. Es posible que el recurso no exista o que no tenga los permisos necesarios.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => router.push('/supplier/budgets')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Volver a la lista de presupuestos
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>No se encontró el presupuesto</div>
      </div>
    );
  }

  // Helper para determinar si el estado es aprobado (considerando ambas formas)
  const isApproved = budget.status === 'approved' || budget.status === 'aprobado';
  // Helper para determinar si el estado es rechazado (considerando ambas formas)
  const isRejected = budget.status === 'rejected' || budget.status === 'rechazado';
  // Helper para determinar si el estado es pendiente
  const isPending = budget.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Detalles del Presupuesto</h1>
            <div className="space-x-4">
              {userInfo && (userInfo.role === 'proveedor' || userInfo.role === 'supplier') && (
                <Link
                  href={`/supplier/budgets/${params.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Editar
                </Link>
              )}
              <Link
                href="/supplier/budgets"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">{budget.title || 'Sin título'}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(budget.status)}`}>
                  {budget.status}
                </span>
              </div>
            </div>

            {isPending && userInfo && (userInfo.role === 'admin' || userInfo.role === 'superadmin') && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end space-x-4">
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Aprobar'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Rechazar'
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Estado</h3>
                    <Badge variant={isApproved ? 'default' : isRejected ? 'destructive' : 'secondary'}>
                      {isApproved ? 'Aprobado' : isRejected ? 'Rechazado' : budget.status || 'Pendiente'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Total</h3>
                    <p className="text-2xl font-bold">
                      ${ensureNumber(budget.total !== undefined ? budget.total : budget.amount || calculateTotal(budget.items || [])).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Descripción</h3>
                  <p className="mt-2">{budget.description || 'Sin descripción'}</p>
                </div>

                {budget.items && budget.items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left">Descripción</th>
                            <th className="text-right">Cantidad</th>
                            <th className="text-right">Precio Unitario</th>
                            <th className="text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budget.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.description || 'Sin descripción'}</td>
                              <td className="text-right">{ensureNumber(item.quantity)}</td>
                              <td className="text-right">${ensureNumber(item.unitPrice).toFixed(2)}</td>
                              <td className="text-right">${ensureNumber(item.total || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
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
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
    case "aprobado":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "rechazado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function calculateTotal(items: BudgetItem[]) {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => {
    if (!item) return sum;
    
    const itemTotal = item.total ? ensureNumber(item.total) : 
                     (item.quantity && item.unitPrice ? ensureNumber(item.quantity) * ensureNumber(item.unitPrice) : 0);
    return sum + itemTotal;
  }, 0);
}

function ensureNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number') return value;
  
  // Try to convert to number
  const num = Number(value);
  return isNaN(num) ? 0 : num;
} 