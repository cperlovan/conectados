import { Suspense } from 'react'
import PaymentDetail from './PaymentDetail'
import Header from '@/app/components/Header'

interface PaymentDetailPageProps {
  params: {
    id: string
  }
}

export default async function AdminPaymentDetailPage({ params }: PaymentDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles del pago...</p>
          </div>
        </div>
      }>
        <PaymentDetail paymentId={params.id} />
      </Suspense>
    </div>
  )
} 