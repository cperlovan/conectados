'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
  user?: {
    id: number
    name: string | null
    email: string
    status: string
  }
  properties?: any[]
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

  const filteredOwners = owners.filter(owner =>
    (owner.fullName?.toLowerCase() || owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.email?.toLowerCase() || owner.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (owner.documentNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
          <div className="text-center">Cargando propietarios...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lista de Propietarios</h1>
          {isAdmin && (
            <Link
              href="/owner/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiPlus className="mr-2" />
              Registrar Propietario
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="ml-4">
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
            <div className="text-center py-4">
              No hay propietarios registrados
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <tr key={owner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {owner.fullName || owner.name || owner.user?.name || 'N/A'}
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
                          {owner.documentType && owner.documentNumber 
                            ? `${owner.documentType}: ${owner.documentNumber}` 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            owner.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.createdAt 
                            ? format(new Date(owner.createdAt), 'dd/MM/yyyy', { locale: es }) 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(owner.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FiEdit2 className="inline h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(owner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline h-4 w-4" />
                        </button>
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
                              ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
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