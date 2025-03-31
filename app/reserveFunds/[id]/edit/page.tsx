"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface FormData {
  amount: string;
  description: string;
  date: string;
  status: string;
}

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

export default function EditReserveFundPage({ params }: { params: { id: string } }) {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [fundId, setFundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fund, setFund] = useState<ReserveFund | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    amount: "0.00",
    description: "",
    date: new Date().toISOString().split('T')[0],
    status: "active"
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
        await fetchReserveFund();
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
      setLoading(true);
      // Obtener todos los fondos del condominio
      const fundsResponse = await fetch(`http://localhost:3040/api/reserve-funds/condominium/${userInfo?.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!fundsResponse.ok) {
        throw new Error("Error al obtener los fondos de reserva");
      }

      const funds = await fundsResponse.json();
      
      // Encontrar el fondo específico por ID
      const currentFund = funds.find((f: ReserveFund) => f.id === parseInt(fundId || ""));
      
      if (!currentFund) {
        throw new Error("Fondo de reserva no encontrado");
      }

      setFund(currentFund);
      
      // Inicializar el formulario con los datos del fondo
      setFormData({
        description: currentFund.description,
        amount: currentFund.amount,
        date: new Date(currentFund.date).toISOString().split('T')[0],
        status: currentFund.status
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el fondo de reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!fundId) {
        throw new Error("ID del fondo no disponible");
      }

      const response = await fetch(`http://localhost:3040/api/reserve-funds/${fundId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el fondo de reserva");
      }

      router.push("/reserveFunds");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el fondo de reserva");
    } finally {
      setSubmitting(false);
    }
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
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Editar Fondo de Reserva</h1>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">
                Monto Actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Este monto se actualizará automáticamente con las contribuciones al fondo.
              </p>
            </div>

            <div>
              <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
                Fecha de Creación <span className="text-red-500">*</span>
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

            <div>
              <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => router.push("/reserveFunds")}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 