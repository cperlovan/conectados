"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToken } from "../../hook/useToken";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { FiColumns, FiFilter, FiList, FiGrid, FiChevronUp, FiChevronDown, FiUser, FiPercent } from "react-icons/fi";
import { Button } from "../../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    block: "all"
  });
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });
  const [visibleColumns, setVisibleColumns] = useState({
    number: true,
    type: true,
    status: true,
    aliquot: true,
    block: true,
    floor: true,
    owner: true
  });

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

  // Función para manejar cambios en los filtros
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  // Función para manejar el ordenamiento
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

  // Función para filtrar propiedades
  const getFilteredProperties = () => {
    return properties.filter(property => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        property.number.toLowerCase().includes(searchLower) ||
        property.type.toLowerCase().includes(searchLower) ||
        (property.block?.toLowerCase() || '').includes(searchLower) ||
        (property.owner?.user?.name?.toLowerCase() || '').includes(searchLower) ||
        (property.owner?.user?.email?.toLowerCase() || '').includes(searchLower);

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

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
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

  // Obtener valores únicos para los filtros
  const uniqueTypes = Array.from(new Set(properties.map(p => p.type)));
  const uniqueBlocks = Array.from(new Set(properties.map(p => p.block).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(properties.map(p => p.status)));

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header con título y acciones */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Asignación de Alícuotas</h1>
              <div className="text-gray-500 text-sm">
                Total: <span className="font-medium">{filteredProperties.length}</span> propiedades
              </div>
              <div className="text-gray-500 text-sm mt-1">
                Suma total de alícuotas: <span className={`font-medium ${Math.abs(totalQuota - 100) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalQuota}%
                </span>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Button
                onClick={handleDistributeEqual}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Distribuir Equitativamente
              </Button>
              <Button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Reiniciar Valores
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || Math.abs(totalQuota - 100) > 0.1}
                className={`${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
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

          {/* Mensajes de éxito o error */}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          {/* Filtros y Búsqueda */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Campo de búsqueda */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar por número, tipo, bloque o propietario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtros */}
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
                    {visibleColumns.aliquot && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span>Alícuota (%)</span>
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
                          <div className="text-sm text-gray-900">{property.type}</div>
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
                      {visibleColumns.block && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.block || '-'}</div>
                        </td>
                      )}
                      {visibleColumns.floor && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.floor || '-'}</div>
                        </td>
                      )}
                      {visibleColumns.owner && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {property.owner ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {property.owner.fullName || property.owner.user?.name || "Sin nombre"}
                              </div>
                              {property.owner.user?.email && (
                                <div className="text-xs text-gray-500">{property.owner.user.email}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Sin propietario asignado</div>
                          )}
                        </td>
                      )}
                      {visibleColumns.aliquot && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={property.participationQuota || ''}
                            onChange={(e) => handleQuotaChange(property.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            step="0.01"
                            min="0"
                            max="100"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      property.status === 'occupied' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.status === 'occupied' ? 'Ocupado' : 'Vacante'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {property.owner && (
                      <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">
                              {property.owner.fullName || property.owner.user?.name || "Sin nombre"}
                            </div>
                            {property.owner.user?.email && (
                              <div className="text-xs text-gray-500">{property.owner.user.email}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiPercent className="text-gray-400 mr-2" />
                          <span className="font-medium">Alícuota:</span>
                        </div>
                        <input
                          type="number"
                          value={property.participationQuota || ''}
                          onChange={(e) => handleQuotaChange(property.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
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
        </div>
      </div>
    </div>
  );
};

export default AssignQuotasPage; 