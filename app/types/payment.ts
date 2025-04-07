export type PaymentStatus = 'pending' | 'verified' | 'approved' | 'rejected'

export interface Payment {
  id: number
  receiptId: number
  amount: number
  date: string
  method: string
  reference: string
  status: PaymentStatus
  receipt?: {
    id: number
    month: string
    year: number
    amount: number
    status: ReceiptStatus
    pending_amount: number
    credit_balance: number
    property?: {
      type: string
      number: string
      block?: string
      floor?: string
    }
  }
}

export type ReceiptStatus = 'pending' | 'paid' | 'partial'

export interface PaymentUpdateResponse {
  success: boolean
  payment?: Payment
  error?: string
} 