"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import Link from "next/link";

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

interface Withdrawal {
  id: number;
  amount: string;
  date: string;
  description: string;
  observations: string;
  reason: string;
  approvedBy: string;
  documentReference: string;
  status: string;
  reserveFundId: number;
  condominiumId: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  amount: string;
  date: string;
  description: string;
  observations: string;
  reason: string;
  approvedBy: string;
  documentReference: string;
}

export default function ReserveFundWithdrawalsPage({ params }: { params: { id: string } }) {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [fundId, setFundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fund, setFund] = useState<ReserveFund | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, withdrawalId: 0 });
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    observations: "",
    reason: "",
    approvedBy: "",
    documentReference: ""
  });

  useEffect(() => {
    const id = params?.id;
    if (id) {
      setFundId(id);
    }
  }, []);

  useEffect(() => {
    if (tokenLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (!fundId) return;

    if (userInfo?.role !== 'admin' && userInfo?.role !== 'superadmin') {
      router.push("/unauthorized");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([
          fetchReserveFund(),
          fetchWithdrawals()
        ]);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, tokenLoading, fundId, userInfo, router]);

  const fetchReserveFund = async () => {
    try {
      // Obtener todos los fondos del condominio y filtrar por ID
      const response = await fetch(`http://localhost:3040/api/reserve-funds/condominium/${userInfo?.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener el fondo de reserva");
      }

      const funds = await response.json();
      const currentFund = funds.find((f: ReserveFund) => f.id === parseInt(fundId || ""));
      
      if (!currentFund) {
        throw new Error("Fondo de reserva no encontrado");
      }

      setFund(currentFund);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el fondo de reserva");
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3040/api/reserve-fund-withdrawals/fund/${fundId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener los retiros");
      }

      const data = await response.json();
      setWithdrawals(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar los retiros");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!userInfo?.condominiumId || !fundId) {
        throw new Error("No se ha encontrado la información necesaria para crear el retiro");
      }

      const response = await fetch("http://localhost:3040/api/reserve-fund-withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          reserveFundId: parseInt(fundId),
          condominiumId: userInfo.condominiumId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el retiro");
      }

      // Recargar retiros y fondo
      await fetchWithdrawals();
      await fetchReserveFund();
      
      // Resetear formulario
      setFormData({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        observations: "",
        reason: "",
        approvedBy: "",
        documentReference: ""
      });
      
      setShowForm(false);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al crear el retiro");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/reserve-fund-withdrawals/${id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cancelar el retiro");
      }

      // Recargar retiros y fondo
      await fetchWithdrawals();
      await fetchReserveFund();
      
      setConfirmDialog({ visible: false, withdrawalId: 0 });
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cancelar el retiro");
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

  if (tokenLoading || loading) {
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

  if (!fund) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl font-semibold text-red-600">
              {error || "Fondo de reserva no encontrado"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Retiros del Fondo de Reserva
          </h1>
          <div className="flex space-x-2">
            <Link 
              href={`/reserveFunds/${fundId}/contributions`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Ver Contribuciones
            </Link>
            <Link 
              href={`/reserveFunds/${fundId}/edit`}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Editar Fondo
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detalles del Fondo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 mb-1">Descripción:</p>
              <p className="font-medium">{fund.description}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Fecha de creación:</p>
              <p className="font-medium">{formatDate(fund.date)}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Saldo actual:</p>
              <p className="font-medium text-xl text-green-600">{formatCurrency(fund.amount)}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Estado:</p>
              <p className="font-medium">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  fund.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {fund.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            {showForm ? "Cancelar" : "Realizar Retiro"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Nuevo Retiro</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="description">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="amount">
                    Monto
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="date">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="reason">
                    Motivo del retiro
                  </label>
                  <input
                    type="text"
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="approvedBy">
                    Aprobado por
                  </label>
                  <input
                    type="text"
                    id="approvedBy"
                    name="approvedBy"
                    value={formData.approvedBy}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="documentReference">
                    Referencia de documento
                  </label>
                  <input
                    type="text"
                    id="documentReference"
                    name="documentReference"
                    value={formData.documentReference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4 md:col-span-2">
                  <label className="block text-gray-700 mb-2" htmlFor="observations">
                    Observaciones
                  </label>
                  <textarea
                    id="observations"
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 transition"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  disabled={submitting}
                >
                  {submitting ? "Procesando..." : "Guardar Retiro"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Histórico de Retiros</h2>
          
          {withdrawals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay retiros registrados para este fondo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(withdrawal.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatCurrency(withdrawal.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {withdrawal.status === 'completed' && (
                          <button
                            onClick={() => setConfirmDialog({ visible: true, withdrawalId: withdrawal.id })}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {confirmDialog.visible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirmar Cancelación</h3>
              <p className="mb-6">¿Está seguro que desea cancelar este retiro? Esta acción devolverá el monto al saldo del fondo.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDialog({ visible: false, withdrawalId: 0 })}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  No, Cancelar
                </button>
                <button
                  onClick={() => handleCancel(confirmDialog.withdrawalId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Sí, Cancelar Retiro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 