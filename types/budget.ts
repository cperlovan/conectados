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
    User?: {
      id: number
      name: string
      email: string
      ContactInfo?: {
        name: string
        lastname: string
      }
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
      email: string
      ContactInfo?: {
        name: string
        lastname: string
      }
    }
  }
  budgetEconomicActivities?: Array<{
    id: number
    name: string
    description: string
  }>
} 