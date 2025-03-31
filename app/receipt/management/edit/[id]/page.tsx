"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToken } from "../../../../hook/useToken";
import Header from "../../../../components/Header";
import { 
  FiFileText, 
  FiAlertCircle, 
  FiCalendar, 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheck,
  FiEdit
} from "react-icons/fi";
import { 
  fetchAPI, 
  Receipt,
  updateReceipt
} from "../../../../utils/api";
import Link from "next/link";

export default function EditReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    status: "pending",
    dueDate: "",
    pending_amount: "",
    credit_balance: "0.00",
    visible: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  
  // Extraer el ID del recibo desde los parámetros de la URL
  useEffect(() => {
    if (params?.id) {
      const id = Array.isArray(params.id) ? parseInt(params.id[0]) : parseInt(params.id);
      if (!isNaN(id)) {
        setReceiptId(id);
      } else {
        setError("ID de recibo inválido");
      }
    }
  }, [params]);

  // Cargar los datos del recibo
  const loadReceipt = useCallback(async () => {
    if (!token || !receiptId) return;
    
    try {
      setLoading(true);
      
      const data = await fetchAPI(`/receipts/${receiptId}`, { token });
      
      if (data) {
        setReceipt(data);
        
        // Actualizar el formulario con los datos recibidos
        setFormData({
          amount: data.amount.toString(),
          status: data.status,
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : "",
          pending_amount: data.pending_amount.toString(),
          credit_balance: data.credit_balance.toString(),
          visible: data.visible || false
        });
      } else {
        setError("No se encontró el recibo");
      }
    } catch (err) {
      console.error("Error al cargar el recibo:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el recibo");
    } finally {
      setLoading(false);
    }
  }, [token, receiptId]);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    if (token && userInfo && !isLoading && receiptId) {
      // Verificar roles permitidos: admin, superadmin
      if (!['admin', 'superadmin'].includes(userInfo.role)) {
        router.push("/unauthorized");
        return;
      }
      
      loadReceipt();
    }
  }, [token, userInfo, isLoading, receiptId, router, loadReceipt]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "amount" && formData.status === "pending") {
      // Si cambia el monto y el estado es pendiente, actualizar también el monto pendiente
      setFormData(prev => ({
        ...prev,
        [name]: value,
        pending_amount: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.dueDate) {
      setError("Por favor, complete todos los campos obligatorios");
      return;
    }
    
    if (!receiptId) {
      setError("ID de recibo no disponible");
      return;
    }
    
    try {
      setSaving(true);
      setError("");
      
      // Si el estado es "paid", asegurarse que pending_amount sea 0
      const dataToSubmit = {
        ...formData,
        pending_amount: formData.status === "paid" ? "0.00" : formData.pending_amount,
      };
      
      await updateReceipt(receiptId, dataToSubmit, token as string);
      
      setSuccess(true);
      
      // Redirigir a la página de gestión después de 2 segundos
      setTimeout(() => {
        router.push("/receipt/management");
      }, 2000);
    } catch (err) {
      console.error("Error al actualizar el recibo:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el recibo");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando recibo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !receipt) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
          <Link
            href="/receipt/management"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Volver a gestión de recibos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/receipt/management"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-2" />
            Volver a gestión de recibos
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FiEdit className="mr-2 text-blue-600" />
              Editar Recibo #{receiptId}
            </h1>
            {receipt && receipt.User && (
              <p className="text-gray-600 mt-1">
                Usuario: {receipt.User.name} ({receipt.User.email})
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                <FiAlertCircle className="mr-2" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
                <FiCheck className="mr-2" />
                ¡Recibo actualizado exitosamente! Redirigiendo...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="amount">
                  Monto Total <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-500" />
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="pending_amount">
                  Monto Pendiente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-500" />
                  </div>
                  <input
                    type="number"
                    id="pending_amount"
                    name="pending_amount"
                    value={formData.pending_amount}
                    onChange={handleChange}
                    className={`pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      formData.status === "paid" ? "bg-gray-100" : ""
                    }`}
                    step="0.01"
                    min="0"
                    disabled={formData.status === "paid"}
                  />
                </div>
                {formData.status === "paid" && (
                  <p className="text-sm text-gray-500 mt-1">
                    El monto pendiente se establece automáticamente a 0 para recibos pagados.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="credit_balance">
                  Balance de Crédito
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-500" />
                  </div>
                  <input
                    type="number"
                    id="credit_balance"
                    name="credit_balance"
                    value={formData.credit_balance}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="dueDate">
                  Fecha de Vencimiento <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visible"
                  name="visible"
                  checked={formData.visible}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="visible" className="ml-2 block text-sm text-gray-900">
                  Visible para el propietario
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => router.push("/receipt/management")}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 mr-4"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
                disabled={saving || success}
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 