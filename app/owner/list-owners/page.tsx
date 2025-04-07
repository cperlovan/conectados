'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { FiEdit2, FiTrash2, FiPlus, FiFilter, FiChevronDown, FiChevronUp, FiEye, FiList, FiLayout, FiUser, FiHome, FiMail, FiPhone, FiDollarSign, FiColumns } from 'react-icons/fi'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface User {
  id: number;
  name: string | null;
  email: string;
  status: string;
  credit_amount: number;
  phone?: string;
}

interface Owner {
  id: number
  name?: string
  email?: string
  phone?: string
  documentType?: string
  documentNumber?: string
  status?: string
  createdAt: string
  updatedAt: string
  fullName?: string
  user?: User
  properties?: any[]
}

interface Column {
  id: string
  label: string
  visible: boolean
  sortable: boolean
}

export default function ListOwners() {
  const router = useRouter()
  const { userInfo, token } = useToken()
  const { toast } = useToast()
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalOwners, setTotalOwners] = useState(0)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  })
  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', label: 'Nombre', visible: true, sortable: true },
    { id: 'email', label: 'Email', visible: true, sortable: true },
    { id: 'phone', label: 'Teléfono', visible: true, sortable: true },
    { id: 'documentType', label: 'Tipo Doc.', visible: true, sortable: true },
    { id: 'documentNumber', label: 'Número Doc.', visible: true, sortable: true },
    { id: 'status', label: 'Estado', visible: true, sortable: true },
    { id: 'properties', label: 'Propiedades', visible: true, sortable: false },
    { id: 'credit', label: 'Crédito', visible: true, sortable: true },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false },
  ])
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        // Obtener el token de las cookies directamente si no está disponible en useToken
        const tokenToUse = token || document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (!tokenToUse) {
          router.push('/login')
          return
        }

        // Verificar que tengamos userInfo y condominiumId
        if (!userInfo || !userInfo.condominiumId) {
          setError('No se encontró el condominio asociado al usuario')
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout
        
        // Modificamos la URL para usar el ID del condominio
        const response = await fetch(`http://localhost:3040/api/owners/condominium/${userInfo.condominiumId}`, {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.status === 401) {
          router.push('/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Error al cargar los propietarios (${response.status})` }))
          throw new Error(errorData.message || `Error al cargar los propietarios (${response.status})`)
        }

        const data = await response.json()
        const ownersData = Array.isArray(data) ? data : []
        
        setOwners(ownersData)
        setTotalOwners(ownersData.length)
        setTotalPages(Math.ceil(ownersData.length / rowsPerPage))
      } catch (error: unknown) {
        console.error('Error fetching owners:', error)
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('La solicitud tardó demasiado tiempo en completarse')
          } else {
            setError(error.message)
          }
        } else {
          setError('Error desconocido al cargar los propietarios')
        }
        
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Error al cargar los propietarios',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    // Solo ejecutamos fetchOwners si tenemos userInfo
    if (userInfo) {
      fetchOwners()
    }
  }, [toast, router, userInfo, token, currentPage, rowsPerPage])

  const handleEdit = (id: number) => {
    router.push(`/owner/${id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este propietario?')) return

    try {
      // Obtener el token de las cookies o desde useToken
      const tokenToUse = token || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      if (!tokenToUse) {
        router.push('/login')
        return
      }

      const response = await fetch(`http://localhost:3040/api/owners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error al eliminar el propietario: ${response.status}`)
        } else {
          const errorText = await response.text()
          console.error("Respuesta del servidor:", errorText)
          throw new Error(`Error al eliminar el propietario: ${response.status}`)
        }
      }

      setOwners(prevOwners => prevOwners.filter(owner => owner.id !== id))
      setTotalOwners(prev => prev - 1)
      setTotalPages(Math.ceil((totalOwners - 1) / rowsPerPage))
      
      toast({
        title: 'Éxito',
        description: 'Propietario eliminado correctamente'
      })
    } catch (error) {
      console.error('Error al eliminar propietario:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar el propietario',
        variant: 'destructive'
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

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

  const sortData = (data: Owner[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Owner] || '';
      let bValue: any = b[sortConfig.key as keyof Owner] || '';

      // Manejar casos especiales
      if (sortConfig.key === 'credit') {
        aValue = a.user?.credit_amount || 0;
        bValue = b.user?.credit_amount || 0;
      } else if (sortConfig.key === 'email') {
        aValue = a.user?.email || a.email || '';
        bValue = b.user?.email || b.email || '';
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ))
  }

  const filteredOwners = owners.filter(owner =>
    (owner.fullName?.toLowerCase() || owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.email?.toLowerCase() || owner.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.documentNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const sortedAndFilteredOwners = sortData(filteredOwners)
  const currentOwners = sortedAndFilteredOwners.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )
  
  const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'superadmin'

  // Add Kanban board component
  const KanbanBoard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentOwners.map((owner) => (
          <div key={owner.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100">
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <div className="font-bold text-xl text-gray-800">
                    {owner.fullName || owner.name || owner.user?.name || 'Sin nombre'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">ID: {owner.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  owner.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-3">
                    <FiMail className="text-gray-400 mr-2" />
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{owner.email || owner.user?.email || 'N/A'}</span>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center">
                      <FiPhone className="text-gray-400 mr-2" />
                      <span className="font-medium">Teléfono:</span>
                      <span className="ml-2">{owner.phone}</span>
                    </div>
                  )}
                </div>

                {(owner.documentType || owner.documentNumber) && (
                  <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <FiUser className="text-gray-400 mr-2" />
                      <span className="font-medium">Documento:</span>
                      <span className="ml-2">
                        {owner.documentType}: {owner.documentNumber}
                      </span>
                    </div>
                  </div>
                )}

                {owner.user?.credit_amount !== undefined && (
                  <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <FiDollarSign className="text-blue-500 mr-2" />
                      <span className="font-medium">Crédito Disponible:</span>
                      <span className="ml-2 text-lg font-medium text-blue-600">
                        ${(Number(owner.user.credit_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {owner.properties && owner.properties.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-gray-900 text-sm font-semibold mb-3">Propiedades Asignadas:</p>
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    {owner.properties.map((property, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600 bg-white p-2 rounded">
                        <FiHome className="text-blue-500 mr-2" />
                        <span className="font-medium">{property.type} {property.number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(owner.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <FiEdit2 className="mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(owner.id)}
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
            <p className="text-gray-600">Cargando propietarios...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista de Propietarios</h1>
              <div className="text-gray-500 text-sm">
                Total: <span className="font-medium">{totalOwners}</span> propietarios
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <FiEye className="mr-2" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
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

              {isAdmin && (
                <Link
                  href="/owner/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="mr-2" />
                  Registrar Propietario
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o documento..."
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

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
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

            {viewMode === 'table' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FiColumns />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
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
            )}
          </div>

          {/* Render view based on selected mode */}
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
                  {currentOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      {columns.find(col => col.id === 'name')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {owner.fullName || owner.name || owner.user?.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'email')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {owner.email || owner.user?.email || 'N/A'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'phone')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {owner.phone || 'N/A'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'documentType')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {owner.documentType || 'N/A'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'documentNumber')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {owner.documentNumber || 'N/A'}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'status')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      )}
                      {columns.find(col => col.id === 'properties')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {owner.properties?.length || 0} propiedades
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'credit')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            ${(Number(owner.user?.credit_amount || 0)).toFixed(2)}
                          </div>
                        </td>
                      )}
                      {columns.find(col => col.id === 'actions')?.visible && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(owner.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiEdit2 className="inline-block" />
                          </button>
                          <button
                            onClick={() => handleDelete(owner.id)}
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

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, totalOwners)} de {totalOwners} resultados
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
  )
} 