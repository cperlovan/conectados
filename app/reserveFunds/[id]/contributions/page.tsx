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

interface Contribution {
  id: number;
  amount: string;
  date: string;
  description: string;
  observations: string;
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
}

export default function ReserveFundContributionsPage({ params }: { params: { id: string } }) {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [fundId, setFundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fund, setFund] = useState<ReserveFund | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, contributionId: 0 });
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    observations: ""
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
          fetchContributions()
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

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3040/api/reserve-fund-contributions/fund/${fundId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener las contribuciones");
      }

      const data = await response.json();
      setContributions(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar las contribuciones");
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
        throw new Error("No se ha encontrado la información necesaria para crear la contribución");
      }

      const response = await fetch("http://localhost:3040/api/reserve-fund-contributions", {
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
        throw new Error(errorData.message || "Error al crear la contribución");
      }

      // Recargar contribuciones y fondo
      await fetchContributions();
      await fetchReserveFund();
      
      // Resetear formulario
      setFormData({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        observations: ""
      });
      
      setShowForm(false);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al crear la contribución");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/reserve-fund-contributions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la contribución");
      }

      // Recargar contribuciones y fondo
      await fetchContributions();
      await fetchReserveFund();
      
      setConfirmDialog({ visible: false, contributionId: 0 });
    } catch (err) {
      console.error("Error:", err);
      setError("Error al eliminar la contribución");
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
      <div className="container mx-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Contribuciones al Fondo de Reserva
            </h1>
            <div className="flex space-x-2">
              <Link 
                href={`/reserveFunds/${fundId}/withdrawals`}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Ver Retiros
              </Link>
              <Link 
                href={`/reserveFunds/${fundId}/edit`}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Editar Fondo
              </Link>
            </div>
          </div>
          {/* Encabezado y resumen del fondo */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.push("/reserveFunds")}
                className="text-gray-600 hover:text-gray-800 mr-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">Contribuciones al Fondo de Reserva</h1>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">{fund.description}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(fund.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-medium">{formatDate(fund.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      fund.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {fund.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>{error}</p>
              </div>
            )}

            {/* Botón para agregar una nueva contribución */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300 flex items-center"
              >
                {showForm ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Cancelar
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agregar Contribución
                  </>
                )}
              </button>
            </div>

            {/* Formulario para agregar contribución */}
            {showForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold mb-4">Nueva Contribución</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">
                        Monto <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">$</span>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          step="0.01"
                          min="0.01"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-gray-700 font-medium mb-1">
                        Fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="observations" className="block text-gray-700 font-medium mb-1">
                      Observaciones
                    </label>
                    <textarea
                      id="observations"
                      name="observations"
                      rows={2}
                      value={formData.observations}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submitting ? "Guardando..." : "Guardar Contribución"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de contribuciones */}
            <h3 className="text-xl font-semibold mb-4">Historial de Contribuciones</h3>
            
            {loading ? (
              <div className="text-center py-4">Cargando contribuciones...</div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No hay contribuciones registradas para este fondo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Descripción</th>
                      <th className="py-3 px-4 text-left">Monto</th>
                      <th className="py-3 px-4 text-left">Fecha</th>
                      <th className="py-3 px-4 text-left">Observaciones</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((contribution) => (
                      <tr key={contribution.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{contribution.description}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(contribution.amount)}</td>
                        <td className="py-3 px-4">{formatDate(contribution.date)}</td>
                        <td className="py-3 px-4 text-gray-600">{contribution.observations || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setConfirmDialog({ visible: true, contributionId: contribution.id })}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
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
              ¿Estás seguro de que deseas eliminar esta contribución? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDialog({ visible: false, contributionId: 0 })}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDialog.contributionId)}
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