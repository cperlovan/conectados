"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiHome, FiMapPin, FiHash, FiLayers, FiPercent, FiAlertCircle, FiCheckCircle, FiPlus } from "react-icons/fi";
import { getOwnerByUserId, getPropertiesByOwnerId, Property } from "../../utils/api";

export default function OwnerProperties() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [properties, setProperties] = useState<Property[]>([]);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      // No ejecutar la función mientras se está cargando el token
      if (isLoading) return;
      if (!token) return;
      
      try {
        if (!userInfo?.id) {
          throw new Error("ID de usuario no encontrado");
        }

        console.log("Obteniendo datos del propietario...");
        // Primero obtener el perfil del propietario usando la función de API
        const ownerData = await getOwnerByUserId(userInfo.id, token);
        setOwnerData(ownerData);
        
        console.log("Obteniendo propiedades del propietario...");
        // Luego obtener las propiedades del propietario usando la función de API
        const propertiesData = await getPropertiesByOwnerId(ownerData.id, token);
        setProperties(propertiesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar las propiedades");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, userInfo, router, isLoading]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'occupied':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs flex items-center">
            <FiCheckCircle className="mr-1" />
            Ocupado
          </span>
        );
      case 'vacant':
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            Vacante
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs flex items-center">
            <FiAlertCircle className="mr-1" />
            En Mantenimiento
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs flex items-center">
            {status}
          </span>
        );
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('apartamento') || lowerType === 'apartment') {
      return 'bg-blue-100 text-blue-800';
    } else if (lowerType.includes('casa') || lowerType === 'house') {
      return 'bg-green-100 text-green-800';
    } else if (lowerType.includes('local') || lowerType === 'commercial') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (lowerType.includes('estacionamiento') || lowerType === 'parking') {
      return 'bg-purple-100 text-purple-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Encabezado con información del propietario */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-4">Mis Propiedades</h1>
          {ownerData && (
            <div className="text-gray-600 mb-2">
              Propietario: <span className="font-medium">{ownerData.fullName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 text-sm">
              <div className="mr-4">
                <span className="font-medium">{properties.length}</span> {properties.length === 1 ? 'Propiedad' : 'Propiedades'} registradas
              </div>
              {properties.length > 0 && (
                <div>
                  <span className="font-medium">
                    {properties.filter(p => p.status.toLowerCase() === 'occupied').length}
                  </span> Ocupadas
                </div>
              )}
            </div>
            <Link
              href="/owner/properties/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm flex items-center"
            >
              <FiPlus className="mr-1" />
              Nueva Propiedad
            </Link>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-4">
              <FiHome size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">No tiene propiedades registradas</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
              Puede registrar su propiedad utilizando el botón "Nueva Propiedad" o contactar con el administrador del condominio.
            </p>
            <Link
              href="/owner/properties/new"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-flex items-center"
            >
              <FiPlus className="mr-2" />
              Registrar Propiedad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => (
              <div key={property.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="text-lg font-medium truncate">{property.name}</div>
                  <div>
                    {getStatusBadge(property.status)}
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <div className="flex items-start mb-2">
                      <FiHome className="text-gray-400 mr-2 mt-1" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Tipo</div>
                        <div className={`mt-1 px-2 py-1 text-xs rounded-full inline-block ${getPropertyTypeIcon(property.type)}`}>
                          {property.type}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start mb-2">
                      <FiMapPin className="text-gray-400 mr-2 mt-1" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Dirección</div>
                        <div className="text-sm text-gray-600">{property.address || "No especificada"}</div>
                      </div>
                    </div>
                    
                    {property.number && (
                      <div className="flex items-start mb-2">
                        <FiHash className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Número</div>
                          <div className="text-sm text-gray-600">{property.number}</div>
                        </div>
                      </div>
                    )}
                    
                    {property.block && (
                      <div className="flex items-start mb-2">
                        <FiLayers className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Bloque</div>
                          <div className="text-sm text-gray-600">{property.block}</div>
                        </div>
                      </div>
                    )}
                    
                    {property.aliquot !== undefined && (
                      <div className="flex items-start mb-2">
                        <FiPercent className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Alícuota</div>
                          <div className="text-sm text-gray-600">{property.aliquot}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Link 
                      href={`/property/${property.id}`}
                      className="inline-block bg-blue-600 text-white text-xs font-medium py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 