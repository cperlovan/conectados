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

interface RegisterFormData {
  // Datos del condominio
  name: string;
  type: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  description: string;
  
  // Datos del administrador
  adminName: string;
  adminLastname: string;
  adminAddress: string;
  adminNic: string;
  adminTelephone: string;
  adminMovil: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export default function RegisterAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: datos condominio, 2: datos admin
  const [formData, setFormData] = useState<RegisterFormData>({
    // Datos del condominio
    name: "",
    type: "residential",
    rif: "",
    address: "",
    phone: "",
    email: "",
    currency: "USD",
    timezone: "America/Caracas",
    description: "",
    
    // Datos del administrador
    adminName: "",
    adminLastname: "",
    adminAddress: "",
    adminNic: "",
    adminTelephone: "",
    adminMovil: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setLoading(true);

    try {
      if (formData.adminPassword !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const response = await fetch("http://localhost:3040/api/condominium/register-with-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Datos del condominio
          name: formData.name,
          type: formData.type,
          rif: formData.rif,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          currency: formData.currency,
          timezone: formData.timezone,
          description: formData.description,
          rules: {},
          settings: {},
          
          // Datos del administrador
          adminName: formData.adminName,
          adminLastname: formData.adminLastname,
          adminAddress: formData.adminAddress,
          adminNic: formData.adminNic,
          adminTelephone: formData.adminTelephone,
          adminMovil: formData.adminMovil,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el condominio y administrador");
      }

      alert("Condominio y administrador registrados exitosamente");
      router.push("/login");
    } catch (err) {
      console.error("Error:", err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Error al registrar el condominio y administrador");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {step === 1 ? "Registro de Condominio" : "Registro de Administrador"}
          </h1>
          <div className="mb-6">
            <div className="flex items-center">
              <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-blue-500' : 'border-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-2 ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-blue-500' : 'border-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-2 ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>2</div>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm font-medium">Datos del Condominio</span>
              <span className="text-sm font-medium">Datos del Administrador</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              // Paso 1: Datos del condominio
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nombre del Condominio*
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
                      Tipo de Condominio*
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      RIF*
                    </label>
                    <input
                      type="text"
                      name="rif"
                      value={formData.rif}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Dirección*
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Moneda*
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="USD">USD - Dólar estadounidense</option>
                      <option value="VES">VES - Bolívar venezolano</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Zona Horaria*
                    </label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="America/Caracas">Venezuela (UTC-4)</option>
                      <option value="America/Bogota">Colombia (UTC-5)</option>
                      <option value="America/Lima">Perú (UTC-5)</option>
                      <option value="America/Santiago">Chile (UTC-4)</option>
                      <option value="America/Buenos_Aires">Argentina (UTC-3)</option>
                      <option value="America/Mexico_City">México (UTC-6)</option>
                      <option value="America/New_York">Este EEUU (UTC-5)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  ></textarea>
                </div>
              </>
            ) : (
              // Paso 2: Datos del administrador
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nombre*
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Apellido*
                    </label>
                    <input
                      type="text"
                      name="adminLastname"
                      value={formData.adminLastname}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Cédula/Documento de Identidad*
                  </label>
                  <input
                    type="text"
                    name="adminNic"
                    value={formData.adminNic}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Dirección*
                  </label>
                  <input
                    type="text"
                    name="adminAddress"
                    value={formData.adminAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Teléfono Fijo*
                    </label>
                    <input
                      type="text"
                      name="adminTelephone"
                      value={formData.adminTelephone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Teléfono Móvil*
                    </label>
                    <input
                      type="text"
                      name="adminMovil"
                      value={formData.adminMovil}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Correo Electrónico*
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Contraseña*
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Confirmar Contraseña*
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
                </div>
              </>
            )}

            <div className="flex justify-between mt-6">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Volver
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${step === 1 ? 'ml-auto' : ''} bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                {loading 
                  ? "Procesando..." 
                  : step === 1 
                    ? "Siguiente" 
                    : "Registrar Condominio y Administrador"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
