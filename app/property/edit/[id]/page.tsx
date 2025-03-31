'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToken } from '@/app/hook/useToken'
import { useToast } from '@/hooks/use-toast'
import Header from '@/app/components/Header'
import Link from 'next/link'

interface Owner {
  id: number
  fullName: string
  documentId: string
  documentType: string
  email?: string
}

export default function EditProperty() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()
  const { userInfo, token } = useToken()
  const [loading, setLoading] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [propertyLoaded, setPropertyLoaded] = useState(false)
  
  const [formData, setFormData] = useState({
    number: '',
    type: 'apartment',
    size: '',
    aliquot: '',
    floor: '',
    block: '',
    status: 'occupied',
    ownerId: '',
    additionalInfo: {
      bedrooms: '',
      bathrooms: '',
      parkingSpots: '',
      description: ''
    }
  })

  // Cargar la lista de propietarios
  useEffect(() => {
    fetchOwners()
  }, [token])

  // Cargar los datos de la propiedad al iniciar
  useEffect(() => {
    if (propertyId && token) {
      fetchPropertyData(propertyId)
    }
  }, [propertyId, token])

  const fetchOwners = async () => {
    try {
      if (!userInfo?.condominiumId || !token) return
      
      const response = await fetch(`http://localhost:3040/api/owners/condominium/${userInfo.condominiumId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Error al cargar propietarios')

      const ownersData = await response.json()
      setOwners(ownersData)
    } catch (error) {
      console.error('Error al cargar propietarios:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los propietarios',
        variant: 'destructive'
      })
    }
  }

  const fetchPropertyData = async (id: string) => {
    setLoading(true)
    try {
      const tokenToUse = token || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      if (!tokenToUse) {
        router.push('/login')
        return
      }

      // Obtener detalles de la propiedad
      const response = await fetch(`http://localhost:3040/api/properties/${id}`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener detalles de la propiedad')
      }

      const propertyData = await response.json()
      
      // Formatear datos para el formulario
      setFormData({
        number: propertyData.number || '',
        type: propertyData.type || 'apartment',
        size: propertyData.size?.toString() || '',
        aliquot: propertyData.aliquot?.toString() || '',
        floor: propertyData.floor || '',
        block: propertyData.block || '',
        status: propertyData.status || 'occupied',
        ownerId: propertyData.ownerId?.toString() || '',
        additionalInfo: {
          bedrooms: propertyData.additionalInfo?.bedrooms?.toString() || '',
          bathrooms: propertyData.additionalInfo?.bathrooms?.toString() || '',
          parkingSpots: propertyData.additionalInfo?.parkingSpots?.toString() || '',
          description: propertyData.additionalInfo?.description || ''
        }
      })
      
      setPropertyLoaded(true)
      
      // Si hay un propietario, cargar sus detalles
      if (propertyData.ownerId) {
        fetchOwnerDetails(propertyData.ownerId.toString())
      }
    } catch (error) {
      console.error('Error al obtener detalles de la propiedad:', error)
      setError(error instanceof Error ? error.message : 'Error al obtener detalles de la propiedad')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al obtener detalles de la propiedad',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOwnerDetails = async (ownerId: string) => {
    setOwnerLoading(true)
    try {
      const tokenToUse = token || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      if (!tokenToUse) {
        router.push('/login')
        return
      }

      // Obtener detalles del propietario
      const response = await fetch(`http://localhost:3040/api/owners/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener detalles del propietario')
      }

      const ownerData = await response.json()
      setSelectedOwner(ownerData)
    } catch (error) {
      console.error('Error al obtener detalles del propietario:', error)
      toast({
        title: 'Error',
        description: 'Error al obtener detalles del propietario',
        variant: 'destructive'
      })
    } finally {
      setOwnerLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      // Manejar cambios en objetos anidados como additionalInfo
      const [parent, child] = name.split('.')
      if (parent === 'additionalInfo') {
        setFormData(prev => ({
          ...prev,
          additionalInfo: {
            ...prev.additionalInfo,
            [child]: value
          }
        }))
      }
    } else if (name === 'ownerId' && value) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      fetchOwnerDetails(value)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const tokenToUse = token || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      if (!tokenToUse) {
        router.push('/login')
        return
      }

      // Verificar que tengamos un propietario seleccionado
      if (!formData.ownerId) {
        throw new Error('Debe seleccionar un propietario')
      }

      // Formatear datos para envío
      const dataToSend = {
        ...formData,
        aliquot: parseFloat(formData.aliquot),
        size: formData.size ? parseFloat(formData.size) : null,
        ownerId: parseInt(formData.ownerId)
      }

      // Actualizar datos en el servidor
      const response = await fetch(`http://localhost:3040/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error al actualizar la propiedad: ${response.status}`)
      }

      const result = await response.json()
      
      toast({
        title: 'Éxito',
        description: 'Propiedad actualizada correctamente'
      })

      // Redirigir a la lista de propiedades
      router.push('/property')
    } catch (error) {
      console.error('Error al actualizar propiedad:', error)
      setError(error instanceof Error ? error.message : 'Error al actualizar la propiedad')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar la propiedad',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !propertyLoaded) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl font-semibold">Cargando datos de la propiedad...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Editar Propiedad</h1>
          <Link
            href="/property"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Volver a Propiedades
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                  Número o Identificador de Propiedad*
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  required
                  value={formData.number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo*
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="office">Oficina</option>
                  <option value="commercial">Local Comercial</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="block" className="block text-sm font-medium text-gray-700">
                  Bloque/Torre
                </label>
                <input
                  type="text"
                  id="block"
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                  Piso
                </label>
                <input
                  type="text"
                  id="floor"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                  Área (m²)
                </label>
                <input
                  type="number"
                  id="size"
                  name="size"
                  min="0"
                  step="0.01"
                  value={formData.size}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="aliquot" className="block text-sm font-medium text-gray-700">
                  Alícuota (%)*
                </label>
                <input
                  type="number"
                  id="aliquot"
                  name="aliquot"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.aliquot}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado*
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="occupied">Ocupada</option>
                  <option value="vacant">Vacante</option>
                </select>
              </div>

              <div>
                <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                  Propietario*
                </label>
                <select
                  id="ownerId"
                  name="ownerId"
                  required
                  value={formData.ownerId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar propietario</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.fullName || 'Sin nombre'} - {owner.documentType} {owner.documentId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="additionalInfo.bedrooms" className="block text-sm font-medium text-gray-700">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    id="additionalInfo.bedrooms"
                    name="additionalInfo.bedrooms"
                    min="0"
                    value={formData.additionalInfo.bedrooms}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="additionalInfo.bathrooms" className="block text-sm font-medium text-gray-700">
                    Baños
                  </label>
                  <input
                    type="number"
                    id="additionalInfo.bathrooms"
                    name="additionalInfo.bathrooms"
                    min="0"
                    value={formData.additionalInfo.bathrooms}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="additionalInfo.parkingSpots" className="block text-sm font-medium text-gray-700">
                    Estacionamientos
                  </label>
                  <input
                    type="number"
                    id="additionalInfo.parkingSpots"
                    name="additionalInfo.parkingSpots"
                    min="0"
                    value={formData.additionalInfo.parkingSpots}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="additionalInfo.description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="additionalInfo.description"
                    name="additionalInfo.description"
                    value={formData.additionalInfo.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <Link
                href="/property"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 