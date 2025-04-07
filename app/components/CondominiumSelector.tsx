'use client'

import { useEffect } from 'react'
import { Input, Spinner } from '@nextui-org/react'
import { useCondominiumSelector } from '../hooks/useCondominiumSelector'
import { CondominiumSelector as CondominiumType } from '../types/condominium'
import { FiSearch, FiCheck, FiClock, FiX } from 'react-icons/fi'

interface CondominiumSelectorProps {
  onSelect?: (condominium: CondominiumType) => void
  className?: string
}

export function CondominiumSelector({ onSelect, className }: CondominiumSelectorProps) {
  const {
    condominiums,
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
  } = useCondominiumSelector()

  useEffect(() => {
    fetchCondominiums()
  }, [fetchCondominiums])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FiCheck className="text-green-500" />
      case 'pending':
        return <FiClock className="text-yellow-500" />
      case 'inactive':
        return <FiX className="text-red-500" />
      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-800 mb-1">
        Seleccionar Condominio:
      </label>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          classNames={{
            base: "w-full",
            input: "p-2",
            inputWrapper: "border border-gray-300 hover:border-gray-400 focus-within:!border-blue-500 rounded-md transition-colors"
          }}
          placeholder="Buscar condominio..."
          startContent={<FiSearch className="text-gray-400" />}
          endContent={isLoading && <Spinner size="sm" />}
        />
        {dropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {condominiums.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No se encontraron condominios
              </div>
            ) : (
              condominiums.map((condominium) => (
                <div
                  key={condominium.id}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${
                    selectedCondominium?.id === condominium.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    handleSelect(condominium)
                    onSelect?.(condominium)
                  }}
                >
                  {condominium.logo && (
                    <img
                      src={condominium.logo}
                      alt={`Logo de ${condominium.name}`}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-grow">
                    <span className="text-gray-900">{condominium.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {getStatusIcon(condominium.status)}
                    <span className={`
                      ${condominium.status === 'active' ? 'text-green-600' : ''}
                      ${condominium.status === 'pending' ? 'text-yellow-600' : ''}
                      ${condominium.status === 'inactive' ? 'text-red-600' : ''}
                    `}>
                      {condominium.status === 'active' ? 'Activo' : 
                       condominium.status === 'pending' ? 'Pendiente' : 
                       'Inactivo'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
} 