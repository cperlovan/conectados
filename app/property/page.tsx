"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { useToken } from "../hook/useToken";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

// Interfaz para el usuario
interface User {
  id: number;
  name?: string;
  lastname?: string;
  nic?: string;
  email?: string;
  address?: string;
  telephone?: string;
  movil?: string;
  condominiumId?: number;
  credit_balance?: number;
  authorized?: boolean;
  role: "copropietario" | "admin";
}

// Extender el tipo JwtPayload
interface CustomJwtPayload {
  id: number;
  condominiumId: number;
  role: "admin" | "copropietario";
}

interface Property {
  id: number;
  number: string;
  type: string;
  status: string;
  aliquot: number;
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

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<User>({
    id: 0,
    name: "",
    nic: "",
    email: "",
    lastname: "",
    address: "",
    telephone: "",
    movil: "",
    condominiumId: 0,
    credit_balance: 0,
    authorized: false,
    role: "copropietario",
  });
  const [isEditMode] = useState(false);
  const [currentPage] = useState(1);
  const [rowsPerPage ] = useState(5);
  const [searchTerm] = useState("");
  const [totalRows, setTotalRows] = useState<number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Obtener el token de las cookies
  const { token, isLoading: tokenLoading, userInfo } = useToken();
  console.log(isEditMode, totalRows);
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        console.log("Token decodificado:", decodedToken);
        setFormData((prev) => ({
          ...prev,
          condominiumId: decodedToken.condominiumId || 0,
        }));
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        setError("El token de autenticación es inválido. Por favor, vuelve a iniciar sesión.");
        router.push("/login");
      }
    } else if (!tokenLoading) {
      // Solo redirigir si ya terminó de cargar el token y no existe
      console.log("No hay token disponible");
      setError("No estás autenticado. Por favor, inicia sesión para continuar.");
      router.push("/login");
    }
  }, [token, tokenLoading, router]);

  // Cargar usuarios
  useEffect(() => {
    if (token && formData.condominiumId && !tokenLoading) {
      fetchUsers();
    }
  }, [token, formData.condominiumId, currentPage, rowsPerPage, searchTerm, tokenLoading]);

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
      
      const loadData = async () => {
        try {
          await fetchProperties();
        } catch (error) {
          console.error("Error al cargar propiedades:", error);
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [token, tokenLoading, userInfo, router]);

  const fetchProperties = async () => {
    try {
      if (!token) {
        console.log("No hay token disponible para fetchProperties");
        setError("No estás autenticado. Por favor, inicia sesión para continuar.");
        router.push("/login");
        return;
      }
      
      // Verificar permisos según roles
      const allowedRoles = ["admin", "superadmin", "copropietario"];
      const userRole = userInfo?.role || "";
      
      console.log("Rol del usuario:", userRole);
      
      if (!allowedRoles.includes(userRole)) {
        console.log("Usuario no tiene permisos suficientes. Rol:", userRole);
        setError("No tienes permisos suficientes para acceder a esta página.");
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Muestra el token (parcial) para depuración
      const partialToken = token.substring(0, 15) + "..." + token.substring(token.length - 10);
      console.log("Usando token (parcial):", partialToken);

      // Usar la ruta correcta para obtener propiedades por condominio
      const condominiumId = userInfo?.condominiumId || 1;
      console.log("Obteniendo propiedades para el condominio:", condominiumId);

      const response = await axios.get(`http://localhost:3040/api/properties/condominium/${condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Estado de respuesta:", response.status);
      
      if (response.status === 200) {
        const data = response.data;
        console.log(`Propiedades cargadas: ${data.length}`);
        setProperties(data);
        
        // Una vez que tenemos las propiedades, buscamos los usuarios
        if (data.length > 0 && userInfo?.condominiumId) {
          console.log("Buscando usuarios con condominiumId:", userInfo.condominiumId);
          fetchUsers();
        } else {
          console.log("No se encontraron propiedades o no hay condominiumId");
          setLoading(false);
        }
      } else {
        console.error("Error al cargar propiedades:", response.statusText);
        setError(`Error al cargar propiedades: ${response.statusText}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error completo:", error);
      
      // Referencia al condominiumId para mensajes de error
      const condominiumId = userInfo?.condominiumId || 1;
      
      if (axios.isAxiosError(error)) {
        console.log("URL solicitada:", error.config?.url);
        console.log("Método:", error.config?.method);
        console.log("Headers:", JSON.stringify(error.config?.headers));
        
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401) {
            setError("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            router.push("/login");
          } else if (status === 403) {
            setError("No tienes permisos suficientes para ver las propiedades.");
          } else if (status === 404) {
            setError(`La ruta de propiedades no está disponible. Intentando acceder a: ${error.config?.url}. Verifica que el condominio ${condominiumId} exista.`);
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

  const fetchUsers = async () => {
    try {
      if (!token) {
        console.log("No hay token disponible para fetchUsers");
        return;
      }

      if (!userInfo || !userInfo.condominiumId) {
        console.log("No hay información de usuario o condominiumId");
        return;
      }

      console.log(`Solicitando usuarios para condominiumId: ${userInfo.condominiumId}`);
      
      // Corregir la URL para que apunte a la ruta correcta en el backend
      const response = await axios.get(
        `http://localhost:3040/api/users/condominium/${userInfo.condominiumId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.status === 200) {
        console.log(`Usuarios cargados: ${response.data.length}`);
        setUsers(response.data);
      } else {
        console.error("Error al cargar usuarios:", response.statusText);
        setError(`Error al cargar usuarios: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error completo al cargar usuarios:", error);
      
      if (axios.isAxiosError(error)) {
        console.log("URL solicitada:", error.config?.url);
        console.log("Método:", error.config?.method);
        console.log("Headers:", JSON.stringify(error.config?.headers));
        
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401) {
            setError("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            router.push("/login");
          } else if (status === 403) {
            setError("No tienes permisos suficientes para ver los usuarios.");
          } else if (status === 404) {
            setError(`La ruta de usuarios no está disponible. Intentando acceder a: ${error.config?.url}`);
          } else {
            setError(`Error al cargar los usuarios: ${error.response.data?.message || error.message}`);
          }
        } else {
          setError(`Error de conexión: ${error.message}`);
        }
      } else {
        setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    try {
      // Corregir la URL para que apunte a la ruta correcta en el backend
      const response = await axios.delete(`http://localhost:3040/api/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.status === 200) {
        setProperties(prevProperties => prevProperties.filter(prop => prop.id !== id));
        setError("");
      } else {
        setError(`Error al eliminar la propiedad: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al eliminar propiedad:", error);
      
      if (axios.isAxiosError(error)) {
        console.log("URL solicitada:", error.config?.url);
        console.log("Método:", error.config?.method);
        console.log("Headers:", JSON.stringify(error.config?.headers));
        
        if (error.response) {
          if (error.response.status === 404) {
            setError(`No se encontró la propiedad con ID ${id} para eliminar.`);
          } else {
            setError(`Error al eliminar la propiedad: ${error.response.data?.message || error.message}`);
          }
        } else {
          setError(`Error de conexión: ${error.message}`);
        }
      } else {
        setError(`Error inesperado: ${error instanceof Error ? error.message : 'Error al eliminar la propiedad'}`);
      }
    }
  };

  // Add the handleEdit function after handleDelete
  const handleEdit = (id: number) => {
    router.push(`/property/edit/${id}`);
  };

  // Cargar preferencia de visualización desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('propertyViewMode');
      if (savedViewMode === 'cards' || savedViewMode === 'list') {
        setViewMode(savedViewMode);
      }
    }
  }, []);

  // Guardar preferencia de visualización en localStorage cuando cambie
  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('propertyViewMode', mode);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <div className="text-xl font-semibold text-gray-700">Cargando propiedades...</div>
              <div className="text-sm text-gray-500 mt-2">Esto puede tomar unos momentos mientras nos conectamos al servidor.</div>
            </div>
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
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-6 rounded shadow">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xl font-bold">Error al cargar propiedades</p>
                  <p className="text-base mt-1">{error}</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <button 
                  onClick={() => {
                    setError("");
                    setLoading(true);
                    fetchProperties();
                  }} 
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Reintentar
                </button>
                <button 
                  onClick={() => {
                    setError("");
                    router.push("/");
                  }} 
                  className="px-5 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                >
                  Volver al inicio
                </button>
                <button 
                  onClick={() => {
                    setError("");
                    router.push("/suppliers");
                  }} 
                  className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                >
                  Ir a Proveedores
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("http://localhost:3040/api/health", { method: "GET" });
                      if (response.ok) {
                        setError("El servidor está en línea, pero hay un problema con esta página. Contacta al administrador.");
                      } else {
                        setError("El servidor no está respondiendo correctamente. Estado: " + response.status);
                      }
                    } catch (e) {
                      setError("No se puede conectar al servidor en http://localhost:3040. Verifica que el servidor esté iniciado.");
                    }
                  }}
                  className="px-5 py-2 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition"
                >
                  Verificar servidor
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold">Posibles soluciones:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Verifica que el servidor backend esté ejecutándose en el puerto 3040</li>
                  <li>Comprueba tu conexión a internet</li>
                  <li>Asegúrate de que tu sesión no haya expirado</li>
                  <li>Contacta al administrador del sistema si el problema persiste</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <div className="mt-2">
                  <button 
                    onClick={() => setError("")} 
                    className="text-sm font-medium text-red-700 hover:text-red-600 underline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl font-semibold">Cargando...</div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Propiedades
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewModeChange('cards')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Tarjetas
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Lista
                </button>
                <button
                  onClick={() => router.push('/property/assign-quotas')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Editar Alícuotas
                </button>
                <button
                  onClick={() => router.push('/property/register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Nueva Propiedad
                </button>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No hay propiedades disponibles para mostrar.</p>
              </div>
            ) : (
              <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4">
                          <div className="font-bold text-xl mb-2">Propiedad: {property.number}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <p className="text-gray-700 text-sm">
                              <span className="font-semibold">Tipo:</span> {property.type === 'apartment' ? 'Apartamento' : property.type}
                            </p>
                            <p className="text-gray-700 text-sm">
                              <span className="font-semibold">Alícuota:</span> {property.aliquot}%
                            </p>
                            {property.block && (
                              <p className="text-gray-700 text-sm">
                                <span className="font-semibold">Bloque:</span> {property.block}
                              </p>
                            )}
                            {property.floor && (
                              <p className="text-gray-700 text-sm">
                                <span className="font-semibold">Piso:</span> {property.floor}
                              </p>
                            )}
                            <p className="text-gray-700 text-sm">
                              <span className="font-semibold">Estado:</span>{" "}
                              <span
                                className={`${
                                  property.status === "occupied" 
                                    ? "text-green-600" 
                                    : "text-red-600"
                                }`}
                              >
                                {property.status === "occupied" ? "Ocupado" : "Vacante"}
                              </span>
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-gray-700 text-sm font-semibold mb-1">Propietario:</p>
                            {property.owner ? (
                              <div className="pl-2">
                                <p className="text-gray-700 text-sm">{property.owner.fullName || "No especificado"}</p>
                                {property.owner.user?.email && (
                                  <p className="text-gray-700 text-sm">
                                    <span className="font-semibold">Email:</span> {property.owner.user.email}
                                  </p>
                                )}
                                {property.owner.documentId && (
                                  <p className="text-gray-700 text-sm">
                                    <span className="font-semibold">Documento:</span> {property.owner.documentType} {property.owner.documentId}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm pl-2">Sin propietario asignado</p>
                            )}
                          </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            ID: {property.id}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(property.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bloque/Piso</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alícuota</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {properties.map((property) => (
                          <tr key={property.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{property.number}</div>
                              <div className="text-xs text-gray-500">ID: {property.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{property.type === 'apartment' ? 'Apartamento' : property.type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {property.block && <span>Bloque: {property.block}</span>}
                                {property.block && property.floor && <span> | </span>}
                                {property.floor && <span>Piso: {property.floor}</span>}
                                {!property.block && !property.floor && <span>-</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{property.aliquot}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                property.status === "occupied" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {property.status === "occupied" ? "Ocupado" : "Vacante"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {property.owner ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{property.owner.fullName || "Sin nombre"}</div>
                                  {property.owner.user?.email && (
                                    <div className="text-xs text-gray-500">{property.owner.user.email}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Sin propietario asignado</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(property.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(property.id)}
                                  className="text-red-600 hover:text-red-900"
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Page;

