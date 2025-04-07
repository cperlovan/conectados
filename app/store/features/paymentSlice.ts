import { createSlice, createAsyncThunk, ActionReducerMapBuilder } from '@reduxjs/toolkit'

interface Payment {
  id: number
  status: 'pending' | 'verified' | 'approved' | 'rejected'
  // ... otros campos del pago
}

interface PaymentState {
  payments: Payment[]
  loading: boolean
  error: string | null
}

const initialState: PaymentState = {
  payments: [],
  loading: false,
  error: null
}

export const updatePaymentStatus = createAsyncThunk(
  'payments/updateStatus',
  async ({ paymentId, newStatus }: { paymentId: number, newStatus: Payment['status'] }) => {
    const response = await fetch('/api/update-payment-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentId, status: newStatus })
    })
    
    if (!response.ok) {
      throw new Error('Error al actualizar el estado del pago')
    }
    
    return await response.json()
  }
)

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {},
  extraReducers: (builder: ActionReducerMapBuilder<PaymentState>) => {
    builder
      .addCase(updatePaymentStatus.pending, (state: PaymentState) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePaymentStatus.fulfilled, (state: PaymentState, action: { payload: { payment: Payment } }) => {
        state.loading = false
        const updatedPayment = action.payload.payment
        const index = state.payments.findIndex((p: Payment) => p.id === updatedPayment.id)
        if (index !== -1) {
          state.payments[index] = updatedPayment
        }
      })
      .addCase(updatePaymentStatus.rejected, (state: PaymentState, action: { error: { message?: string } }) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar el pago'
      })
  }
})

export default paymentSlice.reducer 