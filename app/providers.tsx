'use client'

import {NextUIProvider} from '@nextui-org/react'
import {useRouter} from 'next/navigation'
import { 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({children}: { children: React.ReactNode }) {
  const router = useRouter()
  
  // Crear una instancia de QueryClient para cada sesión de cliente
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Configurar opciones globales para React Query
        staleTime: 30 * 1000, // 30 segundos antes de considerar los datos obsoletos
        retry: 1, // Sólo un intento de reintento
        refetchOnWindowFocus: true, // Actualizar al volver a enfocar la ventana
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={router.push}>
        {children}
      </NextUIProvider>
    </QueryClientProvider>
  )
} 