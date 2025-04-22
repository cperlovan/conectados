'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/app/hook/useToken';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea is available
// import { useToast } from '@/hooks/use-toast'; // Uncomment if using toasts

// Interface for Condominium Data (adjust fields as needed)
interface CondominiumData {
  name: string;
  rif: string;
  address: string;
  contact_person?: string;
  contact_phone?: string;
  email?: string;
  // Add other relevant fields
}

export default function EditCondominiumPage() {
  const router = useRouter();
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  // const { toast } = useToast(); // Uncomment if using toasts
  const [formData, setFormData] = useState<CondominiumData>({
    name: '',
    rif: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    email: '',
    // Initialize other fields
  });
  const [initialLoading, setInitialLoading] = useState(true); // For fetching initial data
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch current condominium data
  useEffect(() => {
    if (tokenLoading) return; // Wait for token/user info

    if (!token) {
      router.push('/login');
      return;
    }

    if (userInfo && userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
      setError('No tienes permisos para acceder a esta página.');
      setInitialLoading(false);
      // Optionally redirect: router.push('/unauthorized');
      return;
    }

    if (userInfo && userInfo.condominiumId) {
      const fetchCondoData = async () => {
        setInitialLoading(true);
        setError(null);
        try {
          // *** Use the correct GET endpoint ***
          console.log(`Fetching data for condominium ID: ${userInfo.condominiumId}`);
          const response = await fetch(`http://localhost:3040/api/condominium/${userInfo.condominiumId}`, { // Correct URL
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Error al obtener los datos del condominio');
          }
          const data: CondominiumData = await response.json();
          setFormData(data); // Pre-fill form
        } catch (err) {
          console.error("Error fetching condo data:", err);
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
          // Optionally show toast: toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
        } finally {
          setInitialLoading(false);
        }
      };
      fetchCondoData();
    } else if (!userInfo?.condominiumId && userInfo?.role !== 'superadmin') {
      setError('ID de condominio no encontrado.');
      setInitialLoading(false);
    } else {
       setInitialLoading(false); // Handle cases where ID might not be needed immediately (e.g., superadmin selecting) - adjust if needed
    }

  }, [token, userInfo, tokenLoading, router]); // Removed toast

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInfo?.condominiumId) {
        setError('No se puede guardar sin un ID de condominio.');
        // toast({ title: 'Error', description: 'ID de condominio no válido.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
       // *** Use the correct PUT endpoint ***
       console.log(`Updating condominium ID: ${userInfo.condominiumId}`);
       const response = await fetch(`http://localhost:3040/api/condominium/${userInfo.condominiumId}`, { // Correct URL
         method: 'PUT',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
       });

       if (!response.ok) {
         const errorData = await response.json().catch(() => ({})); // Try to parse error
         throw new Error(errorData.message || 'Error al guardar los cambios');
       }

       // Handle success
       console.log('Condominium updated successfully');
       alert('Datos del condominio actualizados exitosamente.'); // Simple alert for now
       // toast({ title: 'Éxito', description: 'Datos guardados correctamente.' });
       // Optionally redirect or refresh data
       // router.push('/admin/dashboard'); // Example redirect

    } catch (err) {
      console.error("Error updating condo data:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al guardar';
      setError(errorMessage);
      // toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Logic
  if (tokenLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando datos del condominio...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Editar Datos del Condominio</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Example Fields - Add/Remove based on your Condominium model */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Condominio
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full"
                placeholder="Ej: Residencias El Parque"
              />
            </div>

            <div>
              <label htmlFor="rif" className="block text-sm font-medium text-gray-700 mb-1">
                RIF
              </label>
              <Input
                id="rif"
                name="rif"
                type="text"
                required
                value={formData.rif}
                onChange={handleChange}
                className="w-full"
                placeholder="Ej: J-12345678-9"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="w-full shadow-sm border border-gray-300 rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección completa del condominio"
              />
            </div>

             <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email de Contacto (Administración)
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full"
                placeholder="Ej: admin@condominio.com"
              />
            </div>

             <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto (Opcional)
              </label>
              <Input
                id="contact_person"
                name="contact_person"
                type="text"
                value={formData.contact_person || ''}
                onChange={handleChange}
                className="w-full"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de Contacto (Opcional)
              </label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                value={formData.contact_phone || ''}
                onChange={handleChange}
                className="w-full"
                placeholder="Ej: 0414-1234567"
              />
            </div>

            {/* Add more fields as needed */}

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()} // Or redirect to a specific admin page
                className="mr-3"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 