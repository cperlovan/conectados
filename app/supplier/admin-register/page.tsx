"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";
import Link from "next/link";

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
}

interface Supplier {
  name: string;
  type: string;
  contactInfo: {
    name: string;
    lastname: string;
    phone: string;
    email: string;
    address: string;
  };
  status: "active" | "inactive";
  economicActivities: number[];
}

export default function AdminRegisterSupplier() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [loading, setLoading] = useState(false);
  const [economicActivities, setEconomicActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    lastname: "",
    nic: "",
    telephone: "",
    movil: "",
    address: "",
    type: "individual",
    contactInfo: {
      companyName: "",
      name: "",
      lastname: "",
      position: "",
      telephone: "",
      movil: "",
      email: "",
      address: ""
    }
  });

  useEffect(() => {
    const fetchEconomicActivities = async () => {
      if (!token) return;
      
      try {
        const response = await fetch("/api/economic-activities", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar las actividades económicas');
        }
        
        const data = await response.json();
        setEconomicActivities(data);
      } catch (error) {
        console.error("Error al cargar actividades económicas:", error);
        setError("Error al cargar las actividades económicas");
      }
    };

    fetchEconomicActivities();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("contactInfo.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleActivityChange = (activityId: number) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("No hay token disponible");
      }

      if (!formData.email) {
        throw new Error("El correo electrónico es obligatorio");
      }

      if (selectedActivities.length === 0) {
        throw new Error("Debe seleccionar al menos una actividad económica");
      }

      // Normalizar el email
      const normalizedEmail = formData.email.toLowerCase().trim();
      console.log("Email normalizado:", normalizedEmail);

      // Primero buscar el usuario por email para obtener su ID
      const userResponse = await fetch(`http://localhost:3040/api/users/email/${encodeURIComponent(normalizedEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          toast.error('El usuario no existe. Debe registrarse primero en el sistema.');
          return;
        }
        throw new Error('Error al buscar el usuario');
      }

      const userData = await userResponse.json();
      console.log("Usuario encontrado:", userData);

      // Verificar que el usuario tenga el rol de proveedor
      if (userData.role !== "proveedor") {
        toast.error('El usuario no tiene el rol de proveedor.');
        return;
      }

      const data = {
        userId: userData.id,
        name: formData.type === "company" ? formData.contactInfo.companyName : formData.name,
        type: formData.type,
        contactInfo: {
          name: formData.name,
          lastname: formData.lastname,
          phone: formData.telephone || formData.movil,
          email: normalizedEmail,
          address: formData.address,
          position: formData.contactInfo.position
        },
        economicActivities: selectedActivities,
        condominiumId: userData.condominiumId
      };

      console.log("Datos a enviar:", data);
      console.log("Token disponible:", !!token);

      const response = await fetch('http://localhost:3040/api/suppliers/admin-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log("Estado de la respuesta:", response.status);
      const responseText = await response.text();
      console.log("Respuesta del servidor (texto):", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error al parsear la respuesta:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      console.log("Respuesta del servidor (parseada):", result);

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar el proveedor');
      }

      toast.success('Proveedor registrado exitosamente');
      router.push('/supplier');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Registrar Nuevo Proveedor</h1>
            <Link
              href="/supplier"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Volver a la lista
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Tipo de Proveedor */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Tipo de Proveedor</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Tipo *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Empresa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  {formData.type === 'company' ? 'Información de la Empresa' : 'Información Personal'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.type === 'company' && (
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="contactInfo.companyName" className="block text-sm font-medium text-gray-700">
                        Nombre de la Empresa *
                      </label>
                      <input
                        type="text"
                        id="contactInfo.companyName"
                        name="contactInfo.companyName"
                        value={formData.contactInfo.companyName}
                        onChange={handleChange}
                        required={formData.type === 'company'}
                        className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                      Teléfono Fijo
                    </label>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="movil" className="block text-sm font-medium text-gray-700">
                      Teléfono Móvil *
                    </label>
                    <input
                      type="tel"
                      id="movil"
                      name="movil"
                      value={formData.movil}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Actividades Económicas */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Actividades Económicas</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Seleccione las actividades económicas que realiza el proveedor *</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {economicActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`activity-${activity.id}`}
                          checked={selectedActivities.includes(activity.id)}
                          onChange={() => handleActivityChange(activity.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`activity-${activity.id}`} className="text-sm text-gray-700">
                          {activity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    "Registrar Proveedor"
                  )}
                </button>
                <Link
                  href="/supplier"
                  className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 