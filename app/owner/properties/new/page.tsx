"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../../hook/useToken";
import Header from "../../../components/Header";
import { toast } from "react-hot-toast";
import { fetchAPI, getOwnerByUserId } from "../../../utils/api";

interface FormData {
  name: string;
  type: string;
  address: string;
  number?: string;
  block?: string;
  aliquot?: number;
  status: "occupied" | "vacant" | "under_maintenance";
  ownerId?: number;
  condominiumId?: number;
}

export default function NewProperty() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerData, setOwnerData] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "apartment",
    address: "",
    number: "",
    block: "",
    aliquot: undefined,
    status: "occupied"
  });

  // Verificar autenticación y obtener datos del propietario
  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchOwnerData = async () => {
      if (isLoading) return;
      if (!token || !userInfo?.id) return;

      try {
        setLoading(true);
        // Obtener datos del propietario
        const owner = await getOwnerByUserId(userInfo.id, token);
        setOwnerData(owner);
        
        // Pre-llenar los IDs necesarios
        setFormData(prev => ({
          ...prev,
          ownerId: owner.id,
          condominiumId: owner.condominiumId || userInfo.condominiumId
        }));
      } catch (err) {
        console.error("Error al obtener datos del propietario:", err);
        setError(err instanceof Error ? err.message : "Error al cargar datos del propietario");
        toast.error("Error al cargar datos del propietario");
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, [token, userInfo, router, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Para campos numéricos como aliquot
    if (name === "aliquot") {
      const numValue = value === "" ? undefined : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("No hay token disponible");
      }

      // Validación de datos básicos
      if (!formData.name || !formData.type || !formData.address) {
        throw new Error("Los campos nombre, tipo y dirección son obligatorios");
      }

      if (!formData.ownerId) {
        throw new Error("Información de propietario no disponible");
      }

      console.log("Enviando datos al backend:", formData);

      // Crear la propiedad usando la API
      const response = await fetchAPI("/properties", {
        token,
        method: "POST",
        body: formData
      });

      console.log("Respuesta del servidor:", response);
      toast.success("Propiedad creada exitosamente");
      
      // Redireccionar a la lista de propiedades
      setTimeout(() => {
        router.push("/owner/properties");
      }, 1500);
    } catch (error) {
      console.error("Error completo:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al crear la propiedad";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ownerData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Registrar Nueva Propiedad</h1>
            <button
              onClick={() => router.push("/owner/properties")}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Volver
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Propiedad*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Apartamento 101, Casa 5, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Propiedad*
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="commercial">Local Comercial</option>
                  <option value="parking">Estacionamiento</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección*
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                  Número/Identificador
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="Ej: 101, A-5, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="block" className="block text-sm font-medium text-gray-700 mb-1">
                  Bloque/Torre
                </label>
                <input
                  type="text"
                  id="block"
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  placeholder="Ej: A, Torre Norte, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="aliquot" className="block text-sm font-medium text-gray-700 mb-1">
                  Alícuota (%)
                </label>
                <input
                  type="number"
                  id="aliquot"
                  name="aliquot"
                  value={formData.aliquot === undefined ? "" : formData.aliquot}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej: 2.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si desconoce este valor, déjelo en blanco. El administrador podrá asignarlo posteriormente.
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="occupied">Ocupado</option>
                  <option value="vacant">Vacante</option>
                  <option value="under_maintenance">En mantenimiento</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors w-full"
              >
                {loading ? "Guardando..." : "Registrar Propiedad"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/owner/properties")}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 