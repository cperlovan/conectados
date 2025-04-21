"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";
import Header from "../components/Header";
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiPlus, FiColumns, FiList, FiLayout, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Button } from "@/components/ui/button";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ContactInfo {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  address: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  lastname?: string;
  ContactInfo?: ContactInfo;
}

interface Supplier {
  id: number;
  name: string;
  type: string;
  User?: User;
  contactInfo?: {
    name?: string;
    lastname?: string;
    phone?: string;
    email?: string;
    address?: string;
    companyName?: string;
  };
  contact?: {
    name: string;
    lastname: string;
    phone: string;
    email: string;
    address: string;
    companyName: string;
  };
  status: "active" | "inactive";
  economicActivities: Array<{
    id: number;
    name: string;
  }>;
}

interface Column {
  id: string
  label: string
  visible: boolean
  sortable: boolean
}

// Reemplazar DropdownMenuTrigger con el componente de Radix UI
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export default function SupplierPage() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });
  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', label: 'Nombre', visible: true, sortable: true },
    { id: 'type', label: 'Tipo', visible: true, sortable: true },
    { id: 'contact', label: 'Contacto', visible: true, sortable: true },
    { id: 'phone', label: 'Teléfono', visible: true, sortable: true },
    { id: 'email', label: 'Email', visible: true, sortable: true },
    { id: 'activities', label: 'Actividades', visible: true, sortable: false },
    { id: 'status', label: 'Estado', visible: true, sortable: true },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false },
  ]);

  const fetchSuppliers = async () => {
    if (!token || !userInfo?.condominiumId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3040/api/suppliers/condominium/${userInfo.condominiumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los proveedores");
      }

      const data = await response.json();
      const suppliersData = Array.isArray(data) ? data : [];
      
      const mappedSuppliers = suppliersData.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        type: supplier.type,
        User: supplier.User || {},
        contactInfo: supplier.contactInfo || {},
        contact: supplier.contact || {
          name: '',
          lastname: '',
          email: '',
          phone: '',
          address: '',
          companyName: ''
        },
        status: supplier.status || "active",
        economicActivities: supplier.economicActivities || []
      }));

      setSuppliers(mappedSuppliers);
      setTotalSuppliers(mappedSuppliers.length);
      setTotalPages(Math.ceil(mappedSuppliers.length / rowsPerPage));
      setError(null);
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los proveedores");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userInfo?.condominiumId) {
      fetchSuppliers();
    }
  }, [currentPage, rowsPerPage, token, userInfo]);

  const handleDelete = async (id: number) => {
    if (!token || !userInfo?.condominiumId) {
      setError("No hay token o información del condominio disponible");
      return;
    }

    if (!window.confirm("¿Está seguro de que desea desactivar este proveedor?")) {
      return;
    }

    try {
      console.log("Intentando desactivar proveedor:", id);
      const response = await fetch(`http://localhost:3040/api/suppliers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error al desactivar el proveedor: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error("Respuesta del servidor:", errorText);
          throw new Error(`Error al desactivar el proveedor: ${response.status}`);
        }
      }

      setSuppliers(prevSuppliers => prevSuppliers.filter(supplier => supplier.id !== id));
      setTotalSuppliers(prev => prev - 1);
      setTotalPages(Math.ceil((totalSuppliers - 1) / rowsPerPage));
      alert("Proveedor desactivado exitosamente");
    } catch (err) {
      console.error("Error al desactivar:", err);
      setError(err instanceof Error ? err.message : "Error al desactivar el proveedor");
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/supplier/edit/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'superadmin';

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (sortConfig.direction === 'desc') {
        direction = null
      }
    }

    setSortConfig({ key, direction })
  }

  const sortData = (data: Supplier[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'contact':
          aValue = `${a.contact?.name || ''} ${a.contact?.lastname || ''}`;
          bValue = `${b.contact?.name || ''} ${b.contact?.lastname || ''}`;
          break;
        case 'phone':
          aValue = a.contact?.phone || a.contactInfo?.phone || '';
          bValue = b.contact?.phone || b.contactInfo?.phone || '';
          break;
        case 'email':
          aValue = a.contact?.email || a.contactInfo?.email || a.User?.email || '';
          bValue = b.contact?.email || b.contactInfo?.email || b.User?.email || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ))
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchTermLower) ||
      supplier.type.toLowerCase().includes(searchTermLower) ||
      (supplier.contact?.name?.toLowerCase() || '').includes(searchTermLower) ||
      (supplier.contact?.lastname?.toLowerCase() || '').includes(searchTermLower) ||
      (supplier.contact?.email?.toLowerCase() || '').includes(searchTermLower) ||
      (supplier.contact?.phone?.toLowerCase() || '').includes(searchTermLower) ||
      supplier.economicActivities.some(activity => 
        activity.name.toLowerCase().includes(searchTermLower)
      )
    );
  });

  const sortedAndFilteredSuppliers = sortData(filteredSuppliers)
  const currentSuppliers = sortedAndFilteredSuppliers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Componente KanbanBoard para la vista de tarjetas
  const KanbanBoard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <div className="font-bold text-xl text-gray-800">
                    {supplier.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">ID: {supplier.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  supplier.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg mb-3">
                <div className="flex items-center mb-2">
                  <span className="font-medium">Tipo:</span>
                  <span className="ml-2">{supplier.type === 'individual' ? 'Individual' : 'Empresa'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Contacto:</span>
                  <span className="ml-2">{supplier.contact?.name || supplier.User?.name || ''} {supplier.contact?.lastname || supplier.User?.lastname || ''}</span>
                </div>
              </div>

              <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg mb-3">
                <div className="flex items-center mb-2">
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{supplier.contact?.email || supplier.contactInfo?.email || supplier.User?.email || 'No disponible'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Teléfono:</span>
                  <span className="ml-2">{supplier.contact?.phone || supplier.contactInfo?.phone || 'No disponible'}</span>
                </div>
              </div>

              {supplier.economicActivities && supplier.economicActivities.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700">Actividades Económicas:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {supplier.economicActivities.map((activity, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(supplier.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <FiEdit2 className="mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(supplier.id)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <FiTrash2 className="mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proveedores...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista de Proveedores</h1>
              <div className="text-gray-500 text-sm">
                Total: <span className="font-medium">{totalSuppliers}</span> proveedores
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              {isAdmin && (
                <Link
                  href="/supplier/admin-register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiPlus className="mr-2" />
                  Registrar Proveedor
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <FiColumns className="mr-2" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumnVisibility(column.id)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Vista:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiList className="mr-1" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiLayout className="mr-1" />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map(column => column.visible && (
                      <th
                        key={column.id}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => column.sortable && handleSort(column.id)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && sortConfig.key === column.id && (
                            <span>
                              {sortConfig.direction === 'asc' ? (
                                <FiChevronUp className="inline" />
                              ) : sortConfig.direction === 'desc' ? (
                                <FiChevronDown className="inline" />
                              ) : null}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      {columns.find(col => col.id === 'name')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'type')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {supplier.type === 'individual' ? 'Individual' : 'Empresa'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'contact')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {supplier.contact?.name || supplier.User?.name || ''} {supplier.contact?.lastname || supplier.User?.lastname || ''}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'phone')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {supplier.contact?.phone || supplier.contactInfo?.phone || ''}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'email')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {supplier.contact?.email || supplier.contactInfo?.email || supplier.User?.email || ''}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'activities')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {supplier.economicActivities?.map(activity => activity.name).join(', ')}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'status')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      )}
                      {columns.find(col => col.id === 'actions')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(supplier.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiEdit2 className="inline-block" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="inline-block" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <KanbanBoard />
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, totalSuppliers)} de {totalSuppliers} resultados
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
}