import { useState, useCallback } from 'react'
import { z } from 'zod'

// Schema para validar la respuesta del endpoint
const CondominiumSelectorSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['active', 'pending', 'inactive']),
  logo: z.string().nullable().optional()
})

export type CondominiumSelector = z.infer<typeof CondominiumSelectorSchema>

const CondominiumSelectorResponseSchema = z.array(CondominiumSelectorSchema)

export const useCondominiumSelector = () => {
  const [condominiums, setCondominiums] = useState<CondominiumSelector[]>([])
  const [filteredCondominiums, setFilteredCondominiums] = useState<CondominiumSelector[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumSelector | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const fetchCondominiums = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Usar el nuevo endpoint seguro que solo devuelve datos mínimos
      const response = await fetch('http://localhost:3040/api/condominium/selector', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // Si el nuevo endpoint no existe, mostrar mensaje al desarrollador en la consola
          console.warn('El endpoint /api/condominium/selector no está disponible. Por favor, implementa este endpoint en el backend para mejorar la seguridad.')
          // Temporalmente usar el endpoint original
          const fallbackResponse = await fetch('http://localhost:3040/api/condominium')
          if (!fallbackResponse.ok) {
            throw new Error('Error al obtener los condominios')
          }
          const data = await fallbackResponse.json()
          // Transformar los datos para solo usar los campos necesarios
          const transformedData = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            status: item.status || 'pending',
            logo: item.logo
          }))
          const validatedData = CondominiumSelectorResponseSchema.parse(transformedData)
          setCondominiums(validatedData)
          setFilteredCondominiums(validatedData)
          return
        }
        throw new Error('Error al obtener los condominios')
      }

      const data = await response.json()
      const validatedData = CondominiumSelectorResponseSchema.parse(data)
      setCondominiums(validatedData)
      setFilteredCondominiums(validatedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching condominiums:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setDropdownOpen(true)
    
    if (!term.trim()) {
      setFilteredCondominiums(condominiums)
      return
    }

    const searchTerms = term.toLowerCase().split(' ')
    const filtered = condominiums.filter(condominium => {
      const condoName = condominium.name.toLowerCase()
      return searchTerms.every(term => condoName.includes(term))
    })
    
    setFilteredCondominiums(filtered)
  }, [condominiums])

  const handleSelect = useCallback((condominium: CondominiumSelector) => {
    setSelectedCondominium(condominium)
    setSearchTerm(condominium.name)
    setDropdownOpen(false)
    localStorage.setItem('selectedCondominiumId', condominium.id.toString())
  }, [])

  const handleInputFocus = useCallback(() => {
    setDropdownOpen(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setDropdownOpen(false)
    }, 200)
  }, [])

  return {
    condominiums: filteredCondominiums,
    isLoading,
    error,
    selectedCondominium,
    searchTerm,
    dropdownOpen,
    fetchCondominiums,
    handleSearch,
    handleSelect,
    handleInputFocus,
    handleInputBlur
  }
} 