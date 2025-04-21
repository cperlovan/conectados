"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { useToken } from "../../hook/useToken";

interface Supplier {
  id: string;
  name: string;
  type: string;
  status: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    companyName?: string;
  };
  contact?: {
    name: string;
    lastname: string;
    phone: string;
    email: string;
    address: string;
    companyName: string;
  };
  User: {
    id: string;
    name: string;
    lastname?: string;
    email: string;
    status: string;
  };
}

export default function SuppliersListPage() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        if (!token) {
          router.push("/login");
          return;
        }

        if (!userInfo?.condominiumId) {
          setError("No se pudo determinar el condominio");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:3040/api/suppliers/condominium/${userInfo.condominiumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Error al obtener los proveedores");
        }

        const data = await response.json();
        console.log("Datos de proveedores recibidos:", data);
        setSuppliers(data);
      } catch (err) {
        console.error("Error:", err);
        setError("Error al cargar los proveedores");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [token, router, userInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Lista de Proveedores</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.type === 'individual' ? 'Individual' : 'Empresa'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Teléfono: {supplier.contact?.phone || supplier.contactInfo?.phone || "No disponible"}</div>
                    <div>Email: {supplier.contact?.email || supplier.contactInfo?.email || supplier.User?.email || "No disponible"}</div>
                    <div>Dirección: {supplier.contact?.address || supplier.contactInfo?.address || "No disponible"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.User?.name || ""} {supplier.User?.lastname || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}