"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToken } from "../../hook/useToken";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";

interface Property {
  id: number;
  number: string;
  type: string;
  status: string;
  aliquot: number | null;
  participationQuota: string | null;
  block?: string;
  floor?: string | null;
  condominiumId: number;
  ownerId: number | null;
  additionalInfo?: any;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id?: number;
    userId?: number;
    fullName?: string;
    documentId?: string;
    documentType?: string;
    user?: {
      id?: number;
      name?: string | null;
      email?: string;
    }
  } | null;
}

const AssignQuotasPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [totalQuota, setTotalQuota] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Obtener el token de las cookies
  const { token, isLoading: tokenLoading, userInfo } = useToken();

  // Cargar las propiedades cuando se carga la página
  useEffect(() => {
    if (!tokenLoading) {
      if (!token) {
        setError("No estás autenticado. Por favor, inicia sesión para continuar.");
        setLoading(false);
        router.push("/login");
        return;
      }
      
      if (!userInfo) {
        setError("No se pudo verificar la información del usuario. Por favor, vuelve a iniciar sesión.");
        setLoading(false);
        router.push("/login");
        return;
      }
      
      fetchProperties();
    }
  }, [token, tokenLoading, userInfo, router]);

  // Calcular el total de alícuotas cuando cambien las propiedades
  useEffect(() => {
    calculateTotalQuota();
  }, [properties]);

  const fetchProperties = async () => {
    try {
      if (!token) {
        console.log("No hay token disponible para fetchProperties");
        setError("No estás autenticado. Por favor, inicia sesión para continuar.");
        router.push("/login");
        return;
      }
      
      setLoading(true);
      
      // Usar la ruta correcta para obtener propiedades por condominio
      const condominiumId = userInfo?.condominiumId || 1;
      console.log("Obteniendo propiedades para el condominio:", condominiumId);

      const response = await axios.get(`http://localhost:3040/api/properties/condominium/${condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (response.status === 200) {
        const data = response.data;
        console.log(`Propiedades cargadas: ${data.length}`);
        
        // Convertir las alícuotas a números para facilitar los cálculos
        const propertiesWithParsedValues = data.map((prop: Property) => {
          // Priorizar participationQuota, pero si no existe usar aliquot
          let quotaValue = null;
          if (prop.participationQuota !== null && prop.participationQuota !== undefined) {
            quotaValue = prop.participationQuota;
          } else if (prop.aliquot !== null && prop.aliquot !== undefined) {
            quotaValue = String(prop.aliquot);
          }
          
          return {
            ...prop,
            participationQuota: quotaValue
          };
        });
        
        setProperties(propertiesWithParsedValues);
        setLoading(false);
      } else {
        console.error("Error al cargar propiedades:", response.statusText);
        setError(`Error al cargar propiedades: ${response.statusText}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error completo:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401) {
            setError("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            router.push("/login");
          } else if (status === 403) {
            setError("No tienes permisos suficientes para ver las propiedades.");
          } else {
            setError(`Error al cargar las propiedades: ${error.response.data?.message || error.message}`);
          }
        } else {
          setError(`Error de conexión: ${error.message}`);
        }
      } else {
        setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      }
      
      setLoading(false);
    }
  };

  const calculateTotalQuota = () => {
    const total = properties.reduce((sum, property) => {
      const quota = property.participationQuota ? parseFloat(property.participationQuota) : 0;
      return sum + (isNaN(quota) ? 0 : quota);
    }, 0);
    
    setTotalQuota(Number(total.toFixed(2)));
  };

  const handleQuotaChange = (id: number, value: string) => {
    // Convertir a número y validar
    let numValue = value === "" ? null : parseFloat(value);
    
    // Si no es un número válido, establecer como null
    if (numValue !== null && isNaN(numValue)) {
      numValue = null;
    }
    
    setProperties(prevProperties => 
      prevProperties.map(property => 
        property.id === id 
          ? { ...property, participationQuota: numValue !== null ? String(numValue) : null } 
          : property
      )
    );
  };

  const handleDistributeEqual = () => {
    const propertiesCount = properties.length;
    if (propertiesCount === 0) return;
    
    const equalValue = (100 / propertiesCount).toFixed(2);
    
    setProperties(prevProperties => 
      prevProperties.map(property => ({ 
        ...property, 
        participationQuota: equalValue
      }))
    );
  };

  const handleReset = () => {
    setProperties(prevProperties => 
      prevProperties.map(property => ({ 
        ...property, 
        participationQuota: null
      }))
    );
  };

  const handleSubmit = async () => {
    try {
      // Validar que el total sea cercano a 100%
      if (Math.abs(totalQuota - 100) > 0.1) {
        setError(`La suma total de alícuotas debe ser 100%. Actualmente es ${totalQuota}%.`);
        return;
      }
      
      setIsSubmitting(true);
      setError("");
      
      // Preparar las propiedades a actualizar
      const updates = properties.map(property => ({
        id: property.id,
        participationQuota: property.participationQuota,
        aliquot: property.participationQuota // Actualizar también el campo aliquot para mantener consistencia
      }));
      
      const condominiumId = userInfo?.condominiumId || 1;
      
      // Enviar actualizaciones al servidor
      const response = await axios.put(
        `http://localhost:3040/api/properties/quotas/batch`, 
        { 
          properties: updates,
          condominiumId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.status === 200) {
        setSuccess("Las alícuotas han sido actualizadas correctamente.");
        
        // Recargar propiedades para mostrar los valores actualizados
        await fetchProperties();
      } else {
        setError("Hubo un problema al actualizar las alícuotas.");
      }
    } catch (error) {
      console.error("Error al guardar alícuotas:", error);
      
      if (axios.isAxiosError(error)) {
        setError(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Asignación de Alícuotas</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              type="button" 
              className="absolute top-0 right-0 px-4 py-3" 
              onClick={() => setError("")}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{success}</span>
            <button 
              type="button" 
              className="absolute top-0 right-0 px-4 py-3" 
              onClick={() => setSuccess("")}
            >
              <span className="text-green-500">×</span>
            </button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Total de Alícuotas: {totalQuota}%</h2>
              <div className={`ml-4 h-2 w-24 rounded-full ${
                Math.abs(totalQuota - 100) < 0.1 
                  ? 'bg-green-500' 
                  : totalQuota < 100 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}></div>
            </div>
            <p className="text-gray-600 mb-4">
              La suma de todas las alícuotas debe ser exactamente 100%.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDistributeEqual}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Distribuir Equitativamente
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reiniciar Valores
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Math.abs(totalQuota - 100) > 0.1}
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 ${
                  isSubmitting || Math.abs(totalQuota - 100) > 0.1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Alícuotas'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alícuota (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Cargando propiedades...
                    </td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No hay propiedades disponibles
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {property.block && `${property.block} - `}{property.number}
                        </div>
                        {property.floor && (
                          <div className="text-sm text-gray-500">
                            Piso {property.floor}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {property.owner?.fullName || property.owner?.user?.name || "Sin propietario"}
                        </div>
                        {property.owner?.user?.email && (
                          <div className="text-sm text-gray-500">
                            {property.owner.user.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{property.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={property.participationQuota || ""}
                          onChange={(e) => handleQuotaChange(property.id, e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Botón para volver a la generación de recibos */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/receipt/management/create')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Volver a Generación de Recibos
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignQuotasPage; 