'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { FiEdit2, FiPlus, FiAlertTriangle, FiUser, FiHome } from 'react-icons/fi'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Propietarios sin Propiedades</h1>
            <p className="text-gray-600 mt-1">Usuarios con rol de copropietario que aún no tienen propiedades registradas</p>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <>
                <Link
                  href="/owner/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiUser className="mr-2" />
                  Registrar Propietario
                </Link>
                <Link
                  href="/property/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiHome className="mr-2" />
                  Registrar Propiedad
                </Link>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          {/* Filtros y Tabs */}
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
              <div className="flex space-x-2">
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
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
            </div>
          </div>

          {filteredOwners.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resultados disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' && "No se encontraron propietarios ni usuarios sin propiedades."}
                {activeTab === 'owners' && "No se encontraron propietarios sin propiedades."}
                {activeTab === 'users' && "No se encontraron usuarios sin perfil de propietario."}
              </p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOwners.map((owner) => (
                    <tr key={owner.id} className={owner.isUserOnly ? "bg-green-50" : "bg-yellow-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          owner.isUserOnly 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {owner.isUserOnly ? 'Usuario sin perfil' : 'Propietario sin propiedades'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {owner.fullName || owner.user?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.email || owner.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.documentType && owner.documentId 
                            ? `${owner.documentType}: ${owner.documentId}` 
                            : 'N/A'}
                        </div>
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.createdAt 
                            ? format(new Date(owner.createdAt), 'dd/MM/yyyy', { locale: es }) 
                            : 'N/A'}
                        </div>
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstOwner + 1}</span> a{' '}
                      <span className="font-medium">
                        {indexOfLastOwner > filteredOwners.length ? filteredOwners.length : indexOfLastOwner}
                      </span>{' '}
                      de <span className="font-medium">{filteredOwners.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                          currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        Anterior
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === i + 1
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-600 z-10'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                          currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 