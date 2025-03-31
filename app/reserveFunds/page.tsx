"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";
import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";

interface ReserveFund {
  id: number;
  amount: string;
  description: string;
  date: string;
  status: string;
  condominiumId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ReserveFundsPage() {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [funds, setFunds] = useState<ReserveFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, fundId: 0 });

  useEffect(() => {
    if (tokenLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (userInfo?.role !== 'admin' && userInfo?.role !== 'superadmin') {
      router.push("/unauthorized");
      return;
    }

    fetchReserveFunds();
  }, [token, userInfo, tokenLoading, router]);

  const fetchReserveFunds = async () => {
    if (!userInfo?.condominiumId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3040/api/reserve-funds/condominium/${userInfo.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener los fondos de reserva");
      }

      const data = await response.json();
      setFunds(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar los fondos de reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/reserve-funds/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el fondo de reserva");
      }

      // Recargar los fondos de reserva
      fetchReserveFunds();
      setConfirmDialog({ visible: false, fundId: 0 });
    } catch (err) {
      console.error("Error:", err);
      setError("Error al eliminar el fondo de reserva");
    }
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl font-semibold">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        {/* <Sidebar /> */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Fondos de Reserva</h1>
              <button
                onClick={() => router.push("/reserveFunds/create")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Crear Nuevo Fondo de Reserva
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">Cargando fondos de reserva...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-4">{error}</div>
            ) : funds.length === 0 ? (
              <div className="text-center py-4">
                No hay fondos de reserva registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Descripción</th>
                      <th className="py-3 px-4 text-left">Monto</th>
                      <th className="py-3 px-4 text-left">Fecha de Creación</th>
                      <th className="py-3 px-4 text-left">Estado</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((fund) => (
                      <tr key={fund.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{fund.description}</td>
                        <td className="py-3 px-4">{formatCurrency(fund.amount)}</td>
                        <td className="py-3 px-4">{formatDate(fund.date)}</td>
                        <td className="py-3 px-4">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs ${
                              fund.status === "active" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {fund.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => router.push(`/reserveFunds/${fund.id}/contributions`)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                              title="Ver Contribuciones"
                            >
                              Contribuciones
                            </button>
                            <button
                              onClick={() => router.push(`/reserveFunds/${fund.id}/withdrawals`)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                              title="Ver Retiros"
                            >
                              Retiros
                            </button>
                            <button
                              onClick={() => router.push(`/reserveFunds/${fund.id}/edit`)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ visible: true, fundId: fund.id })}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                              title="Eliminar"
                            >
                              Eliminar
                            </button>
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

      {/* Diálogo de confirmación para eliminar */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">
              ¿Estás seguro de que deseas eliminar este fondo de reserva? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDialog({ visible: false, fundId: 0 })}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDialog.fundId)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
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