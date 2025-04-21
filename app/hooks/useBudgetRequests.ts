'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useToken } from '../hook/useToken'

// Interfaces para datos
interface Supplier {
  id: number
  name: string
  type: string
  userId: number
  condominiumId: number
  user?: {
    id: number
    name: string
    email: string
  }
}

interface Budget {
  id: number
  status: string
  amount: number
  supplierId: number
  createdAt: string
  description?: string
  supplier?: Supplier
}

export interface BudgetRequest {
  id: number
  title: string
  description: string
  details?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string
  createdAt: string
  updatedAt: string
  condominiumId: number
  condominium?: any
  suppliers?: Supplier[]
  economicActivities?: any[]
  budgets?: Budget[]
}

export interface BudgetRequestStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
}

interface BudgetRequestsResponse {
  budgetRequests: BudgetRequest[]
  stats: BudgetRequestStats
}

const API_URL = 'http://localhost:3040/api'

export function useBudgetRequests() {
  const { token, userInfo, isLoading: isTokenLoading } = useToken()
  const queryClient = useQueryClient()
  const [supplierId, setSupplierId] = useState<number | null>(null)

  // Obtener el supplierId si no está disponible en userInfo
  useEffect(() => {
    async function fetchSupplierId() {
      if (!token || !userInfo || userInfo.supplierId || isTokenLoading) return

      try {
        const response = await fetch(`${API_URL}/suppliers/user/${userInfo.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data && data.id) {
            setSupplierId(data.id)
          }
        }
      } catch (error) {
        console.error('Error fetching supplierId:', error)
      }
    }

    fetchSupplierId()
  }, [token, userInfo, isTokenLoading])

  // Query para obtener todas las solicitudes de presupuesto de un proveedor
  const useSupplierBudgetRequests = () => {
    return useQuery<BudgetRequestsResponse>({
      queryKey: ['budgetRequests', 'supplier', supplierId || userInfo?.supplierId],
      queryFn: async () => {
        if (!token) throw new Error('No estás autenticado')
        if (!supplierId && !userInfo?.supplierId) throw new Error('No se encontró ID de proveedor')
        
        const response = await fetch(`${API_URL}/budget-requests/supplier`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Error al obtener solicitudes: ${response.status}`)
        }

        return await response.json()
      },
      enabled: !!token && !isTokenLoading && (!!supplierId || !!userInfo?.supplierId),
      refetchInterval: 60000, // Actualiza cada minuto (opcional)
    })
  }

  // Query para obtener detalles de una solicitud específica
  const useBudgetRequestDetails = (requestId: string | number) => {
    return useQuery<BudgetRequest>({
      queryKey: ['budgetRequest', requestId, supplierId || userInfo?.supplierId],
      queryFn: async () => {
        if (!token) throw new Error('No estás autenticado')
        
        const response = await fetch(`${API_URL}/budget-requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Error al obtener solicitud: ${response.status}`)
        }

        return await response.json()
      },
      enabled: !!token && !isTokenLoading && !!requestId,
      refetchInterval: 60000, // Actualiza cada minuto (opcional)
    })
  }

  // Función para forzar una recarga de los datos
  const refreshBudgetRequests = () => {
    queryClient.invalidateQueries({ queryKey: ['budgetRequests'] })
  }

  const refreshBudgetRequestDetails = (requestId: string | number) => {
    queryClient.invalidateQueries({ queryKey: ['budgetRequest', requestId] })
  }

  return {
    useSupplierBudgetRequests,
    useBudgetRequestDetails,
    refreshBudgetRequests,
    refreshBudgetRequestDetails,
    isTokenLoading,
    supplierId: supplierId || userInfo?.supplierId,
  }
} 