"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import { 
  FiFileText, 
  FiAlertCircle, 
  FiCalendar, 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheck,
  FiInfo
} from "react-icons/fi";
import { 
  fetchAPI, 
  generateReceipts
} from "../../../utils/api";
import Link from "next/link";

// Función para obtener el nombre del mes
const getNombreMes = (mes: number | string): string => {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const mesIndex = parseInt(mes.toString()) - 1;
  return meses[mesIndex] || "";
};

export default function CreateReceiptsPage() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  
  const [formData, setFormData] = useState({
    dueDate: "",
    status: "pending",
    condominiumId: 0,
    month: new Date().getMonth() + 1, // Mes actual por defecto
    year: new Date().getFullYear() // Año actual por defecto
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [expensesSum, setExpensesSum] = useState<number | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  
  // Cargar la suma de los gastos del condominio para facilitar el proceso
  const loadExpensesSum = useCallback(async () => {
    if (!token || !userInfo || !userInfo.condominiumId) return;
    
    try {
      setLoadingExpenses(true);
      
      // Usar el mes y año seleccionados en el formulario
      const month = formData.month;
      const year = formData.year;
      
      console.log(`Consultando gastos para mes=${month}, año=${year}, condominio=${userInfo.condominiumId}`);
      
      try {
        const response = await fetchAPI(`/expenses/sum?condominiumId=${userInfo.condominiumId}&month=${month}&year=${year}`, { token });
        console.log("Respuesta de la API de suma de gastos:", response);
        
        if (response && response.sum !== undefined) {
          setExpensesSum(response.sum);
          console.log(`Suma de gastos obtenida: ${response.sum}`);
        } else {
          console.warn("La API devolvió una respuesta sin suma de gastos");
          setExpensesSum(0);
        }
      } catch (apiError) {
        console.error("Error específico en la API de suma de gastos:", apiError);
        // Intentar una alternativa: obtener todos los gastos y sumarlos manualmente
        try {
          const allExpenses = await fetchAPI(`/expenses/condominium/${userInfo.condominiumId}?month=${month}&year=${year}`, { token });
          
          if (Array.isArray(allExpenses) && allExpenses.length > 0) {
            console.log(`Obtenidos ${allExpenses.length} gastos directamente`);
            
            // Calcular la suma manualmente
            const sum = allExpenses.reduce((total, expense) => {
              const amount = parseFloat(expense.amount);
              return isNaN(amount) ? total : total + amount;
            }, 0);
            
            setExpensesSum(sum);
            console.log(`Suma calculada manualmente: ${sum}`);
          } else {
            console.log("No se encontraron gastos para el período");
            setExpensesSum(0);
          }
        } catch (fallbackError) {
          console.error("Error en el método alternativo:", fallbackError);
          setExpensesSum(0);
        }
      }
    } catch (err) {
      console.error("Error general al cargar la suma de gastos:", err);
      setExpensesSum(0);
    } finally {
      setLoadingExpenses(false);
    }
  }, [token, userInfo, formData.month, formData.year]);

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
      
      // Inicializar el formulario con valores del usuario
      setFormData(prev => ({
        ...prev,
        condominiumId: userInfo.condominiumId || 1 // Default para superadmin
      }));
      
      // Establecer la fecha de vencimiento por defecto (último día del mes actual)
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const formattedDate = lastDayOfMonth.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        dueDate: formattedDate
      }));
      
      // Cargar la suma de gastos
      loadExpensesSum();
    }
  }, [token, userInfo, isLoading, router, loadExpensesSum]);

  useEffect(() => {
    if (token && userInfo && !isLoading) {
      loadExpensesSum();
    }
  }, [formData.month, formData.year, loadExpensesSum]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // Si se cambió el mes o el año, actualizar la fecha de vencimiento
      if (name === 'month' || name === 'year') {
        const year = name === 'year' ? parseInt(value) : prev.year;
        const month = name === 'month' ? parseInt(value) : prev.month;
        // Crear fecha del último día del mes seleccionado
        const lastDay = new Date(year, month, 0);
        newData.dueDate = lastDay.toISOString().split('T')[0];
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dueDate) {
      setError("Por favor, seleccione una fecha de vencimiento");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Verificar si la información de gastos se ha cargado correctamente
      if (expensesSum === null) {
        setError("No se ha podido cargar la información de gastos. Intente nuevamente.");
        setLoading(false);
        return;
      }
      
      // Advertir si no hay gastos, pero permitir continuar
      if (expensesSum <= 0) {
        console.log(`Generando recibos para ${getNombreMes(formData.month)} de ${formData.year} con monto cero.`);
      }
      
      // Ahora verificar si hay propiedades en el condominio
      try {
        const properties = await fetchAPI(`/properties/condominium/${formData.condominiumId}`, { token: token as string });
        
        if (!properties || properties.length === 0) {
          setError("No hay propiedades registradas en este condominio. No se pueden generar recibos.");
          setLoading(false);
          return;
        }
        
        // Verificar si todas las propiedades tienen una alícuota asignada
        console.log("Propiedades recibidas:", properties);
        const propertiesWithoutQuota = properties.filter((p: any) => {
          // Verificar tanto participationQuota como aliquot
          const hasParticipationQuota = p.participationQuota !== undefined && 
                                       p.participationQuota !== null && 
                                       p.participationQuota !== "" &&
                                       !isNaN(parseFloat(p.participationQuota));
                                       
          const hasAliquot = p.aliquot !== undefined && 
                            p.aliquot !== null && 
                            p.aliquot !== "" &&
                            !isNaN(parseFloat(p.aliquot));
                            
          // La propiedad tiene cuota si tiene al menos uno de los dos campos
          return !hasParticipationQuota && !hasAliquot;
        });

        console.log("Propiedades sin alícuota:", propertiesWithoutQuota);
        if (propertiesWithoutQuota.length > 0) {
          setError(`Existen ${propertiesWithoutQuota.length} propiedades sin alícuota asignada. Por favor, asigne las alícuotas antes de generar los recibos.`);
          setLoading(false);
          return;
        }
        
        // Verificar si la suma de las alícuotas es igual a 100%
        const totalQuota = properties.reduce((sum: number, property: any) => {
          // Intentar usar participationQuota primero, y si no existe, usar aliquot
          let quota = 0;
          
          if (property.participationQuota !== undefined && 
              property.participationQuota !== null && 
              property.participationQuota !== "") {
            quota = parseFloat(property.participationQuota);
          } else if (property.aliquot !== undefined && 
                     property.aliquot !== null && 
                     property.aliquot !== "") {
            quota = parseFloat(property.aliquot);
          }
          
          return sum + (isNaN(quota) ? 0 : quota);
        }, 0);

        console.log("Suma total de alícuotas:", totalQuota);

        // Permitir un pequeño margen de error (0.01) debido a posibles redondeos
        if (Math.abs(totalQuota - 100) > 0.01) {
          setError(`La suma de las alícuotas (${totalQuota.toFixed(2)}%) no es igual a 100%. Ajuste las alícuotas de las propiedades.`);
          setLoading(false);
          return;
        }
      } catch (propError) {
        console.error("Error al verificar propiedades:", propError);
        setError("No se pudieron verificar las propiedades del condominio.");
        setLoading(false);
        return;
      }
      
      // Si pasamos todas las verificaciones, procedemos a generar los recibos
      try {
        const response = await fetchAPI('/receipts', { 
          method: 'POST',
          body: {
            dueDate: formData.dueDate,
            condominiumId: formData.condominiumId,
            status: formData.status,
            month: parseInt(formData.month.toString()),
            year: parseInt(formData.year.toString())
          },
          token: token as string
        });
        
        if (response && response.receipts) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/receipt/management");
          }, 2000);
        } else {
          setError("La respuesta del servidor no incluye información sobre los recibos generados.");
        }
      } catch (apiError) {
        console.error("Error en la llamada a la API:", apiError);
        if (apiError instanceof Error) {
          // Verificar mensajes de error específicos
          if (apiError.message.includes("No se encontraron gastos")) {
            setError("No hay gastos registrados para el mes actual. No se pueden generar recibos.");
          } else if (apiError.message.includes("alícuotas")) {
            setError("Existe un problema con las alícuotas de las propiedades. Verifique que sumen 100%.");
          } else if (apiError.message.includes("sintaxis de entrada no es válida")) {
            setError("Error en la configuración de propiedades. Contacte al administrador del sistema.");
          } else if (apiError.message.includes("Ya existen recibos generados")) {
            setError(apiError.message);
          } else {
            setError(apiError.message);
          }
        } else {
          setError("Error al generar los recibos. Intente de nuevo más tarde.");
        }
      }
    } catch (err) {
      console.error("Error general:", err);
      setError(err instanceof Error ? err.message : "Error al generar los recibos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link href="/receipt/management" className="flex items-center text-blue-600 mb-4">
          <FiArrowLeft className="mr-2" /> Volver a Gestión de Recibos
        </Link>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 flex items-center">
            <FiFileText className="mr-2" /> Generar Recibos
          </h1>
          
          {success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center mb-4">
              <FiCheck className="mr-2" /> ¡Recibos generados correctamente! Redirigiendo...
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex flex-col items-start mb-4">
                  <div className="flex items-start w-full">
                    <FiAlertCircle className="mr-2 mt-1 flex-shrink-0" /> 
                    <span>{error}</span>
                  </div>
                  
                  {error.includes("alícuota") && (
                    <div className="mt-3 w-full">
                      <Link 
                        href="/property"
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Ir a gestión de propiedades para editar alícuotas
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h2 className="text-lg font-semibold mb-2 flex items-center text-blue-700">
                  <FiInfo className="mr-2" /> Información sobre los recibos
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                  <li>Los recibos se generan automáticamente para todas las propiedades con estado "Ocupado" del condominio.</li>
                  <li>El monto de cada recibo se calcula basado en los gastos del mes seleccionado y la alícuota de cada propiedad.</li>
                  <li>Puede seleccionar el mes y año para el cual desea generar los recibos.</li>
                  <li>Si no hay gastos registrados para el mes seleccionado, se le preguntará si desea generar recibos con monto cero.</li>
                  <li>Los recibos generados tendrán el estado inicial que seleccione (por defecto "Pendiente").</li>
                  <li>Se requiere que todas las propiedades tengan una alícuota asignada y que la suma sea exactamente 100%.</li>
                  <li>Solo se generan recibos para propietarios con cuenta de usuario registrada en el sistema.</li>
                  <li><strong>Importante:</strong> Los recibos se generan únicamente para propiedades cuyos propietarios (owners) pertenecen al mismo condominio seleccionado y tienen usuario activo.</li>
                </ul>
                
                {loadingExpenses ? (
                  <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                    <p className="font-semibold flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando gastos...
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                    <p className="font-semibold flex items-center">
                      <FiDollarSign className="mr-1" /> 
                      Total de gastos para {getNombreMes(formData.month)} de {formData.year}: 
                      <span className={`ml-2 ${(expensesSum || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${expensesSum !== null ? expensesSum.toFixed(2) : '0.00'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="month">
                      <FiCalendar className="mr-2" /> Mes para facturar
                    </label>
                    <select
                      id="month"
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                      value={formData.year}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="dueDate">
                    <FiCalendar className="mr-2" /> Fecha de Vencimiento
                  </label>
                  <div className="space-y-2">
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md flex items-start">
                      <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        Está generando recibos para <strong>{getNombreMes(formData.month)} {formData.year}</strong>. 
                        Se recomienda establecer la fecha de vencimiento dentro de este mes para mantener la consistencia.
                      </span>
                    </div>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                    Estado Inicial
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="partial">Pago Parcial</option>
                    <option value="overdue">Vencido</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generando Recibos...
                      </>
                    ) : (
                      <>
                        <FiFileText className="mr-2" /> Generar Recibos
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 