"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { useToken } from "../hook/useToken";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp, 
  FiList, 
  FiGrid,
  FiColumns,
  FiHome,
  FiUser,
  FiPercent
} from 'react-icons/fi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    block: "all"
  });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  // Add state for column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    number: true,
    type: true,
    status: true,
    aliquot: true,
    block: true,
    floor: true,
    owner: true,
    actions: true
  });

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

  // Add function to toggle column visibility
  const toggleColumnVisibility = (columnId: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Add sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const sortData = (data: Property[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Property] || '';
      let bValue: any = b[sortConfig.key as keyof Property] || '';

      // Manejar casos especiales
      if (sortConfig.key === 'owner') {
        aValue = a.owner?.fullName || a.owner?.user?.name || '';
        bValue = b.owner?.fullName || b.owner?.user?.name || '';
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  // Obtener valores únicos para los filtros
  const uniqueTypes = Array.from(new Set(properties.map(p => p.type)));
  const uniqueBlocks = Array.from(new Set(properties.map(p => p.block).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(properties.map(p => p.status)));

  // Función para manejar cambios en los filtros
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Resetear a la primera página cuando se cambian los filtros
  };

  // Función para filtrar propiedades
  const getFilteredProperties = () => {
    return properties.filter(property => {
      // Aplicar filtros de búsqueda
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        property.number.toLowerCase().includes(searchLower) ||
        property.type.toLowerCase().includes(searchLower) ||
        (property.block?.toLowerCase() || '').includes(searchLower) ||
        (property.owner?.user?.name?.toLowerCase() || '').includes(searchLower) ||
        (property.owner?.user?.email?.toLowerCase() || '').includes(searchLower);

      // Aplicar filtros de selección
      const matchesType = filters.type === "all" || property.type === filters.type;
      const matchesStatus = filters.status === "all" || property.status === filters.status;
      const matchesBlock = filters.block === "all" || property.block === filters.block;

      return matchesSearch && matchesType && matchesStatus && matchesBlock;
    });
  };

  // Función para ordenar propiedades
  const getSortedProperties = (filteredProperties: Property[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredProperties;
    }

    return [...filteredProperties].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Property];
      let bValue = b[sortConfig.key as keyof Property];

      // Manejar casos especiales
      if (sortConfig.key === 'owner') {
        aValue = a.owner?.user?.name || '';
        bValue = b.owner?.user?.name || '';
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  // Obtener propiedades filtradas y ordenadas
  const filteredProperties = getFilteredProperties();
  const sortedProperties = getSortedProperties(filteredProperties);
  
  // Calcular propiedades paginadas
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage);

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista de Propiedades</h1>
              <div className="text-gray-500 text-sm">
                Total: <span className="font-medium">{filteredProperties.length}</span> propiedades
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <Button
                onClick={() => router.push('/property/assign-quotas')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FiPercent className="mr-2" />
                Editar Alícuotas
              </Button>
              <Button
                onClick={() => router.push("/property/register")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FiPlus className="mr-2" />
                Nueva Propiedad
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FiColumns className="mr-2" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={() => toggleColumnVisibility(key as keyof typeof visibleColumns)}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Condición para mostrar mensaje si no hay propiedades */}
          {filteredProperties.length === 0 && searchTerm === '' && filters.type === 'all' && filters.status === 'all' && filters.block === 'all' ? (
            <div className="text-center py-10 border-t border-gray-200 mt-6">
              <FiHome className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay propiedades registradas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Actualmente no hay propiedades registradas para este condominio. ¡Empieza agregando una!
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/property/register')}>
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  Registrar Nueva Propiedad
                </Button>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-10 border-t border-gray-200 mt-6">
              <FiFilter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron propiedades</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ninguna propiedad coincide con los filtros o términos de búsqueda actuales. Intenta ajustarlos.
              </p>
              <div className="mt-6">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFilters({ type: 'all', status: 'all', block: 'all' });
                }}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Filtros y Búsqueda */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border-t border-gray-200 pt-6">
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Buscar por número, tipo, bloque o propietario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los tipos</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filters.block}
                    onChange={(e) => handleFilterChange('block', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los bloques</option>
                    {uniqueBlocks.map(block => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vista y Paginación */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  <span className="text-sm text-gray-600">Vista:</span>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FiList className="mr-1" />
                      <span>Lista</span>
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                        viewMode === 'cards'
                          ? 'bg-white shadow-sm text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FiGrid className="mr-1" />
                      <span>Tarjetas</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5 por página</option>
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                </div>
              </div>

              {/* Lista de Propiedades */}
              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {visibleColumns.number && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('number')}
                          >
                            <div className="flex items-center">
                              <span>Número</span>
                              {sortConfig.key === 'number' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.type && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center">
                              <span>Tipo</span>
                              {sortConfig.key === 'type' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center">
                              <span>Estado</span>
                              {sortConfig.key === 'status' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.aliquot && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('aliquot')}
                          >
                            <div className="flex items-center">
                              <span>Alícuota</span>
                              {sortConfig.key === 'aliquot' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.block && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('block')}
                          >
                            <div className="flex items-center">
                              <span>Bloque</span>
                              {sortConfig.key === 'block' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.floor && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('floor')}
                          >
                            <div className="flex items-center">
                              <span>Piso</span>
                              {sortConfig.key === 'floor' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.owner && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('owner')}
                          >
                            <div className="flex items-center">
                              <span>Propietario</span>
                              {sortConfig.key === 'owner' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                        {visibleColumns.actions && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('actions')}
                          >
                            <div className="flex items-center">
                              <span>Acciones</span>
                              {sortConfig.key === 'actions' && (
                                sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedProperties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          {visibleColumns.number && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {property.number}
                              </div>
                            </td>
                          )}
                          {visibleColumns.type && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{property.type === 'apartment' ? 'Apartamento' : property.type}</div>
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                property.status === "occupied" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {property.status === "occupied" ? "Ocupado" : "Vacante"}
                              </span>
                            </td>
                          )}
                          {visibleColumns.aliquot && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{property.aliquot}%</div>
                            </td>
                          )}
                          {visibleColumns.block && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {property.block && <span>Bloque: {property.block}</span>}
                                {property.block && property.floor && <span> | </span>}
                                {property.floor && <span>Piso: {property.floor}</span>}
                                {!property.block && !property.floor && <span>-</span>}
                              </div>
                            </td>
                          )}
                          {visibleColumns.floor && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {property.floor && <span>Piso: {property.floor}</span>}
                              </div>
                            </td>
                          )}
                          {visibleColumns.owner && (
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
                          )}
                          {visibleColumns.actions && (
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedProperties.map((property) => (
                    <div key={property.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-xl text-gray-800">
                            {property.type} {property.number}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {property.block && `Bloque ${property.block}`}
                            {property.floor && ` • Piso ${property.floor}`}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          property.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {property.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center mb-3">
                            <FiHome className="text-gray-400 mr-2" />
                            <span className="font-medium">Alícuota:</span>
                            <span className="ml-2">{property.aliquot}%</span>
                          </div>
                        </div>

                        {property.owner && (
                          <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <FiUser className="text-gray-400 mr-2" />
                              <span className="font-medium">Propietario:</span>
                              <span className="ml-2">
                                {property.owner.fullName || property.owner.user?.name || 'Sin asignar'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginación */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredProperties.length)} de {filteredProperties.length} resultados
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

