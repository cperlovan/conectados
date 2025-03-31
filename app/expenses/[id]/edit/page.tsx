"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface Supplier {
  id: number;
  name: string;
  email: string;
}

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
}

interface FormData {
  type: "common" | "especial";
  amount: string;
  description: string;
  date: string;
  supplierId: string;
  status: "active" | "inactive";
}

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [expenseId, setExpenseId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: "common",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    supplierId: "",
    status: "active",
  });

  // Extraer el id solo una vez al montar el componente
  useEffect(() => {
    // Usamos un valor intermedio para evitar acceder directamente a params.id
    const id = params?.id;
    if (id) {
      setExpenseId(id);
    }
  }, []); // Solo ejecutar al montar el componente

  // Definir las funciones antes de usarlas
  const fetchExpenseFromList = async () => {
    try {
      if (!token || !userInfo?.condominiumId || !expenseId) return false;
      
      console.log("Intentando obtener el gasto desde la lista de todos los gastos");
      
      const response = await fetch(`http://localhost:3040/api/expenses/condominium/${userInfo.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Error al obtener lista de gastos: ${response.status}`);
        return false;
      }

      const expenses = await response.json();
      const targetExpense = expenses.find((exp: Expense) => exp.id === parseInt(expenseId));
      
      if (!targetExpense) {
        console.log(`Gasto con ID ${expenseId} no encontrado en la lista de gastos del condominio`);
        return false;
      }
      
      console.log("Gasto encontrado en la lista:", targetExpense);
      setExpense(targetExpense);
      
      // Convertir la fecha al formato correcto (YYYY-MM-DD)
      const dateString = new Date(targetExpense.date).toISOString().split('T')[0];
      
      setFormData({
        type: targetExpense.type,
        amount: targetExpense.amount.toString(),
        description: targetExpense.description,
        date: dateString,
        supplierId: targetExpense.supplierId.toString(),
        status: targetExpense.status,
      });
      
      return true;
    } catch (err) {
      console.error("Error al obtener gastos desde la lista:", err);
      return false;
    }
  };

  const fetchExpense = async () => {
    try {
      if (!token || !expenseId) return;
      
      console.log(`Intentando obtener el gasto con ID: ${expenseId}`);
      
      const response = await fetch(`http://localhost:3040/api/expenses/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        setError(`No se encontró el gasto con ID: ${expenseId}. Es posible que haya sido eliminado o que no exista.`);
        throw new Error(`Gasto con ID ${expenseId} no encontrado`);
      }
      
      if (!response.ok) {
        throw new Error(`Error al obtener el gasto: ${response.status}`);
      }

      const data = await response.json();
      console.log("Datos del gasto obtenidos:", data);
      
      setExpense(data);
      
      // Convertir la fecha al formato correcto (YYYY-MM-DD)
      const dateString = new Date(data.date).toISOString().split('T')[0];
      
      setFormData({
        type: data.type,
        amount: data.amount.toString(),
        description: data.description,
        date: dateString,
        supplierId: data.supplierId.toString(),
        status: data.status,
      });
    } catch (err) {
      console.error("Error al cargar el gasto:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el gasto. Por favor, intenta de nuevo.");
      throw err;
    }
  };

  const fetchSuppliers = async () => {
    try {
      if (!token || !userInfo?.condominiumId) return;
      
      const response = await fetch(`http://localhost:3040/api/suppliers/condominium/${userInfo.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener los proveedores: ${response.status}`);
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      console.error("Error al cargar los proveedores:", err);
      setError("Error al cargar los proveedores. Por favor, intenta de nuevo.");
      throw err;
    }
  };

  // Efecto para verificar autenticación y cargar datos
  useEffect(() => {
    if (tokenLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (!expenseId) return;

    if (userInfo?.role !== 'admin' && userInfo?.role !== 'superadmin') {
      router.push("/unauthorized");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primero intentamos cargar los proveedores
        await fetchSuppliers();
        
        // Intentamos obtener el gasto desde la lista primero (método más confiable)
        const foundInList = await fetchExpenseFromList();
        
        // Solo si no se encuentra en la lista, intentamos el método directo
        if (!foundInList) {
          try {
            await fetchExpense();
          } catch (expenseError) {
            // Si ambos métodos fallan, mostramos un error claro
            throw new Error("No se pudo encontrar el gasto solicitado. Es posible que haya sido eliminado o que no exista en la base de datos.");
          }
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, tokenLoading, expenseId, userInfo, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (!expenseId) {
        throw new Error("ID del gasto no disponible");
      }

      const payload = {
        ...formData,
        supplierId: parseInt(formData.supplierId),
      };

      const response = await fetch(`http://localhost:3040/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el gasto");
      }

      router.push("/expenses");
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el gasto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Editar Gasto</h1>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
              </div>
              <p className="mt-4 text-gray-600">Cargando datos del gasto...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error al cargar el gasto</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push("/expenses")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Volver a la lista de gastos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : expense ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de Gasto
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="common">Común</option>
                  <option value="especial">Especial</option>
                </select>
              </div>

              <div>
                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">
                  Proveedor
                </label>
                <select
                  id="supplierId"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Monto
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/expenses")}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No se pudo cargar la información del gasto.</p>
              <button
                onClick={() => router.push("/expenses")}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Volver a la lista de gastos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 