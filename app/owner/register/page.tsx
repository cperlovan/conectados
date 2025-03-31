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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Registro de Propietario</h1>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento
                </label>
                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="dni">DNI</option>
                  <option value="passport">Pasaporte</option>
                  <option value="foreign_id">ID Extranjero</option>
                </select>
              </div>

              <div>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono Fijo
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                  Contacto de Emergencia
                </label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="residentType" className="block text-sm font-medium text-gray-700">
                  Tipo de Residente
                </label>
                <select
                  id="residentType"
                  name="residentType"
                  value={formData.residentType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="resident">Residente</option>
                  <option value="non_resident">No Residente</option>
                </select>
              </div>

              <div>
                <label htmlFor="occupationStatus" className="block text-sm font-medium text-gray-700">
                  Estado de Ocupación
                </label>
                <select
                  id="occupationStatus"
                  name="occupationStatus"
                  value={formData.occupationStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="owner">Propietario</option>
                  <option value="tenant">Inquilino</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
            </div>

            {/* Sección de vehículos */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Vehículos</h2>
              
              {/* Lista de vehículos agregados */}
              {formData.additionalInfo.vehicles && formData.additionalInfo.vehicles.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.additionalInfo.vehicles.map((v, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.brand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.plate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeVehicle(index)}
                              className="text-red-600 hover:text-red-900"
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
              
              {/* Formulario para agregar vehículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <input
                    type="text"
                    id="vehicleType"
                    name="type"
                    value={vehicle.type}
                    onChange={handleVehicleChange}
                    placeholder="Carro, Moto..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="vehicleBrand" className="block text-sm font-medium text-gray-700">
                    Marca
                  </label>
                  <input
                    type="text"
                    id="vehicleBrand"
                    name="brand"
                    value={vehicle.brand}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">
                    Modelo
                  </label>
                  <input
                    type="text"
                    id="vehicleModel"
                    name="model"
                    value={vehicle.model}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="vehicleColor" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    type="text"
                    id="vehicleColor"
                    name="color"
                    value={vehicle.color}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700">
                    Placa
                  </label>
                  <input
                    type="text"
                    id="vehiclePlate"
                    name="plate"
                    value={vehicle.plate}
                    onChange={handleVehicleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addVehicle}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Agregar Vehículo
                </button>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 transition-colors w-full"
              >
                {loading ? "Procesando..." : "Registrar Propietario"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-colors"
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