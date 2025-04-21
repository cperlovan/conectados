"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";

interface ContactInfo {
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  companyName?: string;
  position?: string;
}

interface User {
  id: number;
  name?: string;
  lastname?: string;
  email?: string;
  telephone?: string;
  movil?: string;
  address?: string;
  nic?: string;
}

interface Supplier {
  id: number;
  name: string;
  type: string;
  User: User;
  contactInfo?: ContactInfo;
  condominiumId?: number;
  economicActivities?: any[];
  status?: "active" | "inactive";
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
      setActivities(activitiesData); // Guardamos las actividades económicas disponibles

      // Actualizar el estado con los datos del proveedor
      setSupplierData((prev: Supplier) => ({
        ...prev,
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status || "active",
        contactInfo: data.contactInfo || {},
        User: {
          id: data.User?.id || 0,
          name: data.User?.name || "",
          lastname: data.User?.lastname || "",
          email: data.User?.email || "",
          telephone: data.User?.telephone || "",
          movil: data.User?.movil || "",
          address: data.User?.address || "",
          nic: data.User?.nic || ""
        },
        economicActivities: data.economicActivities || []
      }));
      
      // Establecer las actividades seleccionadas
      if (data.economicActivities && data.economicActivities.length > 0) {
        const selectedIds = data.economicActivities.map((activity: { id: number; name: string }) => activity.id);
        console.log("Actividades seleccionadas del proveedor:", selectedIds);
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
    
    if (name.startsWith("User.")) {
      const field = name.split(".")[1];
      setSupplierData(prev => ({
        ...prev,
        User: {
          ...prev.User,
          [field]: value
        }
      }));
    } else if (name.startsWith("contactInfo.")) {
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

  const handleActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const activityId = parseInt(e.target.value);
    const isChecked = e.target.checked;

    console.log(`Cambiando actividad ${activityId} a ${isChecked ? 'seleccionada' : 'no seleccionada'}`);

    if (isChecked) {
      setSelectedActivities(prev => [...prev, activityId]);
    } else {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    }

    // Log para debugging después de la actualización
    setTimeout(() => {
      console.log("Actividades seleccionadas después del cambio:", selectedActivities);
    }, 0);
  };

  // Función para verificar si una actividad está seleccionada
  const isActivitySelected = (activityId: number) => {
    return selectedActivities.some(id => Number(id) === Number(activityId));
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
        throw new Error("Los campos nombre y tipo del proveedor son obligatorios");
      }

      // Validar que al menos un campo de contacto esté lleno en datos de la empresa
      const contactInfo = supplierData.contactInfo || {};
      const hasContactInfo = Object.values(contactInfo).some(value => value && String(value).trim() !== "");
      
      // Validar datos del usuario
      if (!supplierData.User.name || !supplierData.User.lastname) {
        throw new Error("El nombre y apellido del usuario son obligatorios");
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
      const formData = {
        // Datos del proveedor (empresa)
        name: supplierData.name,
        type: supplierData.type,
        status: supplierData.status || "active",
        economicActivities: selectedActivities,
        contactInfo: {
          companyName: supplierData.contactInfo?.companyName || "",
          email: supplierData.contactInfo?.email || "",
          phone: supplierData.contactInfo?.phone || "",
          address: supplierData.contactInfo?.address || "",
          website: supplierData.contactInfo?.website || "",
          position: supplierData.contactInfo?.position || ""
        },
        // Datos del usuario (persona)
        userData: {
          name: supplierData.User.name,
          lastname: supplierData.User.lastname,
          email: supplierData.User.email,
          telephone: supplierData.User.telephone,
          movil: supplierData.User.movil,
          address: supplierData.User.address,
          nic: supplierData.User.nic
        }
      };

      console.log("Datos a enviar:", formData);
      
      const response = await fetch(`http://localhost:3040/api/suppliers/${numericId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Información del Proveedor/Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor/Empresa*</label>
                <input
                  type="text"
                  placeholder="Nombre comercial o razón social"
                  name="name"
                  value={supplierData.name}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
                <select
                  name="type"
                  value={supplierData.type}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="company">Empresa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto del Proveedor</label>
                <input
                  type="email"
                  placeholder="Email comercial"
                  name="contactInfo.email"
                  value={supplierData.contactInfo?.email || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto del Proveedor</label>
                <input
                  type="text"
                  placeholder="Teléfono comercial"
                  name="contactInfo.phone"
                  value={supplierData.contactInfo?.phone || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="text"
                  placeholder="Sitio web"
                  name="contactInfo.website"
                  value={supplierData.contactInfo?.website || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Comercial</label>
                <input
                  type="text"
                  placeholder="Dirección del negocio"
                  name="contactInfo.address"
                  value={supplierData.contactInfo?.address || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">Información del Usuario/Persona</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                <input
                  type="text"
                  placeholder="Nombre de la persona"
                  name="User.name"
                  value={supplierData.User?.name || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label>
                <input
                  type="text"
                  placeholder="Apellido de la persona"
                  name="User.lastname"
                  value={supplierData.User?.lastname || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Email personal"
                  name="User.email"
                  value={supplierData.User?.email || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC/Cédula</label>
                <input
                  type="text"
                  placeholder="Número de identificación"
                  name="User.nic"
                  value={supplierData.User?.nic || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo</label>
                <input
                  type="text"
                  placeholder="Teléfono fijo"
                  name="User.telephone"
                  value={supplierData.User?.telephone || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="Teléfono móvil"
                  name="User.movil"
                  value={supplierData.User?.movil || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Personal</label>
                <input
                  type="text"
                  placeholder="Dirección de residencia"
                  name="User.address"
                  value={supplierData.User?.address || ''}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-4 text-purple-700 border-b pb-2">Actividades Económicas</h2>
            {activities.length === 0 ? (
              <div className="text-gray-500">No hay actividades económicas disponibles.</div>
            ) : (
              <>
                <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
                  <p><strong>Depuración:</strong></p>
                  <p>Total actividades disponibles: {activities.length}</p>
                  <p>Actividades seleccionadas IDs: {selectedActivities.join(', ')}</p>
                  <p>Actividades del proveedor: {supplierData.economicActivities?.map((act: any) => `${act.id} (${act.name})`).join(', ') || 'Ninguna'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activities.map(activity => (
                    <label key={activity.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={activity.id}
                        checked={isActivitySelected(activity.id)}
                        onChange={handleActivityChange}
                        className="rounded"
                      />
                      <span className={isActivitySelected(activity.id) ? 'font-bold text-blue-600' : ''}>
                        {activity.name}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
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