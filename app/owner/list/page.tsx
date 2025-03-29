"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Owner {
  id: number;
  fullName: string;
  documentId: string;
  documentType: string;
  address: string;
  phone: string;
  mobile: string;
  residentType: string;
  occupationStatus: string;
  status: string;
  user: {
    id: number;
    email: string;
  };
}

export default function OwnerList() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOwners = async () => {
      try {
        // Obtener el ID del condominio del usuario logueado
        if (!userInfo?.condominiumId) {
          throw new Error("ID de condominio no encontrado");
        }

        const response = await fetch(`http://localhost:3040/api/owners/condominium/${userInfo.condominiumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Error al cargar los propietarios");
        }

        const data = await response.json();
        setOwners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los propietarios");
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, [token, userInfo, router]);

  const handleDelete = async (id: number) => {
    if (!token) return;

    if (!window.confirm("¿Está seguro que desea eliminar este propietario?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3040/api/owners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el propietario");
      }

      // Actualizar la lista después de eliminar
      setOwners(prevOwners => prevOwners.filter(owner => owner.id !== id));
      toast.success("Propietario eliminado con éxito");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el propietario");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Activo</span>;
      case 'inactive':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">Inactivo</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando propietarios...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Listado de Propietarios</h1>
          <Link 
            href="/owner/register" 
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Registrar Nuevo Propietario
          </Link>
        </div>

        {owners.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay propietarios registrados</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {owners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{owner.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {owner.documentType.toUpperCase()}: {owner.documentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{owner.mobile}</div>
                        {owner.phone && (
                          <div className="text-xs text-gray-400">{owner.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{owner.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {owner.residentType === 'resident' ? 'Residente' : 'No Residente'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {owner.occupationStatus === 'owner' ? 'Propietario' : 
                           owner.occupationStatus === 'tenant' ? 'Inquilino' : 'Ambos'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(owner.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/owner/${owner.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/owner/${owner.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(owner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 