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

export default function ReceiptManagementPage() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, paid, overdue
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  
  // Estado para el modal de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);

  const loadReceipts = useCallback(async () => {
    if (!token || !userInfo || isLoading) return;

    try {
      setLoading(true);
      
      if (!userInfo.condominiumId && userInfo.role !== 'superadmin') {
        setError("No tienes un condominio asignado");
        setLoading(false);
        return;
      }
      
      // Para superadmin sin condominio asignado, usar un ID por defecto o mostrar selector
      const condominiumId = userInfo.condominiumId || 1; // Condominio por defecto para superadmin
      
      const data = await getReceiptsByCondominiumId(condominiumId, token);
      
      if (Array.isArray(data)) {
        // Ensure all receipts have month and year, even if null
        const normalizedReceipts = data.map(receipt => ({
          ...receipt,
          month: receipt.month || null,
          year: receipt.year || null
        }));
        setReceipts(normalizedReceipts);
      } else {
        setError("Formato de respuesta inesperado");
      }
    } catch (err) {
      console.error("Error al cargar los recibos:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los recibos");
    } finally {
      setLoading(false);
    }
  }, [token, userInfo, isLoading]);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    if (token && userInfo && !isLoading) {
      // Verificar roles permitidos: admin, superadmin
      if (!['admin', 'superadmin'].includes(userInfo.role)) {
        router.push("/unauthorized");
        return;
      }
      
      loadReceipts();
    }
  }, [token, userInfo, isLoading, router, loadReceipts]);

  // Filtrar recibos según el filtro seleccionado
  const filteredReceipts = receipts.filter(receipt => {
    if (filter === "all") return true;
    return receipt.status?.toLowerCase() === filter;
  });

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiFileText className="mr-2 text-blue-600" />
            Gestión de Recibos
          </h1>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Link
              href="/receipt/management/create"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center text-sm"
            >
              <FiPlus className="mr-2" />
              Generar Recibos
            </Link>
            {selectedReceipts.length > 0 && (
              <>
                <button
                  onClick={() => handleToggleVisibility(true)}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center text-sm"
                >
                  <FiEye className="mr-2" />
                  Publicar
                </button>
                <button
                  onClick={() => handleToggleVisibility(false)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md flex items-center text-sm"
                >
                  <FiEyeOff className="mr-2" />
                  Ocultar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="filter" className="mr-2 text-gray-700">Filtrar por:</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Pagados</option>
                <option value="overdue">Vencidos</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-md ${viewMode === "cards" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Tarjetas
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReceipts.length === filteredReceipts.length && filteredReceipts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Usuario</th>
                    <th className="py-3 px-4 text-left">Monto</th>
                    <th className="py-3 px-4 text-left">Pendiente</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-left">Vencimiento</th>
                    <th className="py-3 px-4 text-left">Visible</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 px-6 text-center text-gray-500">
                        No se encontraron recibos
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedReceipts.includes(receipt.id)}
                            onChange={() => toggleSelect(receipt.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{receipt.id}</td>
                        <td className="py-3 px-4">
                          {receipt.Owner?.fullName || receipt.User?.name || "Usuario no disponible"}
                          <div className="text-xs text-gray-500">{receipt.User?.email || "Email no disponible"}</div>
                          {receipt.property && (
                            <div className="text-xs text-gray-500">
                              Prop: {receipt.property.number || ""} 
                              {receipt.property.block ? ` Bloque ${receipt.property.block}` : ""}
                              {receipt.property.floor ? ` Piso ${receipt.property.floor}` : ""}
                              {receipt.property.type ? ` (${receipt.property.type})` : ""}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{formatCurrency(receipt.amount || 0)}</td>
                        <td className="py-3 px-4">{formatCurrency(receipt.pending_amount || 0)}</td>
                        <td className="py-3 px-4">{getStatusBadge(receipt.status)}</td>
                        <td className="py-3 px-4">{formatDate(receipt.dueDate)}</td>
                        <td className="py-3 px-4">
                          {receipt.visible ? (
                            <span className="text-green-600 flex items-center">
                              <FiEye className="mr-1" /> Visible
                            </span>
                          ) : (
                            <span className="text-gray-500 flex items-center">
                              <FiEyeOff className="mr-1" /> Oculto
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/receipt/management/edit/${receipt.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar"
                            >
                              <FiEdit />
                            </Link>
                            <ReceiptPDF 
                              receipt={receipt} 
                              buttonLabel="" 
                              className="text-green-600 hover:text-green-800" 
                            />
                            <button
                              onClick={() => confirmDelete(receipt.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No se encontraron recibos
                </div>
              ) : (
                filteredReceipts.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center">
                      <span className="text-lg font-semibold">Recibo #{receipt.id}</span>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.includes(receipt.id)}
                          onChange={() => toggleSelect(receipt.id)}
                          className="mr-2 rounded"
                        />
                        {receipt.visible ? (
                          <FiEye className="text-green-600" title="Visible" />
                        ) : (
                          <FiEyeOff className="text-gray-500" title="Oculto" />
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="font-semibold text-sm text-gray-600">Usuario:</span>
                        <div>{receipt.Owner?.fullName || receipt.User?.name || "Usuario no disponible"}</div>
                        <div className="text-xs text-gray-500">{receipt.User?.email || "Email no disponible"}</div>
                        {receipt.property && (
                          <div className="text-xs text-gray-500">
                            Prop: {receipt.property.number || ""} 
                            {receipt.property.block ? ` Bloque ${receipt.property.block}` : ""}
                            {receipt.property.floor ? ` Piso ${receipt.property.floor}` : ""}
                            {receipt.property.type ? ` (${receipt.property.type})` : ""}
                          </div>
                        )}
                      </div>
                      <div className="mb-2 flex justify-between">
                        <div>
                          <span className="font-semibold text-sm text-gray-600">Monto:</span>
                          <div>{formatCurrency(receipt.amount || 0)}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-600">Pendiente:</span>
                          <div>{formatCurrency(receipt.pending_amount || 0)}</div>
                        </div>
                      </div>
                      <div className="mb-2 flex justify-between">
                        <div>
                          <span className="font-semibold text-sm text-gray-600">Estado:</span>
                          <div>{getStatusBadge(receipt.status)}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-600">Vencimiento:</span>
                          <div>{formatDate(receipt.dueDate)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 flex justify-end space-x-2">
                      <Link
                        href={`/receipt/management/edit/${receipt.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <FiEdit />
                      </Link>
                      <ReceiptPDF 
                        receipt={receipt} 
                        buttonLabel="" 
                        className="p-2 text-green-600 hover:bg-green-50 rounded" 
                      />
                      <button
                        onClick={() => confirmDelete(receipt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Estás seguro que deseas eliminar este recibo? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleDelete}
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