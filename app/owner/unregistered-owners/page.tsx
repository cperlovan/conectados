'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { FiEdit2, FiPlus, FiAlertTriangle, FiUser, FiHome, FiList, FiGrid, FiColumns, FiChevronUp, FiChevronDown, FiMail, FiPhone, FiCalendar } from 'react-icons/fi'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Owner {
  id: number
  fullName?: string
  email?: string
  phone?: string
  documentType?: string
  documentId?: string
  status?: string
  createdAt: string
  updatedAt: string
  userId: number
  user?: {
    id: number
    name: string | null
    email: string
    status: string
  }
  properties?: any[]
  isUserOnly?: boolean // Para identificar si es solo un usuario sin perfil de propietario
}

interface User {
  id: number
  name: string | null
  email: string
  status: string
  createdAt: string
  updatedAt: string
  condominiumId?: number
}

export default function UnregisteredOwners() {
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
  const [activeTab, setActiveTab] = useState<'all' | 'owners' | 'users'>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  })
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    document: true,
    status: true,
    createdAt: true,
    actions: true
  })

  useEffect(() => {
    const fetchData = async () => {
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
        
        // 1. Obtener todos los propietarios
        const ownersResponse = await fetch(`http://localhost:3040/api/owners/condominium/${userInfo.condominiumId}`, {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })
        
        if (ownersResponse.status === 401) {
          router.push('/login')
          return
        }

        if (!ownersResponse.ok) {
          const errorData = await ownersResponse.json().catch(() => ({ message: `Error al cargar los propietarios (${ownersResponse.status})` }))
          throw new Error(errorData.message || `Error al cargar los propietarios (${ownersResponse.status})`)
        }

        const allOwners: Owner[] = await ownersResponse.json()
        
        // 2. Obtener todos los usuarios con rol copropietario
        const usersResponse = await fetch(`http://localhost:3040/api/users?role=copropietario&condominiumId=${userInfo.condominiumId}`, {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (usersResponse.status === 401) {
          router.push('/login')
          return
        }

        if (!usersResponse.ok) {
          const errorData = await usersResponse.json().catch(() => ({ message: `Error al cargar los usuarios (${usersResponse.status})` }))
          throw new Error(errorData.message || `Error al cargar los usuarios (${usersResponse.status})`)
        }

        const allUsers = await usersResponse.json()
        
        // Filtrar propietarios sin propiedades correctamente
        const ownersWithoutProperties = allOwners.filter(owner => {
          // Verificar si properties existe y es un array vacío
          return !owner.properties || !Array.isArray(owner.properties) || owner.properties.length === 0;
        })
        
        // Filtrar usuarios que no tienen perfil de propietario
        const ownerUserIds = allOwners.map(owner => owner.userId)
        const usersWithoutOwnerProfile = allUsers.filter((user: User) => !ownerUserIds.includes(user.id))
        
        // Convertir usuarios sin perfil a formato compatible
        const usersAsOwners: Owner[] = usersWithoutOwnerProfile.map((user: User) => ({
          id: -user.id, // ID negativo para evitar colisiones
          userId: user.id,
          fullName: user.name || 'Sin nombre',
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status
          },
          properties: [],
          isUserOnly: true // Marcar como usuario sin perfil
        }))
        
        // Combinar ambas listas
        const combinedList = [...ownersWithoutProperties, ...usersAsOwners]
        
        setOwners(combinedList)
        setTotalOwners(combinedList.length)
        setTotalPages(Math.ceil(combinedList.length / rowsPerPage))
      } catch (error: unknown) {
        console.error('Error fetching data:', error)
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('La solicitud tardó demasiado tiempo en completarse')
          } else {
            setError(error.message)
          }
        } else {
          setError('Error desconocido al cargar los datos')
        }
        
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Error al cargar los datos',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    // Solo ejecutamos fetchData si tenemos userInfo
    if (userInfo) {
      fetchData()
    }
  }, [toast, router, userInfo, token, currentPage, rowsPerPage])

  const handleRegisterProperty = (ownerId: number) => {
    router.push(`/property/register?ownerId=${ownerId}`)
  }
  
  const handleRegisterOwner = (userId: number) => {
    router.push(`/owner/register?userId=${userId}&returnTo=unregistered-owners`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Filtrar por tipo (todos, solo propietarios, solo usuarios)
  const filteredByType = owners.filter(owner => {
    if (activeTab === 'all') return true
    if (activeTab === 'owners') return !owner.isUserOnly
    if (activeTab === 'users') return owner.isUserOnly
    return true
  })

  // Filtrar por término de búsqueda
  const filteredOwners = filteredByType.filter(owner =>
    (owner.fullName?.toLowerCase() || owner.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.email?.toLowerCase() || owner.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.documentId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Calculamos los índices para la paginación
  const indexOfLastOwner = currentPage * rowsPerPage
  const indexOfFirstOwner = indexOfLastOwner - rowsPerPage
  const currentOwners = filteredOwners.slice(indexOfFirstOwner, indexOfLastOwner)
  
  const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'superadmin'

  // Función para cambiar visibilidad de columnas
  const toggleColumnVisibility = (columnId: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Función para ordenar
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

  const sortData = (data: Owner[]) => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      // Manejar casos especiales
      switch (sortConfig.key) {
        case 'name':
          aValue = (a.fullName || a.user?.name || '').toLowerCase();
          bValue = (b.fullName || b.user?.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || a.user?.email || '').toLowerCase();
          bValue = (b.email || b.user?.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'documentId':
          aValue = (a.documentId || '').toLowerCase();
          bValue = (b.documentId || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.status || a.user?.status || '').toLowerCase();
          bValue = (b.status || b.user?.status || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          // Solo aplicar toLowerCase si el valor es una cadena
          const aRawValue = a[sortConfig.key as keyof Owner] || '';
          const bRawValue = b[sortConfig.key as keyof Owner] || '';
          aValue = typeof aRawValue === 'string' ? aRawValue.toLowerCase() : aRawValue;
          bValue = typeof bRawValue === 'string' ? bRawValue.toLowerCase() : bRawValue;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando propietarios sin propiedades...</div>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Propietarios sin Propiedades</h1>
              <p className="text-gray-600">
                Total: <span className="font-medium">{filteredOwners.length}</span> propietarios sin propiedades
              </p>
            </div>

            {isAdmin && (
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Link
                  href="/owner/register"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FiUser className="mr-2" />
                  Registrar Propietario
                </Link>
                <Link
                  href="/property/register"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <FiHome className="mr-2" />
                  Registrar Propiedad
                </Link>
              </div>
            )}
          </div>

          {/* Filtros y Tabs */}
          <div className="bg-white mb-6">
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'all'
                          ? 'bg-gray-200 text-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setActiveTab('owners')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'owners'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Solo propietarios
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'users'
                          ? 'bg-green-100 text-green-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Solo usuarios
                    </button>
                  </div>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
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
                  <span>Tabla</span>
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

            {viewMode === 'list' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FiColumns />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.name}
                    onCheckedChange={() => toggleColumnVisibility('name')}
                  >
                    Nombre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.email}
                    onCheckedChange={() => toggleColumnVisibility('email')}
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.phone}
                    onCheckedChange={() => toggleColumnVisibility('phone')}
                  >
                    Teléfono
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.document}
                    onCheckedChange={() => toggleColumnVisibility('document')}
                  >
                    Documento
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumnVisibility('status')}
                  >
                    Estado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.createdAt}
                    onCheckedChange={() => toggleColumnVisibility('createdAt')}
                  >
                    Fecha de Registro
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={() => toggleColumnVisibility('actions')}
                  >
                    Acciones
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando propietarios...</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.name && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Nombre</span>
                          {sortConfig.key === 'name' && (
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
                    )}
                    {visibleColumns.email && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Email</span>
                          {sortConfig.key === 'email' && (
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
                    )}
                    {visibleColumns.phone && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('phone')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Teléfono</span>
                          {sortConfig.key === 'phone' && (
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
                    )}
                    {visibleColumns.document && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('documentId')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Documento</span>
                          {sortConfig.key === 'documentId' && (
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
                    )}
                    {visibleColumns.status && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Estado</span>
                          {sortConfig.key === 'status' && (
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
                    )}
                    {visibleColumns.createdAt && (
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Fecha de Registro</span>
                          {sortConfig.key === 'createdAt' && (
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
                    )}
                    {visibleColumns.actions && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortData(currentOwners).map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      {visibleColumns.name && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {owner.fullName || owner.user?.name || 'Sin nombre'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.email && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.email || owner.user?.email || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.phone && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.phone || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.document && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.documentType && owner.documentId 
                              ? `${owner.documentType}: ${owner.documentId}` 
                              : 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (owner.status === 'active' || owner.user?.status === 'active')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {(owner.status === 'active' || owner.user?.status === 'active') ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.createdAt && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.createdAt 
                              ? format(new Date(owner.createdAt), 'PPP', { locale: es }) 
                              : 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {owner.isUserOnly ? (
                            <button
                              onClick={() => handleRegisterOwner(owner.userId)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <FiUser className="mr-1 h-3 w-3" />
                              Registrar como Propietario
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterProperty(owner.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <FiPlus className="mr-1 h-3 w-3" />
                              Asignar Propiedad
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortData(currentOwners).map((owner) => (
                <div key={owner.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100">
                  <div className="px-6 py-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-xl text-gray-800">
                          {owner.fullName || owner.user?.name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          ID: {owner.id}
                        </div>
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

                      {(owner.documentType || owner.documentId) && (
                        <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <FiUser className="text-gray-400 mr-2" />
                            <span className="font-medium">Documento:</span>
                            <span className="ml-2">
                              {owner.documentType}: {owner.documentId}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <span className="font-medium">Registrado:</span>
                          <span className="ml-2">
                            {format(new Date(owner.createdAt), 'PPP', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
                    {owner.isUserOnly ? (
                      <button
                        onClick={() => handleRegisterOwner(owner.userId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                      >
                        <FiUser className="mr-2" />
                        Registrar como Propietario
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegisterProperty(owner.id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                      >
                        <FiHome className="mr-2" />
                        Asignar Propiedad
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 