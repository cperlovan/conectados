"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";

interface Owner {
  id: number;
  fullName: string;
  documentId: string;
  documentType: string;
  address: string;
  phone: string;
  mobile: string;
  emergencyContact: string;
  residentType: string;
  occupationStatus: string;
  status: string;
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
  user: {
    id: number;
    email: string;
  };
  properties?: Array<{
    id: number;
    name: string;
    type: string;
  }>;
}

export default function OwnerProfile() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchOwnerProfile = async () => {
      try {
        if (isLoading) return;
        
        if (!userInfo?.id) {
          throw new Error("ID de usuario no encontrado");
        }

        // Primera petición para obtener el ID del propietario a partir del ID de usuario
        const userResponse = await fetch(`http://localhost:3040/api/owners/user/${userInfo.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          if (userResponse.status === 404) {
            // Si el propietario no existe, redirigir a la página de registro
            router.push("/owner/register");
            return;
          }
          
          if (userResponse.status === 401) {
            router.push("/login");
            return;
          }
          
          throw new Error("Error al cargar el perfil del propietario");
        }

        const userData = await userResponse.json();
        
        // Segunda petición para obtener el propietario completo con sus propiedades
        const ownerResponse = await fetch(`http://localhost:3040/api/owners/${userData.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!ownerResponse.ok) {
          throw new Error("Error al cargar los detalles del propietario");
        }

        const data = await ownerResponse.json();
        console.log("Datos del propietario con propiedades:", data);
        setOwner(data);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError(err instanceof Error ? err.message : "Error al cargar el perfil del propietario");
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerProfile();
  }, [token, userInfo, router, isLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No se encontró información de perfil</p>
            <Link 
              href="/owner/register" 
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Completar Perfil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Información Personal</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nombre Completo</p>
                      <p className="text-gray-800 font-medium">{owner.fullName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Documento</p>
                      <p className="text-gray-800 font-medium">
                        {owner.documentType.toUpperCase()}: {owner.documentId}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Correo Electrónico</p>
                      <p className="text-gray-800 font-medium">{owner.user?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-gray-800 font-medium">{owner.address || "No especificada"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-gray-800 font-medium">{owner.phone || "No especificado"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Móvil</p>
                      <p className="text-gray-800 font-medium">{owner.mobile}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Contacto de Emergencia</p>
                      <p className="text-gray-800 font-medium">{owner.emergencyContact || "No especificado"}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Información de Residencia</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Residente</p>
                      <p className="text-gray-800 font-medium">
                        {owner.residentType === 'resident' ? 'Residente' : 'No Residente'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Estado de Ocupación</p>
                      <p className="text-gray-800 font-medium">
                        {owner.occupationStatus === 'owner' ? 'Propietario' : 
                         owner.occupationStatus === 'tenant' ? 'Inquilino' : 'Propietario e Inquilino'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="text-gray-800 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Propiedades</h2>
                  
                  {!owner.properties || owner.properties.length === 0 ? (
                    <p className="text-gray-500">No hay propiedades registradas</p>
                  ) : (
                    <ul className="space-y-2">
                      {owner.properties.map(property => (
                        <li key={property.id} className="p-3 bg-gray-50 rounded-md">
                          <p className="font-medium">{property.name}</p>
                          <p className="text-sm text-gray-500">{property.type}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Vehículos */}
              {owner.additionalInfo?.vehicles && owner.additionalInfo.vehicles.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Vehículos</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marca
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Modelo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Placa
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {owner.additionalInfo.vehicles.map((vehicle, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.type || "No especificado"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.color || "No especificado"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.plate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex justify-end">
                <Link
                  href={`/owner/${owner.id}/edit`}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Editar Perfil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 