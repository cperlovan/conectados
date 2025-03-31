"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiFileText, FiAlertCircle, FiCheckCircle, FiCalendar, FiDollarSign, FiArrowLeft, FiDownload, FiCreditCard } from "react-icons/fi";
import { fetchAPI, Receipt } from "../../utils/api";

export default function ReceiptDetail() {
  const params = useParams();
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<any | null>(null);

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchReceipt = async () => {
      if (isLoading) return;
      if (!token) return;

      try {
        const receiptId = params.id;
        if (!receiptId) {
          throw new Error("ID de recibo no proporcionado");
        }

        // Usar la ruta directa para obtener un recibo específico por ID
        const receiptData = await fetchAPI(`/receipts/${receiptId}`, { token });
        setReceipt(receiptData);

        // Intentar obtener el pago asociado al recibo
        try {
          const paymentData = await fetchAPI(`/payments/receipt/${receiptId}`, { token });
          if (Array.isArray(paymentData) && paymentData.length > 0) {
            setPayment(paymentData[0]); // Tomamos el primer pago asociado
          }
        } catch (paymentError) {
          console.error("Error al obtener el pago:", paymentError);
          // No establecemos error aquí porque el recibo puede no tener un pago asociado
        }
      } catch (err) {
        console.error("Error al cargar el recibo:", err);
        setError(err instanceof Error ? err.message : "Error al cargar el recibo");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [token, userInfo, router, isLoading, params.id]);

  const getStatusBadge = (status?: string) => {
    if (!status) return (
      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center">
        <FiAlertCircle className="mr-2" />
        Pendiente
      </span>
    );
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center">
            <FiCheckCircle className="mr-2" />
            Pagado
          </span>
        );
      case 'pending':
      case 'pendiente':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center">
            <FiAlertCircle className="mr-2" />
            Pendiente
          </span>
        );
      case 'overdue':
      case 'vencido':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm flex items-center">
            <FiAlertCircle className="mr-2" />
            Vencido
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm flex items-center">
            {status}
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
            <p className="text-gray-600">Cargando detalles del recibo...</p>
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
            Volver a recibos
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FiFileText className="mr-2 text-blue-600" />
                  Recibo #{receipt.id}
                </h1>
                <p className="text-gray-600 mt-1">
                  Período: {receipt.month || 'N/A'} {receipt.year || 'N/A'}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                {getStatusBadge(receipt.status)}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Detalles del Recibo</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Propiedad:</span>
                    <span className="font-medium text-gray-800">
                      {receipt.property ? (
                        <>
                          {receipt.property.type && `${receipt.property.type.charAt(0).toUpperCase() + receipt.property.type.slice(1)} - `}
                          {receipt.property.number && `N° ${receipt.property.number}`}
                          {receipt.property.block && ` - Bloque ${receipt.property.block}`}
                          {receipt.property.floor && ` - Piso ${receipt.property.floor}`}
                          {receipt.property.aliquot && ` (${receipt.property.aliquot}%)`}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(receipt.amount || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Fecha de emisión:</span>
                    <span className="font-medium text-gray-800">
                      {receipt.createdAt ? formatDate(receipt.createdAt) : "N/A"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Fecha de vencimiento:</span>
                    <span className={`font-medium ${
                      receipt.dueDate && receipt.status?.toLowerCase() !== 'paid' && 
                      new Date(receipt.dueDate) < new Date()
                      ? 'text-red-600' 
                      : 'text-gray-800'
                    }`}>
                      {receipt.dueDate ? formatDate(receipt.dueDate) : "N/A"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-gray-800">
                      {getStatusBadge(receipt.status)}
                    </span>
                  </div>
                </div>
              </div>

              {payment && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Información de Pago</h2>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center mb-4">
                      <FiCheckCircle className="text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Pago registrado</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-green-100 pb-2">
                        <span className="text-gray-600">Fecha de pago:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(payment.date)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-b border-green-100 pb-2">
                        <span className="text-gray-600">Monto pagado:</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-b border-green-100 pb-2">
                        <span className="text-gray-600">Método de pago:</span>
                        <span className="font-medium text-gray-800">
                          {payment.method}
                        </span>
                      </div>
                      
                      {payment.reference && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Referencia:</span>
                          <span className="font-medium text-gray-800">
                            {payment.reference}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-center md:justify-end space-y-3 md:space-y-0 md:space-x-3">
              <button 
                className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                title="Descargar recibo en PDF"
              >
                <FiDownload className="mr-2" />
                Descargar PDF
              </button>
              
              {receipt.status?.toLowerCase() === 'pending' || receipt.status?.toLowerCase() === 'pendiente' ? (
                <Link
                  href={`/payment/new?receiptId=${receipt.id}`}
                  className="flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  <FiCreditCard className="mr-2" />
                  Realizar pago
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 