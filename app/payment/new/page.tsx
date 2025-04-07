"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiArrowLeft, FiAlertCircle, FiCheckCircle, FiDollarSign, FiCreditCard, FiFileText } from "react-icons/fi";
import { fetchAPI, Receipt } from "../../utils/api";
import { toast } from "react-hot-toast";

export default function NewPayment() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "transfer",
    reference: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const loadReceipt = async () => {
      const receiptId = searchParams.get("receiptId");
      if (!token || !receiptId) return;
      
      try {
        setLoading(true);
        const data = await fetchAPI(`/receipts/${receiptId}`, { token });
        
        if (data) {
          setReceipt(data);
          setPaymentForm(prev => ({
            ...prev,
            amount: "" // Dejamos el monto vacío inicialmente
          }));
        } else {
          setError("No se encontró el recibo");
        }
      } catch (err) {
        console.error("Error al cargar el recibo:", err);
        setError(err instanceof Error ? err.message : "Error al cargar el recibo");
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [token, searchParams, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receipt) {
      setError("No se ha cargado la información del recibo");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Por favor ingrese un monto válido");
      return;
    }

    try {
      setSubmitting(true);
      // Mapear los métodos de pago del formulario a los valores del backend
      let backendMethod = "bank_transfer"; // valor por defecto
      
      switch(paymentForm.method) {
        case "transfer":
          backendMethod = "bank_transfer";
          break;
        case "credit_card":
          backendMethod = "credit_card";
          break;
        case "debit_card":
          backendMethod = "credit_card"; // Usar credit_card como fallback
          break;
        case "mobile_payment":
          backendMethod = "mobile_payment";
          break;
        default:
          backendMethod = "bank_transfer"; // Para otros métodos usamos transferencia como fallback
      }
      
      const paymentData = {
        receiptId: receipt.id,
        amount: amount,
        method: backendMethod,
        condominiumId: receipt.property?.condominiumId || 1, // Obtener condominiumId de la propiedad
        userId: userInfo?.id || 0, // Usar el ID del usuario actual
        payment_details: {  // Cambiar estructura para usar payment_details
          reference: paymentForm.reference,
          notes: paymentForm.notes,
          date: new Date().toISOString(),
          originalMethod: paymentForm.method // Guardar el método original
        },
        status: "pending"  // Usar status como enum definido en el backend
      };

      console.log("Enviando datos de pago:", paymentData);

      const result = await fetchAPI("/payments", {
        token: token ?? undefined,
        method: "POST",
        body: paymentData
      });

      toast.success("Pago registrado exitosamente");
      
      // Redirigir al detalle del recibo
      router.push(`/receipt/${receipt.id}`);
    } catch (err) {
      console.error("Error al registrar el pago:", err);
      toast.error(err instanceof Error ? err.message : "Error al registrar el pago");
    } finally {
      setSubmitting(false);
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
            <p className="text-gray-600">Cargando información del recibo...</p>
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
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiArrowLeft className="mr-2" />
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró información del recibo</p>
            <button
              onClick={() => router.back()}
              className="mt-4 flex items-center mx-auto text-blue-600 hover:text-blue-800"
            >
              <FiArrowLeft className="mr-2" />
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-2" />
            Volver
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiCreditCard className="mr-2 text-blue-600" />
                Realizar Pago
              </h1>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <div className="flex items-start">
                  <FiFileText className="text-blue-600 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">Detalles del Recibo</h3>
                    <div className="text-sm">
                      <p className="mb-1"><span className="font-medium">Recibo:</span> #{receipt.id}</p>
                      <p className="mb-1"><span className="font-medium">Período:</span> {receipt.month} {receipt.year}</p>
                      <p className="mb-1">
                        <span className="font-medium">Propiedad:</span> 
                        {receipt.property ? (
                          <>
                            {receipt.property.type && 
                             `${receipt.property.type.charAt(0).toUpperCase() + receipt.property.type.slice(1)}`}
                            {receipt.property.number && ` ${receipt.property.number}`}
                            {receipt.property.block && ` - Bloque ${receipt.property.block}`}
                            {receipt.property.floor && ` - Piso ${receipt.property.floor}`}
                          </>
                        ) : 'N/A'}
                      </p>
                      <p className="font-medium text-blue-800 mt-2">
                        Monto total: {formatCurrency(receipt.amount)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Monto pendiente: {formatCurrency(receipt.pending_amount || receipt.amount)}
                      </p>
                      {receipt.credit_balance !== null && receipt.credit_balance !== undefined && receipt.credit_balance > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Crédito disponible: {formatCurrency(receipt.credit_balance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiDollarSign className="text-gray-500" />
                      </div>
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        min="0.01"
                        value={paymentForm.amount}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Monto pendiente: {formatCurrency(receipt?.pending_amount || 0)}
                      {receipt?.credit_balance !== null && receipt?.credit_balance !== undefined && receipt.credit_balance > 0 && (
                        <span className="text-green-600 ml-2">
                          (Crédito disponible: {formatCurrency(receipt.credit_balance)})
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="method"
                      value={paymentForm.method}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    >
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="credit_card">Tarjeta de Crédito</option>
                      <option value="debit_card">Tarjeta de Débito</option>
                      <option value="cash">Efectivo</option>
                      <option value="check">Cheque</option>
                      <option value="mobile_payment">Pago Móvil</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Referencia {paymentForm.method !== "cash" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={paymentForm.reference}
                      onChange={handleChange}
                      required={paymentForm.method !== "cash"}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                      placeholder="Número de transacción o referencia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                      placeholder="Información adicional sobre el pago"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        submitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="mr-2" />
                          Confirmar Pago
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-6 text-sm text-gray-500">
                <p className="flex items-center mb-2">
                  <FiAlertCircle className="text-yellow-500 mr-2" />
                  El pago será revisado antes de actualizar el estado del recibo
                </p>
                <p>
                  Al confirmar el pago, declara que los datos proporcionados son correctos y verídicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 