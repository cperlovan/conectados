"use client";
import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
//import {  JwtPayload } from "jwt-decode";
//import { useToken } from "../hook/useToken";
import Header from "../components/Header";

// interface Condominio {
//   name: string;
//   type: string;
//   rif: string;
//   address: string;
//   phone: string;
//   email: string;
//   currency: string;
//   timezone: string;
//   description?: string;
//   rules?: any;
//   settings?: any;
// }

// interface AdminData extends JwtPayload {
//   adminName: string;
//   adminLastname: string;
//   adminAddress: string;
//   adminNic: string;
//   adminTelephone: string;
//   adminMovil: string;
//   adminEmail: string;
//   adminPassword: string;
//   adminRole: string;
//   adminStatus: string;
//   adminCreatedAt: string;
//   adminUpdatedAt: string;
//   condominiumId: number;
//   exp: number;
//   iat: number;
// }

interface AdminFormData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const response = await fetch("http://localhost:3040/api/auth/register-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el administrador");
      }

      router.push("/login");
    } catch (err) {
      console.error("Error:", err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Error al registrar el administrador");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Registro de Administrador</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Apellido
              </label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar Administrador"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
