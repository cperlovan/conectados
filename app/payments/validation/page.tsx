'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/app/hook/useToken';

export default function PaymentValidationRedirect() {
  const router = useRouter();
  const { userInfo, isLoading } = useToken();

  useEffect(() => {
    // If user data is still loading, wait
    if (isLoading) return;
    
    // Check if the user is admin or superadmin
    if (userInfo?.role === 'admin' || userInfo?.role === 'superadmin') {
      router.push('/admin/payments');
    } else {
      // If not admin, redirect to home page
      router.push('/');
    }
  }, [router, userInfo, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <p className="text-gray-600">Redireccionando a la página de verificación de pagos...</p>
      </div>
    </div>
  );
} 