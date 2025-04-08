export interface Budget {
  id: number
  title: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'approved' | 'rejected'
  supplierId: number
  condominiumId: number
  createdAt: string
  updatedAt: string
  details?: string
  supplier?: {
    id: number
    name: string
    type: string
    userId: number
    condominiumId: number
    contactInfo?: {
      movil?: string
      phone?: string
      address?: string
      companyName?: string
    }
    User?: {
      id: number
      name: string
      lastname?: string
      email: string
    }
  }
  budgetSupplier?: {
    id: number
    name: string
    type: string
    userId: number
    condominiumId: number
    email: string
    User?: {
      id: number
      name: string
      lastname?: string
      email: string
    }
  }
  budgetEconomicActivities?: Array<{
    id: number
    name: string
    description: string
  }>
} 