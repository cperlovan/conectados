"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiFileText, FiAlertCircle, FiCheckCircle, FiCalendar, FiDollarSign, FiFilter, FiDownload, FiHome, FiPlus } from "react-icons/fi";
import { getOwnerByUserId, getReceiptsByUserId, Receipt } from "../../utils/api";

export default function OwnerReceipts() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    year: "all",
    property: "all"
  });
  const [properties, setProperties] = useState<{
    id: number, 
    type?: string,
    number?: string,
    block?: string,
    floor?: string
  }[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchReceipts = async () => {
      if (isLoading) return;
      if (!token) return;
      
      try {
        if (!userInfo?.id) {
          throw new Error("ID de usuario no encontrado");
        }

        console.log("Obteniendo datos del propietario...");
        // Primero obtener el perfil del propietario usando la función de API
        const ownerData = await getOwnerByUserId(userInfo.id, token);
        
        console.log("Obteniendo recibos del propietario...");
        // Usar el ID del usuario directamente, ya que el endpoint espera un user ID, no un owner ID
        const receiptsData = await getReceiptsByUserId(userInfo.id, token);
        setReceipts(receiptsData);
        setFilteredReceipts(receiptsData);
        
        // Extraer propiedades únicas y años para filtros
        const uniqueProperties = Array.from(new Set(receiptsData.map(
          (receipt: Receipt) => receipt.propertyId
        ))).map(propId => {
          const receipt = receiptsData.find((r: Receipt) => r.propertyId === propId);
          return {
            id: propId as number,
            type: receipt?.property?.type,
            number: receipt?.property?.number || undefined,
            block: receipt?.property?.block || undefined,
            floor: receipt?.property?.floor || undefined
          };
        });
        
        const uniqueYears = Array.from(new Set(receiptsData.map(
          (receipt: Receipt) => receipt.year ? receipt.year.toString() : null
        )))
        .filter(year => year !== null)
        .sort((a, b) => parseInt(b as string) - parseInt(a as string)) as string[];
        
        setProperties(uniqueProperties);
        setYears(uniqueYears);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los recibos");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [token, userInfo, router, isLoading]);
  
  useEffect(() => {
    if (receipts.length > 0) {
      let result = [...receipts];
      
      if (filters.status !== "all") {
        result = result.filter(receipt => receipt.status?.toLowerCase() === filters.status);
      }
      
      if (filters.year !== "all") {
        result = result.filter(receipt => receipt.year && receipt.year.toString() === filters.year);
      }
      
      if (filters.property !== "all") {
        result = result.filter(receipt => receipt.propertyId !== undefined && receipt.propertyId.toString() === filters.property);
      }
      
      setFilteredReceipts(result);
    }
  }, [filters, receipts]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs flex items-center">
          <FiAlertCircle className="mr-1" />
          Pendiente
        </span>
      );
    }
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Pagado
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
      case 'overdue':
      case 'vencido':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Vencido
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Fecha no disponible";
    
    try {
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
            <p className="text-gray-600">Cargando recibos...</p>
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
          <h1 className="text-2xl font-bold mb-4">Mis Recibos</h1>
          <div className="text-gray-500 text-sm mb-6">
            Total: <span className="font-medium">{receipts.length}</span> recibos encontrados
          </div>
          
          {/* Filtros */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option key="status-all" value="all">Todos</option>
                  <option key="status-paid" value="paid">Pagados</option>
                  <option key="status-pending" value="pending">Pendientes</option>
                  <option key="status-overdue" value="overdue">Vencidos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Año</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option key="year-all" value="all">Todos</option>
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
                  <option key="property-all" value="all">Todas</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.type && property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                      {property.number && ` ${property.number}`}
                      {property.block && ` - Bloque ${property.block}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron recibos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propiedad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiFileText className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            #{receipt.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {receipt.property ? (
                            <>
                              {receipt.property.type && 
                                `${receipt.property.type.charAt(0).toUpperCase() + receipt.property.type.slice(1)}`}
                              {receipt.property.number && ` ${receipt.property.number}`}
                            </>
                          ) : 'Propiedad no especificada'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {receipt.property && receipt.property.block && `Bloque ${receipt.property.block}`}
                          {receipt.property && receipt.property.floor && receipt.property.block && ` - `}
                          {receipt.property && receipt.property.floor && `Piso ${receipt.property.floor}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {receipt.month} {receipt.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiDollarSign className="text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(receipt.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDate(receipt.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(receipt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/receipt/${receipt.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalles"
                          >
                            Ver
                          </Link>
                          <button
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Descargar recibo"
                          >
                            <FiDownload size={14} />
                          </button>
                          {(receipt.status?.toLowerCase() === 'pending' || receipt.status?.toLowerCase() === 'pendiente') && (
                            <Link
                              href={`/payment/new?receiptId=${receipt.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Realizar pago"
                            >
                              Pagar
                            </Link>
                          )}
                        </div>
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