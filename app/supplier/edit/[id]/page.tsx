"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface ContactInfo {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  address: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  ContactInfo?: ContactInfo;
}

interface Supplier {
  id: number;
  name: string;
  type: string;
  User?: User;
  status: "active" | "inactive";
  economicActivities: { id: number; name: string }[];
  condominiumId?: number;
}

interface EconomicActivity {
  id: number;
  name: string;
}

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  const { token, userInfo, isLoading: tokenLoading } = useToken();
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mantenemos los estados originales
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier>({
    id: 0,
    name: "",
    type: "individual",
    User: {
      id: 0,
      name: "",
      email: "",
    },
    status: "active",
    economicActivities: [],
  });

  // Extraer el id al iniciar el componente
  useEffect(() => {
    if (params) {
      setSupplierId(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (tokenLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (userInfo?.role !== 'admin' && userInfo?.role !== 'superadmin') {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!supplierId) return;
        
        await fetchSupplier();
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      fetchData();
    }
  }, [token, userInfo, tokenLoading, router, supplierId]);

  const fetchSupplier = async () => {
    try {
      if (!token || !supplierId || !userInfo?.condominiumId) return;
      
      console.log(`Obteniendo información del proveedor con ID: ${supplierId}`);
      
      // Obtener el proveedor específico
      const response = await fetch(`http://localhost:3040/api/suppliers/${supplierId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error al cargar los datos del proveedor: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error("Respuesta del servidor:", errorText);
          throw new Error(`Error al cargar los datos del proveedor: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("Datos del proveedor recibidos:", data);

      // Verificar que el proveedor pertenece al condominio actual
      if (data.condominiumId && Number(data.condominiumId) !== Number(userInfo.condominiumId)) {
        console.log("Error de permisos: El proveedor pertenece a un condominio diferente");
        setError("No tiene permisos para acceder a este proveedor. Por favor, regrese a la lista de proveedores.");
        return;
      }

      // Cargar las actividades económicas disponibles
      const activitiesResponse = await fetch("http://localhost:3040/api/economic-activities", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!activitiesResponse.ok) {
        throw new Error("Error al cargar las actividades económicas");
      }

      const activitiesData = await activitiesResponse.json();

      // Mapear los datos al formato esperado
      const mappedSupplier = {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status || "active",
        User: {
          id: data.User?.id || 0,
          name: data.User?.name || "",
          email: data.User?.email || "",
          ContactInfo: {
            name: data.User?.ContactInfo?.name || "",
            lastname: data.User?.ContactInfo?.lastname || "",
            phone: data.User?.ContactInfo?.phone || "",
            email: data.User?.ContactInfo?.email || "",
            address: data.User?.ContactInfo?.address || ""
          }
        },
        economicActivities: data.economicActivities || []
      };

      setActivities(activitiesData);
      setSupplierData(mappedSupplier);
      
      // Establecer las actividades seleccionadas
      if (mappedSupplier.economicActivities && mappedSupplier.economicActivities.length > 0) {
        const selectedIds = mappedSupplier.economicActivities.map((activity: { id: number; name: string }) => activity.id);
        setSelectedActivities(selectedIds);
      }
    } catch (err) {
      console.error("Error al cargar el proveedor:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los datos del proveedor");
      throw err;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("User.ContactInfo.")) {
      const field = name.split(".")[2];
      setSupplierData(prev => ({
        ...prev,
        User: {
          ...prev.User,
          ContactInfo: {
            ...prev.User?.ContactInfo,
            [field]: value
          }
        }
      }));
    } else {
      setSupplierData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const activityId = parseInt(e.target.value);
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedActivities(prev => [...prev, activityId]);
    } else {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (!supplierId || !userInfo?.condominiumId) {
        throw new Error("Información necesaria no disponible");
      }

      // Validar campos obligatorios
      if (!supplierData.name || !supplierData.type) {
        throw new Error("Los campos nombre y tipo son obligatorios");
      }

      // Validar que al menos un campo de contacto esté lleno
      const hasContactInfo = Object.values(supplierData.User?.ContactInfo).some(value => value && value.trim() !== "");
      if (!hasContactInfo) {
        throw new Error("Debe proporcionar al menos un dato de contacto");
      }

      // Validar que se seleccione al menos una actividad económica
      if (selectedActivities.length === 0) {
        throw new Error("Debe seleccionar al menos una actividad económica");
      }

      // Asegurarnos de que el ID sea un número válido
      const numericId = parseInt(supplierId, 10);
      if (isNaN(numericId)) {
        throw new Error("ID de proveedor inválido");
      }

      // Preparar los datos para enviar
      const dataToSend = {
        name: supplierData.name,
        type: supplierData.type,
        status: supplierData.status,
        User: {
          ...supplierData.User,
          ContactInfo: supplierData.User?.ContactInfo
        },
        economicActivities: selectedActivities
      };

      console.log("Datos a enviar:", dataToSend);
      
      const response = await fetch(`http://localhost:3040/api/suppliers/${numericId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const contentType = response.headers.get("content-type");
      let responseData;
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const errorText = await response.text();
        console.error("Respuesta del servidor (texto):", errorText);
        throw new Error(`Error al actualizar el proveedor: ${response.status}`);
      }

      if (!response.ok) {
        console.error("Error del servidor:", responseData);
        throw new Error(responseData.message || `Error al actualizar el proveedor: ${response.status}`);
      }

      console.log("Respuesta exitosa:", responseData);
      alert("Proveedor actualizado exitosamente");
      router.push("/supplier");
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el proveedor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="text-center">Cargando datos del proveedor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.push("/supplier")}
            className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
          >
            Volver a la lista de proveedores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Editar Proveedor</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Nombre del proveedor"
            name="name"
            value={supplierData.name}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
            required
          />
          <select
            name="type"
            value={supplierData.type}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
            required
          >
            <option value="individual">Individual</option>
            <option value="company">Empresa</option>
          </select>

          <div className="border-t border-gray-300 my-4">
            <h3 className="font-bold mb-2">Información de Contacto</h3>
          </div>
          <input
            type="text"
            placeholder="Nombre de contacto"
            name="User.ContactInfo.name"
            value={supplierData.User?.ContactInfo.name}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Apellido de contacto"
            name="User.ContactInfo.lastname"
            value={supplierData.User?.ContactInfo.lastname}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Teléfono"
            name="User.ContactInfo.phone"
            value={supplierData.User?.ContactInfo.phone}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            name="User.ContactInfo.email"
            value={supplierData.User?.ContactInfo.email}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Dirección"
            name="User.ContactInfo.address"
            value={supplierData.User?.ContactInfo.address}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />

          <div className="mt-4">
            <h3 className="font-bold mb-2">Actividades Económicas</h3>
            <div className="grid grid-cols-2 gap-2">
              {activities.map(activity => (
                <label key={activity.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={activity.id}
                    checked={selectedActivities.includes(activity.id)}
                    onChange={handleActivityChange}
                    className="rounded"
                  />
                  <span>{activity.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => router.push("/supplier")}
              className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 