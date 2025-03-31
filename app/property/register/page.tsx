'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function RegisterProperty() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { userInfo, token } = useToken()
  const [loading, setLoading] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  
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

  // Obtener el ownerId de la URL si existe
  useEffect(() => {
    const ownerId = searchParams.get('ownerId')
    if (ownerId) {
      setFormData(prev => ({...prev, ownerId}))
      fetchOwnerDetails(ownerId)
    }
  }, [searchParams])

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
      
      // Asegurarse de que se use el ID del Owner de la tabla Owners
      console.log(`Owner ID seleccionado: ${ownerId} (tabla Owners, no User ID)`)
    } catch (error) {
      console.error('Error al obtener detalles del propietario:', error)
      setError(error instanceof Error ? error.message : 'Error al obtener detalles del propietario')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al obtener detalles del propietario',
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

      // Verificar que tengamos un condominio asociado al usuario
      if (!userInfo?.condominiumId) {
        throw new Error('No hay un condominio asociado al usuario')
      }

      // Formatear datos para envío
      const dataToSend = {
        ...formData,
        aliquot: parseFloat(formData.aliquot),
        size: formData.size ? parseFloat(formData.size) : null,
        ownerId: parseInt(formData.ownerId),
        condominiumId: userInfo.condominiumId
      }
      
      console.log('Enviando propiedad con ownerId:', dataToSend.ownerId, '(tabla Owners, no User ID)')

      // Enviar datos al servidor
      const response = await fetch('http://localhost:3040/api/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error al crear la propiedad: ${response.status}`)
      }

      const result = await response.json()
      
      toast({
        title: 'Éxito',
        description: 'Propiedad registrada correctamente'
      })

      // Redirigir a la lista de propiedades
      router.push('/property')
    } catch (error) {
      console.error('Error al registrar propiedad:', error)
      setError(error instanceof Error ? error.message : 'Error al registrar la propiedad')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar la propiedad',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Registrar Nueva Propiedad</h1>
          <Link
            href="/property"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver a la lista
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
            {error}
          </div>
        )}

        {selectedOwner && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-4 mb-6">
            <div className="text-lg font-medium">Propietario seleccionado:</div>
            <div>Nombre: {selectedOwner.fullName}</div>
            <div>Documento: {selectedOwner.documentType}: {selectedOwner.documentId}</div>
            {selectedOwner.email && <div>Email: {selectedOwner.email}</div>}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número de propiedad */}
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                  Número/Identificador de Propiedad *
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: A101, 203, Casa 5"
                />
              </div>

              {/* Tipo de propiedad */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de Propiedad *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="commercial">Local Comercial</option>
                  <option value="parking">Estacionamiento</option>
                  <option value="storage">Depósito</option>
                </select>
              </div>

              {/* Tamaño */}
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                  Tamaño (m²)
                </label>
                <input
                  type="number"
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: 75.5"
                />
              </div>

              {/* Alícuota */}
              <div>
                <label htmlFor="aliquot" className="block text-sm font-medium text-gray-700">
                  Alícuota (%) *
                </label>
                <input
                  type="number"
                  id="aliquot"
                  name="aliquot"
                  value={formData.aliquot}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: 2.5"
                />
              </div>

              {/* Piso */}
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: 3, PB"
                />
              </div>

              {/* Bloque/Torre */}
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: A, Torre Norte"
                />
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="occupied">Ocupado</option>
                  <option value="vacant">Vacante</option>
                  <option value="under_maintenance">En Mantenimiento</option>
                </select>
              </div>

              {/* Propietario (oculto si ya viene en la URL) */}
              {!searchParams.get('ownerId') && (
                <div>
                  <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                    ID del Propietario *
                  </label>
                  <input
                    type="text"
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ingrese el ID del propietario"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Ingrese el ID del propietario o selecciónelo desde la{" "}
                    <Link href="/owner/list-owners" className="text-indigo-600 hover:text-indigo-900">
                      lista de propietarios
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Información adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label htmlFor="additionalInfo.bedrooms" className="block text-sm font-medium text-gray-700">
                    Dormitorios
                  </label>
                  <input
                    type="number"
                    id="additionalInfo.bedrooms"
                    name="additionalInfo.bedrooms"
                    value={formData.additionalInfo.bedrooms}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 2"
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
                    value={formData.additionalInfo.bathrooms}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 1.5"
                  />
                </div>

                <div>
                  <label htmlFor="additionalInfo.parkingSpots" className="block text-sm font-medium text-gray-700">
                    Puestos de Estacionamiento
                  </label>
                  <input
                    type="number"
                    id="additionalInfo.parkingSpots"
                    name="additionalInfo.parkingSpots"
                    value={formData.additionalInfo.parkingSpots}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="additionalInfo.description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <input
                  type="text"
                  id="additionalInfo.description"
                  name="additionalInfo.description"
                  value={formData.additionalInfo.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Detalles adicionales de la propiedad"
                />
              </div>
            </div>

            {/* Botón de envío */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading || ownerLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (loading || ownerLoading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Registrando...' : 'Registrar Propiedad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 