"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { FiHome, FiMapPin, FiHash, FiLayers, FiPercent, FiAlertCircle, FiCheckCircle, FiUser, FiCalendar, FiChevronLeft } from "react-icons/fi";

interface Property {
  id: number;
  name: string;
  type: string;
  status: string;
  address: string;
  aliquot?: number;
  number?: string;
  block?: string;
  floor?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: number;
    fullName: string;
  };
}

export default function PropertyDetail() {
  const router = useRouter();
  const params = useParams();
  const { token, userInfo, isLoading } = useToken();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchPropertyDetail = async () => {
      try {
        if (isLoading) return;
        if (!token) return;
        
        if (!params.id) {
          throw new Error("ID de propiedad no encontrado");
        }

        const propertyResponse = await fetch(`http://localhost:3040/api/properties/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!propertyResponse.ok) {
          if (propertyResponse.status === 404) {
            throw new Error("Propiedad no encontrada");
          }
          
          if (propertyResponse.status === 401) {
            router.push("/login");
            return;
          }
          
          throw new Error("Error al obtener detalles de la propiedad");
        }

        const propertyData = await propertyResponse.json();
        console.log("Datos de la propiedad:", propertyData);
        setProperty(propertyData);
      } catch (err) {
        console.error("Error al cargar la propiedad:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los detalles de la propiedad");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [token, params.id, router, isLoading]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'occupied':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center">
            <FiCheckCircle className="mr-1" />
            Ocupado
          </span>
        );
      case 'vacant':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center">
            <FiAlertCircle className="mr-1" />
            Vacante
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm flex items-center">
            <FiAlertCircle className="mr-1" />
            En Mantenimiento
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm flex items-center">
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

  const formatDate = (dateString?: string) => {
    try {
      if (!dateString) return "Fecha no disponible";
      
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error de formato";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles de la propiedad...</p>
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
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiChevronLeft className="mr-1" /> Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
            No se encontró información para esta propiedad
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiChevronLeft className="mr-1" /> Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <FiChevronLeft className="mr-1" /> Volver
          </button>
          <h1 className="text-2xl font-bold">Detalles de la Propiedad</h1>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Encabezado de la propiedad */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
              <FiHome className="text-gray-500 mr-3" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">{property.name}</h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPropertyTypeIcon(property.type)}`}>
                {property.type}
              </div>
              {getStatusBadge(property.status)}
            </div>
          </div>
          
          {/* Contenido de la propiedad */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Información Básica</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FiHash className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 w-32">Número:</span>
                    <span className="text-sm font-medium text-gray-800">{property.number || "No especificado"}</span>
                  </div>
                  
                  {property.block && (
                    <div className="flex items-center">
                      <FiLayers className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 w-32">Bloque:</span>
                      <span className="text-sm font-medium text-gray-800">{property.block}</span>
                    </div>
                  )}
                  
                  {property.floor !== undefined && (
                    <div className="flex items-center">
                      <FiLayers className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 w-32">Piso:</span>
                      <span className="text-sm font-medium text-gray-800">{property.floor}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <FiMapPin className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 w-32">Dirección:</span>
                    <span className="text-sm font-medium text-gray-800">{property.address || "No especificada"}</span>
                  </div>
                  
                  {property.aliquot !== undefined && (
                    <div className="flex items-center">
                      <FiPercent className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 w-32">Alícuota:</span>
                      <span className="text-sm font-medium text-gray-800">{property.aliquot}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información adicional */}
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Información Adicional</h3>
                <div className="space-y-4">
                  {property.owner && (
                    <div className="flex items-center">
                      <FiUser className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 w-32">Propietario:</span>
                      <span className="text-sm font-medium text-gray-800">{property.owner.fullName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 w-32">Fecha registro:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(property.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 w-32">Última actualización:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(property.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              {userInfo?.role === 'admin' && (
                <Link
                  href={`/property/edit/${property.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
                >
                  Editar Propiedad
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 