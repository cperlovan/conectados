"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";
import Header from "../components/Header";
import Link from "next/link";
import { FiFilter, FiCalendar, FiDollarSign, FiRefreshCw } from "react-icons/fi";

interface Expense {
  id: number;
  type: "common" | "especial";
  amount: string;
  description: string;
  date: string;
  supplierId: number;
  condominiumId: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  Supplier?: {
    id: number;
    name: string;
  };
}

const getNombreMes = (mes: number | string): string => {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const mesIndex = parseInt(mes.toString()) - 1;
  return meses[mesIndex] || "";
};

export default function ExpensesPage() {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, expenseId: 0 });
  const [totalAmount, setTotalAmount] = useState(0);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    showAll: false
  });

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

    fetchExpenses();
  }, [token, userInfo, tokenLoading, router]);

  const fetchExpenses = async () => {
    if (!userInfo?.condominiumId) return;
    
    try {
      setLoading(true);
      let url = `http://localhost:3040/api/expenses/condominium/${userInfo.condominiumId}`;
      
      if (!filters.showAll) {
        url += `?month=${filters.month}&year=${filters.year}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener los gastos");
      }

      const data = await response.json();
      console.log("Gastos recibidos:", data);
      if (data && data.length > 0) {
        console.log("Estructura del primer gasto:", data[0]);
        console.log("Fecha del primer gasto:", data[0].date);
      }
      setExpenses(data);
      
      const total = data
        .filter((expense: Expense) => expense.status === 'active')
        .reduce((sum: number, expense: Expense) => sum + parseFloat(expense.amount), 0);
      setTotalAmount(total);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userInfo && !tokenLoading) {
      fetchExpenses();
    }
  }, [filters, token, userInfo]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFilters(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3040/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el gasto");
      }

      fetchExpenses();
      setConfirmDialog({ visible: false, expenseId: 0 });
    } catch (err) {
      console.error("Error:", err);
      setError("Error al eliminar el gasto");
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
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Gastos Comunes</h1>
              <p className="text-gray-500">
                {filters.showAll 
                  ? "Total de gastos activos: " 
                  : `Total de gastos activos (${getNombreMes(filters.month)} ${filters.year}): `} 
                <span className="font-semibold text-red-600">{formatCurrency(totalAmount.toString())}</span>
              </p>
            </div>
            <button
              onClick={() => router.push("/expenses/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Registrar Nuevo Gasto
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-700">
              <FiFilter className="mr-2" /> Filtros
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="month">
                  <FiCalendar className="mr-2" /> Mes
                </label>
                <select
                  id="month"
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  disabled={filters.showAll}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    filters.showAll ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
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
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="year">
                  <FiCalendar className="mr-2" /> Año
                </label>
                <select
                  id="year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  disabled={filters.showAll}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    filters.showAll ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center mt-5">
                  <input
                    id="showAll"
                    name="showAll"
                    type="checkbox"
                    checked={filters.showAll}
                    onChange={handleFilterChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showAll" className="ml-2 block text-sm text-gray-700">
                    Mostrar todos los gastos
                  </label>
                </div>
                
                <button
                  onClick={fetchExpenses}
                  className="ml-4 bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center hover:bg-gray-300 transition duration-200"
                  title="Actualizar"
                >
                  <FiRefreshCw className="mr-1" /> Actualizar
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Cargando gastos...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">{error}</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg text-gray-600 mb-2">No hay gastos registrados{!filters.showAll ? ` para ${getNombreMes(filters.month)} de ${filters.year}` : ''}.</p>
              <p className="text-sm text-gray-500">Intente con otro filtro o registre un nuevo gasto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Descripción</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                    <th className="py-3 px-4 text-left">Monto</th>
                    <th className="py-3 px-4 text-left">Fecha</th>
                    <th className="py-3 px-4 text-left">Proveedor</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4">
                        {expense.type === "common" ? "Común" : "Especial"}
                      </td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(expense.amount)}</td>
                      <td className="py-3 px-4">{formatDate(expense.date)}</td>
                      <td className="py-3 px-4">{expense.Supplier?.name || "Desconocido"}</td>
                      <td className="py-3 px-4">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            expense.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {expense.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDialog({ visible: true, expenseId: expense.id })}
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

      {confirmDialog.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">
              ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDialog({ visible: false, expenseId: 0 })}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDialog.expenseId)}
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