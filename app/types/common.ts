export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FilterParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any // Para filtros dinámicos específicos
}

export interface ErrorResponse {
  message: string
  error: string
  status: number
  details?: Record<string, string[]>
}

export interface SuccessResponse {
  message: string
  status: number
  data?: any // Se puede hacer más específico según el caso de uso
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiError extends Error {
  status?: number
  response?: ErrorResponse
} 