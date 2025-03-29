"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
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

export default function RegisterSupplier() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier>({
    name: "",
    type: "individual",
    contactInfo: {
      name: "",
      lastname: "",
      phone: "",
      email: "",
      address: "",
    },
    status: "active",
    economicActivities: [],
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si el perfil ya está completo
  useEffect(() => {
    const checkProfile = async () => {
      if (!token || !userInfo?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verificando perfil del proveedor...");
        const response = await fetch(`http://localhost:3040/api/suppliers/user/${userInfo.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          console.log("Perfil de proveedor encontrado, redirigiendo a home...");
          router.push("/home");
          return;
        }

        if (response.status === 404) {
          console.log("Perfil de proveedor no encontrado, mostrando formulario...");
        } else {
          console.error("Error al verificar el perfil:", response.status);
        }
      } catch (err) {
        console.error("Error al verificar el perfil:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [token, userInfo?.id, router]);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("http://localhost:3040/api/economic-activities", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar las actividades económicas");
        }

        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error("Error al cargar actividades:", err);
        setError("Error al cargar las actividades económicas");
      }
    };

    if (token) {
      fetchActivities();
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("contactInfo.")) {
      const field = name.split(".")[1];
      setSupplierData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setSupplierData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleActivityChange = (activityId: number) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      }
      return [...prev, activityId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!userInfo?.condominiumId) {
        throw new Error("No se encontró el ID del condominio");
      }

      // Validar campos obligatorios
      if (!supplierData.name || !supplierData.type) {
        throw new Error("Los campos nombre y tipo son obligatorios");
      }

      // Validar que al menos un campo de contacto esté lleno
      const hasContactInfo = Object.values(supplierData.contactInfo).some(value => value && value.trim() !== "");
      if (!hasContactInfo) {
        throw new Error("Debe proporcionar al menos un dato de contacto");
      }

      // Validar que se seleccione al menos una actividad económica
      if (selectedActivities.length === 0) {
        throw new Error("Debe seleccionar al menos una actividad económica");
      }

      // Preparar los datos para enviar
      const dataToSend = {
        ...supplierData,
        economicActivities: selectedActivities,
        userId: userInfo.id,
        condominiumId: userInfo.condominiumId
      };

      console.log("Enviando datos del perfil...");
      const response = await fetch("http://localhost:3040/api/suppliers/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error al completar el perfil: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error("Respuesta del servidor:", errorText);
          throw new Error(`Error al completar el perfil: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("Perfil completado exitosamente:", data);

      // Redirigir a home después de completar el perfil
      console.log("Redirigiendo a home...");
      router.push("/home");
    } catch (err) {
      console.error("Error al completar el perfil:", err);
      setError(err instanceof Error ? err.message : "Error al completar el perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="text-center">Verificando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[800px]">
        <h3 className="text-2xl font-bold mb-2 text-center text-gray-800">elcondominio.ve</h3>
        <h4 className="text-lg mb-6 text-center text-gray-600">Complete su perfil de proveedor</h4>
        
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proveedor:
            </label>
            <input
              type="text"
              name="name"
              value={supplierData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Nombre de su empresa o nombre personal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de proveedor:
            </label>
            <select
              name="type"
              value={supplierData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="individual">Individual</option>
              <option value="company">Empresa</option>
            </select>
          </div>

          <div className="border-t border-gray-300 my-4">
            <h3 className="font-bold mb-4 text-gray-800">Información de Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre:
                </label>
                <input
                  type="text"
                  name="contactInfo.name"
                  value={supplierData.contactInfo.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Nombre de contacto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido:
                </label>
                <input
                  type="text"
                  name="contactInfo.lastname"
                  value={supplierData.contactInfo.lastname}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Apellido de contacto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono:
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={supplierData.contactInfo.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico:
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={supplierData.contactInfo.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección:
                </label>
                <input
                  type="text"
                  name="contactInfo.address"
                  value={supplierData.contactInfo.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <h3 className="font-bold mb-4 text-gray-800">Actividades Económicas</h3>
            <div className="grid grid-cols-2 gap-4">
              {activities.map(activity => (
                <label key={activity.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => handleActivityChange(activity.id)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{activity.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? "Completando perfil..." : "Completar Perfil"}
          </button>
        </form>
      </div>
    </div>
  );
}