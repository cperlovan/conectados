"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import { 
  FiFileText, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiCalendar, 
  FiDollarSign, 
  FiPlus, 
  FiFilter, 
  FiEye, 
  FiEyeOff,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiPrinter
} from "react-icons/fi";
import { 
  fetchAPI, 
  Receipt, 
  getReceiptsByCondominiumId, 
  toggleReceiptsVisibility,
  deleteReceipt
} from "../../utils/api";
import Link from "next/link";
import ReceiptPDF from "../../components/ReceiptPDF";
import { Button } from "@/components/ui/button";

// Utilidad para asegurar que un valor sea número
const ensureNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseInt(String(value));
  return isNaN(num) ? null : num;
};

export default function ReceiptManagementPage() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    status: "all",
    month: "all",
    year: "all",
    property: "all",
    search: ""
  });

  // Estado para opciones de filtros
  const [years, setYears] = useState<string[]>([]);
  const [properties, setProperties] = useState<{id: number, number: string, type?: string}[]>([]);
  
  // Estado para el modal de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);

  const loadReceipts = useCallback(async () => {
    if (!token || !userInfo || isLoading) return;

    try {
      setLoading(true);
      setRefreshing(true);
      
      if (!userInfo.condominiumId && userInfo.role !== 'superadmin') {
        setError("No tienes un condominio asignado");
        return;
      }
      
      const condominiumId = userInfo.condominiumId || 1;
      const data = await getReceiptsByCondominiumId(condominiumId, token);
      
      if (Array.isArray(data)) {
        console.log('Datos recibidos del servidor (primeros 2 recibos):', data.slice(0, 2));
        
        const normalizedReceipts = data.map(receipt => {
          // Intentar extraer mes y año de la fecha del recibo
          let month = null;
          let year = null;

          // Intentar obtener mes y año de date si existe
          if (receipt.date) {
            const receiptDate = new Date(receipt.date);
            if (!isNaN(receiptDate.getTime())) {
              month = receiptDate.getMonth() + 1; // getMonth() devuelve 0-11
              year = receiptDate.getFullYear();
            }
          }

          // Si no hay date, intentar obtener de dueDate
          if (!month && !year && receipt.dueDate) {
            const dueDate = new Date(receipt.dueDate);
            if (!isNaN(dueDate.getTime())) {
              month = dueDate.getMonth() + 1;
              year = dueDate.getFullYear();
            }
          }

          console.log('Normalizando recibo:', {
            id: receipt.id,
            date: receipt.date,
            dueDate: receipt.dueDate,
            extractedMonth: month,
            extractedYear: year
          });
          
          return {
            ...receipt,
            month,
            year
          };
        });

        console.log('Recibos normalizados (primeros 2):', normalizedReceipts.slice(0, 2));
        
        setReceipts(normalizedReceipts);

        // Extraer años únicos
        const uniqueYears = Array.from(new Set(
          normalizedReceipts
            .map(receipt => receipt.year)
            .filter(year => year !== null)
        )).sort((a, b) => (b || 0) - (a || 0)).map(String);
        
        console.log('Años únicos encontrados:', uniqueYears);
        setYears(uniqueYears);

        // Extraer propiedades únicas
        const uniqueProperties = Array.from(
          new Map(
            normalizedReceipts
              .filter(receipt => receipt.property)
              .map(receipt => [
                receipt.property.id,
                {
                  id: receipt.property.id,
                  number: receipt.property.number,
                  type: receipt.property.type
                }
              ])
          ).values()
        );
        
        console.log('Propiedades únicas encontradas:', uniqueProperties);
        setProperties(uniqueProperties);
      } else {
        setError("Formato de respuesta inesperado");
      }
    } catch (err) {
      console.error("Error al cargar los recibos:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los recibos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userInfo, isLoading]);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    if (token && userInfo && !isLoading) {
      if (!['admin', 'superadmin'].includes(userInfo.role)) {
        router.push("/unauthorized");
        return;
      }
      
      loadReceipts();
    }
  }, [token, userInfo, isLoading, router, loadReceipts]);

  // Filtrar recibos según todos los filtros
  const filteredReceipts = receipts.filter(receipt => {
    // Filtro por estado
    if (filters.status !== "all" && receipt.status?.toLowerCase() !== filters.status) {
      return false;
    }

    // Filtro por mes
    if (filters.month !== "all") {
      const filterMonth = ensureNumber(filters.month);
      let receiptMonth = null;

      // Obtener mes del recibo
      if (receipt.month) {
        receiptMonth = ensureNumber(receipt.month);
      }

      console.log('Comparación de meses:', {
        filterMonth,
        receiptMonth,
        receiptId: receipt.id,
        dueDate: receipt.dueDate,
        month: receipt.month
      });

      if (receiptMonth === null || filterMonth !== receiptMonth) {
        return false;
      }
    }

    // Filtro por año
    if (filters.year !== "all") {
      const filterYear = ensureNumber(filters.year);
      let receiptYear = null;

      // Obtener año de dueDate
      if (receipt.dueDate) {
        const dueDate = new Date(receipt.dueDate);
        if (!isNaN(dueDate.getTime())) {
          receiptYear = dueDate.getFullYear();
        }
      }

      if (receiptYear === null || filterYear !== receiptYear) {
        return false;
      }
    }

    // Filtro por propiedad
    if (filters.property !== "all" && receipt.property?.id?.toString() !== filters.property) {
      return false;
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const propertyMatch = receipt.property?.number?.toLowerCase().includes(searchLower) || false;
      const userMatch = receipt.User?.name?.toLowerCase().includes(searchLower) || 
                       receipt.User?.email?.toLowerCase().includes(searchLower) || false;
      const idMatch = receipt.id.toString().includes(searchLower);
      
      return propertyMatch || userMatch || idMatch;
    }

    return true;
  });

  // Agregar log para ver los recibos filtrados
  console.log('Recibos filtrados:', {
    totalRecibos: receipts.length,
    recibosFiltrados: filteredReceipts.length,
    filtros: filters,
    primerRecibo: filteredReceipts[0]
  });

  // Manejar cambios en los filtros
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Seleccionar/deseleccionar todos los recibos
  const toggleSelectAll = () => {
    if (selectedReceipts.length === filteredReceipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(filteredReceipts.map(receipt => receipt.id));
    }
  };

  // Seleccionar/deseleccionar un recibo específico
  const toggleSelect = (id: number) => {
    if (selectedReceipts.includes(id)) {
      setSelectedReceipts(selectedReceipts.filter(receiptId => receiptId !== id));
    } else {
      setSelectedReceipts([...selectedReceipts, id]);
    }
  };

  // Cambiar la visibilidad de los recibos seleccionados
  const handleToggleVisibility = async (visible: boolean) => {
    if (selectedReceipts.length === 0) {
      alert("Por favor, selecciona al menos un recibo");
      return;
    }

    try {
      await toggleReceiptsVisibility(selectedReceipts, visible, token as string);
      // Actualizar el estado local para reflejar el cambio
      setReceipts(
        receipts.map(receipt => 
          selectedReceipts.includes(receipt.id) 
            ? { ...receipt, visible } 
            : receipt
        )
      );
      setSelectedReceipts([]);
      alert(`Recibos ${visible ? 'publicados' : 'ocultados'} exitosamente`);
    } catch (error) {
      console.error("Error al cambiar la visibilidad:", error);
      alert("Error al cambiar la visibilidad de los recibos");
    }
  };

  // Iniciar el proceso de eliminación de un recibo
  const confirmDelete = (id: number) => {
    setReceiptToDelete(id);
    setShowDeleteModal(true);
  };

  // Ejecutar la eliminación del recibo
  const handleDelete = async () => {
    if (!receiptToDelete) return;
    
    try {
      await deleteReceipt(receiptToDelete, token as string);
      setReceipts(receipts.filter(receipt => receipt.id !== receiptToDelete));
      setShowDeleteModal(false);
      setReceiptToDelete(null);
      alert("Recibo eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar el recibo:", error);
      alert("Error al eliminar el recibo");
    }
  };

  const formatDate = (dateString: string) => {
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

  const formatCurrency = (amount: number | string) => {
    if (amount === undefined || amount === null) {
      amount = 0;
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
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
      case 'partial':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Pago Parcial
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
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Volver
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">Gestión de Recibos</h1>
            {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
              <Link
                href="/receipt/management/create"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Generar Nuevo Recibo
              </Link>
            )}
          </div>

          {receipts.length === 0 ? (
            <div className="text-center py-20 border-t border-gray-200 mt-6">
              <FiPrinter className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No hay recibos generados</h3>
              <p className="mt-2 text-base text-gray-500">
                Aún no se ha generado ningún recibo para este condominio.
              </p>
              {(userInfo?.role === 'admin' || userInfo?.role === 'superadmin') && (
                <div className="mt-8">
                  <Button onClick={() => router.push('/receipt/management/create')}>
                    <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                    Generar Primer Recibo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-b border-gray-200 pb-6">
                <div className="bg-gray-50 p-4 rounded shadow border"><h3 className="text-lg font-semibold text-gray-700">Total Recibos</h3><p className="text-2xl font-semibold text-gray-900">{receipts.length}</p></div>
                <div className="bg-green-50 p-4 rounded shadow border border-green-200"><h3 className="text-lg font-semibold text-green-800">Pagados</h3><p className="text-2xl font-semibold text-green-900">{receipts.filter(r => r.status === 'paid').length}</p></div>
                <div className="bg-yellow-50 p-4 rounded shadow border border-yellow-200"><h3 className="text-lg font-semibold text-yellow-800">Pendientes</h3><p className="text-2xl font-semibold text-yellow-900">{receipts.filter(r => r.status === 'pending').length}</p></div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <FiFilter className="text-gray-500 mr-2" />
                  <h2 className="text-lg font-medium">Filtros</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Estado</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="paid">Pagados</option>
                      <option value="partial">Parciales</option>
                      <option value="overdue">Vencidos</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mes</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
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
                        <option key={property.id} value={property.id}>
                          {property.type ? `${property.type} ${property.number}` : property.number}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Buscar</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ID, propietario, propiedad..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="viewMode" className="text-sm text-gray-600">
                      Vista:
                    </label>
                    <select
                      id="viewMode"
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as "cards" | "list")}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="list">Lista</option>
                      <option value="cards">Tarjetas</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
                {viewMode === "list" ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedReceipts.length === filteredReceipts.length}
                              onChange={toggleSelectAll}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Propiedad
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Propietario
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visible
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReceipts.map((receipt) => (
                          <tr key={receipt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedReceipts.includes(receipt.id)}
                                onChange={() => toggleSelect(receipt.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {receipt.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {receipt.property?.type} {receipt.property?.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {receipt.User?.name || receipt.User?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(receipt.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {receipt.month && receipt.year ? `${receipt.month}/${receipt.year}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                receipt.status === 'paid' ? 'bg-green-100 text-green-800' :
                                receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                receipt.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                receipt.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {receipt.status === 'paid' ? 'Pagado' :
                                 receipt.status === 'pending' ? 'Pendiente' :
                                 receipt.status === 'partial' ? 'Parcial' :
                                 receipt.status === 'overdue' ? 'Vencido' :
                                 'Desconocido'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {receipt.visible ? (
                                <FiEye className="text-green-600" />
                              ) : (
                                <FiEyeOff className="text-gray-400" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => router.push(`/receipt/management/edit/${receipt.id}`)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Editar"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  onClick={() => confirmDelete(receipt.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {filteredReceipts.map((receipt) => (
                      <div key={receipt.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {receipt.property?.type} {receipt.property?.number}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {receipt.User?.name || receipt.User?.email || 'N/A'}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedReceipts.includes(receipt.id)}
                            onChange={() => toggleSelect(receipt.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">ID:</span>
                            <span className="text-sm font-medium">{receipt.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Monto:</span>
                            <span className="text-sm font-medium">{formatCurrency(receipt.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Fecha:</span>
                            <span className="text-sm font-medium">
                              {receipt.month && receipt.year ? `${receipt.month}/${receipt.year}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Estado:</span>
                            <span className={`px-2 text-xs font-semibold rounded-full ${
                              receipt.status === 'paid' ? 'bg-green-100 text-green-800' :
                              receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              receipt.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                              receipt.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {receipt.status === 'paid' ? 'Pagado' :
                               receipt.status === 'pending' ? 'Pendiente' :
                               receipt.status === 'partial' ? 'Parcial' :
                               receipt.status === 'overdue' ? 'Vencido' :
                               'Desconocido'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Visible:</span>
                            {receipt.visible ? (
                              <FiEye className="text-green-600" />
                            ) : (
                              <FiEyeOff className="text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/receipt/management/edit/${receipt.id}`)}
                            className="p-1 text-yellow-600 hover:text-yellow-900"
                            title="Editar"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => confirmDelete(receipt.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mb-4">
              ¿Estás seguro de que deseas eliminar este recibo? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 