"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import { toast } from "react-hot-toast";

interface FormData {
  fullName: string;
  documentId: string;
  documentType: "dni" | "passport" | "foreign_id";
  address: string;
  phone: string;
  mobile: string;
  emergencyContact: string;
  residentType: "resident" | "non_resident";
  occupationStatus: "owner" | "tenant" | "both";
  additionalInfo: {
    vehicles?: Array<{
      type: string;
      brand: string;
      model: string;
      color: string;
      plate: string;
    }>;
    preferences?: {
      notifications?: boolean;
      language?: string;
    };
  };
}

export default function RegisterOwner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const returnTo = searchParams.get('returnTo');
  const { token, userInfo, isLoading } = useToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    documentId: "",
    documentType: "dni",
    address: "",
    phone: "",
    mobile: "",
    emergencyContact: "",
    residentType: "resident",
    occupationStatus: "owner",
    additionalInfo: {
      vehicles: [],
      preferences: {
        notifications: true,
        language: "es"
      }
    }
  });
  
  // Vehículo temporal para el formulario
  const [vehicle, setVehicle] = useState({
    type: "",
    brand: "",
    model: "",
    color: "",
    plate: ""
  });

  // Verificar autenticación
  useEffect(() => {
    // Evitar redirección durante la carga inicial del token
    if (!token && !isLoading) {
      router.push("/login");
    }
  }, [token, router, isLoading]);

  // Cargar datos del usuario si se proporciona un userId en la URL
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userIdParam || !token) return;
      
      try {
        setLoading(true);
        
        // Obtener datos del usuario especificado
        const response = await fetch(`http://localhost:3040/api/users/${userIdParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del usuario: ${response.status}`);
        }
        
        const userData = await response.json();
        setSelectedUser(userData);
        
        // Prellenar el formulario con los datos del usuario
        if (userData.name) {
          setFormData(prev => ({
            ...prev,
            fullName: userData.name
          }));
        }
        
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        setError(error instanceof Error ? error.message : "Error al cargar datos del usuario");
        toast.error(error instanceof Error ? error.message : "Error al cargar datos del usuario");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userIdParam, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicle(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addVehicle = () => {
    // Validar que los campos requeridos del vehículo estén completos
    if (!vehicle.plate || !vehicle.brand || !vehicle.model) {
      toast.error("Complete al menos la placa, marca y modelo del vehículo");
      return;
    }

    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        vehicles: [...(prev.additionalInfo.vehicles || []), { ...vehicle }]
      }
    }));

    // Limpiar formulario de vehículo
    setVehicle({
      type: "",
      brand: "",
      model: "",
      color: "",
      plate: ""
    });
    
    toast.success("Vehículo agregado");
  };

  const removeVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        vehicles: prev.additionalInfo.vehicles?.filter((_, i) => i !== index)
      }
    }));
    toast.success("Vehículo eliminado");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("No hay token disponible");
      }

      // Determinar qué ID de usuario utilizar
      const targetUserId = userIdParam || userInfo?.id;

      if (!targetUserId) {
        throw new Error("ID de usuario no disponible");
      }

      // Validación de datos
      if (!formData.fullName || !formData.documentId || !formData.mobile) {
        throw new Error("Los campos nombre completo, documento y móvil son obligatorios");
      }

      // Datos a enviar al API
      const dataToSend = {
        ...formData,
        userId: parseInt(targetUserId),
        condominiumId: userInfo?.condominiumId
      };

      console.log("Enviando datos al backend:", dataToSend);
      console.log("URL de la petición:", `http://localhost:3040/api/owners/user/${targetUserId}`);
      console.log("Token disponible:", !!token);
      console.log("ID de usuario utilizado:", targetUserId);

      const response = await fetch(`http://localhost:3040/api/owners/user/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      console.log("Respuesta del servidor - Status:", response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("Error del servidor (JSON):", errorData);
          throw new Error(errorData.message || `Error al registrar el propietario: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error("Respuesta del servidor (texto):", errorText);
          throw new Error(`Error al registrar el propietario: ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log("Registro exitoso:", responseData);

      toast.success("Propietario registrado exitosamente");
      
      // Usar setTimeout para asegurar que el toast se muestre antes de la redirección
      setTimeout(() => {
        // Determinar a dónde redirigir basado en el parámetro returnTo
        if (returnTo === 'unregistered-owners') {
          router.push('/owner/unregistered-owners');
        } else {
          router.push('/home');
        }
      }, 1000);
    } catch (error) {
      console.error("Error completo:", error);
      setError(error instanceof Error ? error.message : "Error al registrar el propietario");
      toast.error(error instanceof Error ? error.message : "Error al registrar el propietario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Registro de Propietario
          </h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Personal */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese nombre completo"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                    Tipo de Documento
                  </label>
                  <select
                    id="documentType"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <option value="dni">DNI</option>
                    <option value="passport">Pasaporte</option>
                    <option value="foreign_id">ID Extranjero</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="documentId" className="block text-sm font-medium text-gray-700">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    id="documentId"
                    name="documentId"
                    value={formData.documentId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese número de documento"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese dirección"
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Información de Contacto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono Fijo
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese teléfono fijo"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese teléfono móvil"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese contacto de emergencia"
                  />
                </div>
              </div>
            </div>

            {/* Estado de Residencia */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Estado de Residencia</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="residentType" className="block text-sm font-medium text-gray-700">
                    Tipo de Residente
                  </label>
                  <select
                    id="residentType"
                    name="residentType"
                    value={formData.residentType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <option value="resident">Residente</option>
                    <option value="non_resident">No Residente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="occupationStatus" className="block text-sm font-medium text-gray-700">
                    Estado de Ocupación
                  </label>
                  <select
                    id="occupationStatus"
                    name="occupationStatus"
                    value={formData.occupationStatus}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <option value="owner">Propietario</option>
                    <option value="tenant">Inquilino</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección de vehículos */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Vehículos</h2>
              
              {/* Lista de vehículos agregados */}
              {formData.additionalInfo.vehicles && formData.additionalInfo.vehicles.length > 0 && (
                <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modelo</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Color</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Placa</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.additionalInfo.vehicles.map((v, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.brand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.plate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeVehicle(index)}
                              className="text-red-600 hover:text-red-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Formulario de nuevo vehículo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                    Tipo de Vehículo
                  </label>
                  <input
                    type="text"
                    id="vehicleType"
                    name="type"
                    value={vehicle.type}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ej: Auto, Moto"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="vehicleBrand" className="block text-sm font-medium text-gray-700">
                    Marca
                  </label>
                  <input
                    type="text"
                    id="vehicleBrand"
                    name="brand"
                    value={vehicle.brand}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese marca"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">
                    Modelo
                  </label>
                  <input
                    type="text"
                    id="vehicleModel"
                    name="model"
                    value={vehicle.model}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese modelo"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="vehicleColor" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    type="text"
                    id="vehicleColor"
                    name="color"
                    value={vehicle.color}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese color"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700">
                    Placa
                  </label>
                  <input
                    type="text"
                    id="vehiclePlate"
                    name="plate"
                    value={vehicle.plate}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Ingrese placa"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addVehicle}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Vehículo
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  "Registrar Propietario"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 