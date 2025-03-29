"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-1">
            elcondominio.ve
          </h2>
          <p className="text-center text-sm text-gray-600 mb-8">
            Complete el perfil del proveedor
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo de Proveedor
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                <option value="individual">Individual</option>
                <option value="company">Empresa</option>
              </select>
            </div>

            {formData.type === "company" && (
              <div>
                <label htmlFor="contactInfo.companyName" className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  id="contactInfo.companyName"
                  name="contactInfo.companyName"
                  value={formData.contactInfo.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="nic" className="block text-sm font-medium text-gray-700">
                Cédula/RIF
              </label>
              <input
                type="text"
                id="nic"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Teléfono Fijo
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="movil" className="block text-sm font-medium text-gray-700">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  id="movil"
                  name="movil"
                  value={formData.movil}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actividades Económicas
              </label>
              <div className="space-y-2">
                {economicActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`activity-${activity.id}`}
                      checked={selectedActivities.includes(activity.id)}
                      onChange={() => handleActivityChange(activity.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`activity-${activity.id}`} className="ml-2 block text-sm text-gray-900">
                      {activity.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Registrar Proveedor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 