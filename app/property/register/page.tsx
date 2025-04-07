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
  const [searchTerm, setSearchTerm] = useState('')
  const [ownerResults, setOwnerResults] = useState<Owner[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
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

  // Función para buscar propietarios
  const searchOwners = async (query: string) => {
    if (!query?.trim() || query.length < 3 || !userInfo?.condominiumId) {
      setOwnerResults([])
      return
    }

    setIsSearching(true)
    try {
      const tokenToUse = token || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      if (!tokenToUse) {
        router.push('/login')
        return
      }

      // Construir URL con parámetros de búsqueda
      const searchParams = new URLSearchParams({
        query: query.trim(),
        condominiumId: userInfo.condominiumId.toString()
      })

      const response = await fetch(
        `http://localhost:3040/api/owners/search?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Error al buscar propietarios')
      }

      const data = await response.json()
      
      // Asegurarse de que data sea un array y tenga la estructura esperada
      const owners = Array.isArray(data) ? data.map(owner => ({
        id: owner.id,
        fullName: owner.fullName || 'Sin nombre',
        documentType: owner.documentType || 'N/A',
        documentId: owner.documentId || 'N/A',
        email: owner.user?.email || null
      })) : []

      setOwnerResults(owners)
    } catch (error) {
      console.error('Error al buscar propietarios:', error)
      setOwnerResults([])
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al buscar propietarios',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce para la búsqueda con cleanup
  useEffect(() => {
    if (!searchTerm || !userInfo?.condominiumId) return

    const timer = setTimeout(() => {
      searchOwners(searchTerm)
    }, 300)

    return () => {
      clearTimeout(timer)
      setIsSearching(false)
    }
  }, [searchTerm, userInfo?.condominiumId])

  // Manejar la selección de un propietario
  const handleOwnerSelect = (owner: Owner) => {
    if (!owner?.id) {
      console.error('ID de propietario no válido:', owner);
      return;
    }

    console.log('Propietario seleccionado:', owner);
    
    // Actualizar el ID del propietario en el formulario y el propietario seleccionado
    setFormData(prev => {
      console.log('Actualizando formData con ownerId:', owner.id.toString());
      return {
        ...prev,
        ownerId: owner.id.toString()
      };
    });
    
    // Actualizar el propietario seleccionado con todos sus datos
    const ownerToSet = {
      id: owner.id,
      fullName: owner.fullName || 'Sin nombre',
      documentType: owner.documentType || 'N/A',
      documentId: owner.documentId || 'N/A',
      email: owner.email || undefined
    };
    
    console.log('Estableciendo selectedOwner:', ownerToSet);
    setSelectedOwner(ownerToSet);
    
    // Limpiar el término de búsqueda y ocultar resultados
    setSearchTerm('');
    setShowResults(false);
    setOwnerResults([]);
  }

  // Efecto para monitorear cambios en selectedOwner
  useEffect(() => {
    console.log('selectedOwner cambió:', selectedOwner);
  }, [selectedOwner]);

  // Manejar el cierre del dropdown de resultados
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('ownerSearchContainer')
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Registrar Nueva Propiedad</h1>
            <Link
              href="/property"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Volver a la lista
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Información Básica */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número de propiedad */}
                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: A101, 203, Casa 5"
                    />
                  </div>

                  {/* Tipo de propiedad */}
                  <div className="space-y-2">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Tipo de Propiedad *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <option value="apartment">Apartamento</option>
                      <option value="house">Casa</option>
                      <option value="commercial">Local Comercial</option>
                      <option value="parking">Estacionamiento</option>
                      <option value="storage">Depósito</option>
                    </select>
                  </div>

                  {/* Tamaño */}
                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 75.5"
                    />
                  </div>

                  {/* Alícuota */}
                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Piso */}
                  <div className="space-y-2">
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                      Piso
                    </label>
                    <input
                      type="text"
                      id="floor"
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 3, PB"
                    />
                  </div>

                  {/* Bloque/Torre */}
                  <div className="space-y-2">
                    <label htmlFor="block" className="block text-sm font-medium text-gray-700">
                      Bloque/Torre
                    </label>
                    <input
                      type="text"
                      id="block"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: A, Torre Norte"
                    />
                  </div>
                </div>
              </div>

              {/* Estado y Propietario */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Estado y Propietario</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Estado */}
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Estado *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <option value="occupied">Ocupado</option>
                      <option value="vacant">Vacante</option>
                      <option value="under_maintenance">En Mantenimiento</option>
                    </select>
                  </div>

                  {/* Propietario */}
                  {!searchParams.get('ownerId') && (
                    <div className="space-y-2">
                      <label htmlFor="ownerSearch" className="block text-sm font-medium text-gray-700">
                        Buscar Propietario *
                      </label>
                      <div id="ownerSearchContainer" className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            id="ownerSearch"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value)
                              if (e.target.value.length >= 3) {
                                setShowResults(true)
                              }
                            }}
                            onFocus={() => {
                              if (searchTerm.length >= 3) {
                                setShowResults(true)
                              }
                            }}
                            className="block w-full rounded-lg border-gray-300 bg-white pl-4 pr-10 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            placeholder="Buscar por nombre, documento o email..."
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Resultados de búsqueda */}
                        {showResults && searchTerm.length >= 3 && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                            {ownerResults.length > 0 ? (
                              <ul className="py-1 divide-y divide-gray-200">
                                {ownerResults.map((owner) => (
                                  <li
                                    key={owner.id}
                                    onClick={() => handleOwnerSelect(owner)}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                  >
                                    <div className="font-medium text-gray-900">{owner.fullName}</div>
                                    <div className="text-sm text-gray-600">
                                      {owner.documentType}: {owner.documentId}
                                      {owner.email && ` • ${owner.email}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                {isSearching ? 'Buscando...' : 'No se encontraron resultados'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="hidden"
                        name="ownerId"
                        value={formData.ownerId}
                        required
                      />
                      
                      {/* Mostrar información del propietario seleccionado aquí */}
                      {selectedOwner ? (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-800">Propietario seleccionado:</p>
                              <p className="text-sm text-green-700">
                                <strong>Nombre:</strong> {selectedOwner.fullName}
                              </p>
                              <p className="text-sm text-green-700">
                                <strong>Documento:</strong> {selectedOwner.documentType}: {selectedOwner.documentId}
                              </p>
                              {selectedOwner.email && (
                                <p className="text-sm text-green-700">
                                  <strong>Email:</strong> {selectedOwner.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          {searchTerm.length > 0 && searchTerm.length < 3 
                            ? `Ingrese ${3 - searchTerm.length} caracteres más para buscar`
                            : 'Ingrese al menos 3 caracteres para buscar un propietario'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Información Adicional</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 2"
                    />
                  </div>

                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 1.5"
                    />
                  </div>

                  <div className="space-y-2">
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
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Ej: 1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="additionalInfo.description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="additionalInfo.description"
                    name="additionalInfo.description"
                    value={formData.additionalInfo.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Detalles adicionales de la propiedad"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="submit"
                  disabled={loading || ownerLoading}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    "Registrar Propiedad"
                  )}
                </button>
                <Link
                  href="/property"
                  className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 