"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
}

interface Supplier {
  id: number;
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
  economicActivities: Array<{
    id: number;
    name: string;
  }>;
}

export default function EditSupplier({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier>({
    id: 0,
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
  const [loading, setLoading] = useState(true);

  // Desenvolver los parámetros de ruta usando React.use()
  const { id } = React.use(params);
  const supplierId = Number(id);

  if (isNaN(supplierId)) {
    setError("ID de proveedor inválido");
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ID de proveedor inválido
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

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!token || !userInfo?.condominiumId) {
        console.log("No hay token o condominiumId disponible");
        return;
      }

      try {
        console.log("Intentando cargar proveedor con ID:", supplierId);
        console.log("CondominiumId del usuario:", userInfo.condominiumId);
        
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
          if (isMounted) {
            setError("No tiene permisos para acceder a este proveedor. Por favor, regrese a la lista de proveedores.");
            setLoading(false);
          }
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
          contactInfo: {
            name: data.contactInfo?.name || "",
            lastname: data.contactInfo?.lastname || "",
            phone: data.contactInfo?.phone || "",
            email: data.contactInfo?.email || "",
            address: data.contactInfo?.address || ""
          },
          economicActivities: data.economicActivities || []
        };

        if (isMounted) {
          setActivities(activitiesData);
          setSupplierData(mappedSupplier);
          
          // Establecer las actividades seleccionadas
          if (mappedSupplier.economicActivities && mappedSupplier.economicActivities.length > 0) {
            const selectedIds = mappedSupplier.economicActivities.map((activity: { id: number; name: string }) => activity.id);
            setSelectedActivities(selectedIds);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error completo:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error al cargar los datos");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [token, supplierId, userInfo?.condominiumId]);

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

      // Asegurarnos de que el ID sea un número válido
      const numericId = parseInt(supplierId.toString(), 10);
      if (isNaN(numericId)) {
        throw new Error("ID de proveedor inválido");
      }

      // Preparar los datos para enviar
      const dataToSend = {
        name: supplierData.name,
        type: supplierData.type,
        status: supplierData.status,
        contactInfo: {
          name: supplierData.contactInfo.name,
          lastname: supplierData.contactInfo.lastname,
          phone: supplierData.contactInfo.phone,
          email: supplierData.contactInfo.email,
          address: supplierData.contactInfo.address
        },
        economicActivities: selectedActivities
      };

      console.log("Datos a enviar:", dataToSend);
      console.log("ID del proveedor (numérico):", numericId);
      console.log("CondominiumId:", userInfo.condominiumId);

      const response = await fetch(`http://localhost:3040/api/suppliers/${numericId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const contentType = response.headers.get("content-type");
      let errorData;
      
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const errorText = await response.text();
        console.error("Respuesta del servidor (texto):", errorText);
        throw new Error(`Error al actualizar el proveedor: ${response.status}`);
      }

      if (!response.ok) {
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.message || `Error al actualizar el proveedor: ${response.status}`);
      }

      console.log("Respuesta exitosa:", errorData);

      alert("Proveedor actualizado exitosamente");
      router.push("/supplier");
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar el proveedor");
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
            name="contactInfo.name"
            value={supplierData.contactInfo.name}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Apellido de contacto"
            name="contactInfo.lastname"
            value={supplierData.contactInfo.lastname}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Teléfono"
            name="contactInfo.phone"
            value={supplierData.contactInfo.phone}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            name="contactInfo.email"
            value={supplierData.contactInfo.email}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Dirección"
            name="contactInfo.address"
            value={supplierData.contactInfo.address}
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
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => handleActivityChange(activity.id)}
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