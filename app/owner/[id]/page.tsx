"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { toast } from "react-hot-toast";

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
  };
  user: {
    id: number;
    email: string;
  };
  properties?: Array<{
    id: number;
    name: string;
    type: string;
    address: string;
    status: string;
  }>;
}

export default function OwnerDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, isLoading } = useToken();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

   // Extraer el ID del propietario de manera segura
   const ownerId = params?.id;

   useEffect(() => {
     if (!token && !isLoading) {
       router.push("/login");
       return;
     }
 
     const fetchOwner = async () => {
       if (isLoading) return;
       if (!ownerId) return;
 
       try {
         const response = await fetch(`http://localhost:3040/api/owners/${ownerId}`, {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         });
 
         if (!response.ok) {
           throw new Error("Error al cargar los datos del propietario");
         }
 
         const data = await response.json();
         setOwner(data);
       } catch (err) {
         console.error("Error:", err);
         setError(err instanceof Error ? err.message : "Error desconocido");
       } finally {
         setLoading(false);
       }
     };
 
     fetchOwner();
   }, [token, router, isLoading, ownerId]);
 
  

  const handleDelete = async () => {
    if (!token || !owner) return;

    if (!window.confirm("¿Está seguro que desea eliminar este propietario?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3040/api/owners/${owner.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el propietario");
      }

      toast.success("Propietario eliminado con éxito");
      router.push("/owner/list");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el propietario");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando datos del propietario...</div>
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
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Propietario no encontrado
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Detalles del Propietario</h1>
          <div className="flex space-x-4">
            <Link 
              href={`/owner/list`} 
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Volver
            </Link>
            <Link 
              href={`/owner/${owner.id}/edit`} 
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Editar
            </Link>
            <button 
              onClick={handleDelete}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h2>
                <dl className="space-y-2">
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Nombre:</dt>
                    <dd className="text-sm text-gray-900">{owner.fullName}</dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Documento:</dt>
                    <dd className="text-sm text-gray-900">
                      {owner.documentType.toUpperCase()}: {owner.documentId}
                    </dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Dirección:</dt>
                    <dd className="text-sm text-gray-900">{owner.address || "No disponible"}</dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Teléfono:</dt>
                    <dd className="text-sm text-gray-900">{owner.phone || "No disponible"}</dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Móvil:</dt>
                    <dd className="text-sm text-gray-900">{owner.mobile}</dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Email:</dt>
                    <dd className="text-sm text-gray-900">{owner.user.email}</dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Contacto de Emergencia:</dt>
                    <dd className="text-sm text-gray-900">{owner.emergencyContact || "No disponible"}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h2>
                <dl className="space-y-2">
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Tipo de Residente:</dt>
                    <dd className="text-sm text-gray-900">
                      {owner.residentType === 'resident' ? 'Residente' : 'No Residente'}
                    </dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Ocupación:</dt>
                    <dd className="text-sm text-gray-900">
                      {owner.occupationStatus === 'owner' ? 'Propietario' : 
                       owner.occupationStatus === 'tenant' ? 'Inquilino' : 'Ambos'}
                    </dd>
                  </div>
                  <div className="flex items-start">
                    <dt className="text-sm font-medium text-gray-500 w-1/3">Estado:</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Sección de propiedades */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Propiedades</h2>
              {owner.properties && owner.properties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dirección
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {owner.properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{property.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{property.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{property.address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {property.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/property/${property.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay propiedades asociadas a este propietario</p>
              )}
            </div>

            {/* Sección de vehículos */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Vehículos</h2>
              {owner.additionalInfo?.vehicles && owner.additionalInfo.vehicles.length > 0 ? (
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
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.type || "No especificado"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.brand}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.color || "No especificado"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.plate}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay vehículos registrados para este propietario</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 