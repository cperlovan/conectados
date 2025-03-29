"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiDollarSign, FiCalendar, FiCreditCard, FiAlertCircle, FiCheckCircle, FiFilter, FiPlus } from "react-icons/fi";
import { getOwnerByUserId, getPaymentsByOwnerId, Payment } from "../../utils/api";

export default function OwnerPayments() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    year: "all",
    property: "all",
    method: "all"
  });
  const [properties, setProperties] = useState<{id: number, name: string}[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchPayments = async () => {
      if (isLoading) return;
      if (!token) return;
      
      try {
        if (!userInfo?.id) {
          throw new Error("ID de usuario no encontrado");
        }

        console.log("Obteniendo datos del propietario...");
        // Primero obtener el perfil del propietario usando la función de API
        const ownerData = await getOwnerByUserId(userInfo.id, token);
        
        console.log("Obteniendo pagos del propietario...");
        // Luego obtener los pagos del propietario usando la función de API
        const paymentsData = await getPaymentsByOwnerId(ownerData.id, token);
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
        
        // Extraer propiedades únicas, años y métodos de pago para filtros
        if (paymentsData.length > 0) {
          // Propiedades únicas
          const propertiesSet = new Set<string>();
          const propertiesMap = new Map<number, string>();
          
          paymentsData.forEach((payment: Payment) => {
            if (payment.receipt && payment.receipt.property) {
              const propId = payment.receipt.property.id;
              const propName = payment.receipt.property.name;
              if (propId && propName && !propertiesMap.has(propId)) {
                propertiesMap.set(propId, propName);
              }
            }
          });
          
          const uniqueProperties = Array.from(propertiesMap.entries()).map(([id, name]) => ({ id, name }));
          
          // Años únicos
          const uniqueYears = Array.from(new Set(paymentsData.map(
            (payment: Payment) => {
              const date = new Date(payment.date);
              return date.getFullYear().toString();
            }
          ))).sort((a, b) => parseInt(b as string) - parseInt(a as string)) as string[];
          
          // Métodos de pago únicos
          const uniqueMethods = Array.from(new Set(paymentsData.map(
            (payment: Payment) => payment.method
          ))) as string[];
          
          setProperties(uniqueProperties);
          setYears(uniqueYears);
          setMethods(uniqueMethods);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los pagos");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [token, userInfo, router, isLoading]);

  useEffect(() => {
    if (payments.length > 0) {
      let result = [...payments];
      
      if (filters.status !== "all") {
        result = result.filter(payment => payment.status.toLowerCase() === filters.status);
      }
      
      if (filters.year !== "all") {
        result = result.filter(payment => {
          const date = new Date(payment.date);
          return date.getFullYear().toString() === filters.year;
        });
      }
      
      if (filters.property !== "all") {
        result = result.filter(payment => 
          payment.receipt && payment.receipt.property && payment.receipt.property.id && 
          payment.receipt.property.id.toString() === filters.property
        );
      }
      
      if (filters.method !== "all") {
        result = result.filter(payment => payment.method.toLowerCase() === filters.method.toLowerCase());
      }
      
      setFilteredPayments(result);
    }
  }, [filters, payments]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Aprobado
          </span>
        );
      case 'pending':
      case 'pendiente':
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
      case 'rechazado':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs flex items-center">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'transfer':
      case 'transferencia':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
            Transferencia
          </span>
        );
      case 'cash':
      case 'efectivo':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
            Efectivo
          </span>
        );
      case 'credit_card':
      case 'tarjeta_credito':
        return (
          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
            Tarjeta de Crédito
          </span>
        );
      case 'debit_card':
      case 'tarjeta_debito':
        return (
          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs">
            Tarjeta de Débito
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
            {method}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Fecha no disponible";
      
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error de formato";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pagos...</p>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
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
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Mis Pagos</h1>
            <Link 
              href="/payment/new" 
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-700 transition-colors"
            >
              <FiPlus className="mr-1" /> Registrar Pago
            </Link>
          </div>
          
          <div className="text-gray-500 text-sm mb-6">
            Total: <span className="font-medium">{payments.length}</span> pagos registrados
          </div>
          
          {/* Filtros */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="approved">Aprobados</option>
                  <option value="pending">Pendientes</option>
                  <option value="rejected">Rechazados</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Año</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Propiedad</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.property}
                  onChange={(e) => handleFilterChange('property', e.target.value)}
                >
                  <option value="all">Todas</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Método de Pago</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {methods.map(method => (
                    <option key={method} value={method}>
                      {method === 'transfer' ? 'Transferencia' : 
                       method === 'cash' ? 'Efectivo' : 
                       method === 'credit_card' ? 'Tarjeta de Crédito' : 
                       method === 'debit_card' ? 'Tarjeta de Débito' : 
                       method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron pagos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{payment.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(payment.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiDollarSign className="text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(payment.method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCreditCard className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {payment.reference || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.receipt ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {payment.receipt.property && payment.receipt.property.name ? payment.receipt.property.name : 'Sin propiedad'}
                            </div>
                            <div className="text-gray-500">
                              {payment.receipt.month} {payment.receipt.year}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pago directo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/payment/${payment.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
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
    </div>
  );
} 