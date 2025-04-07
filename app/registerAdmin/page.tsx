"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiMail, FiLock, FiUser, FiHome, FiPhone, FiMapPin, FiDollarSign, FiGlobe, FiFileText } from 'react-icons/fi';
import Header from "../components/Header";
import { validateInput } from "../utils/validation";

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
  const [error, setError] = useState<string | null>(null);
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

    try {
      setLoading(true);
      setError(null);

      // Sanitizar la contraseña antes de la comparación
      const sanitizedPassword = validateInput.password(formData.adminPassword);
      const sanitizedConfirmPassword = validateInput.password(formData.confirmPassword);

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      // Sanitizar datos antes del envío
      const sanitizedData = {
        // Datos del condominio
        name: validateInput.text(formData.name, 100),
        type: formData.type,
        rif: validateInput.rif(formData.rif),
        address: validateInput.text(formData.address, 200),
        phone: validateInput.phone(formData.phone),
        email: validateInput.email(formData.email),
        currency: formData.currency,
        timezone: formData.timezone,
        description: validateInput.text(formData.description, 500),
        rules: {},
        settings: {},
        
        // Datos del administrador
        adminName: validateInput.text(formData.adminName, 50),
        adminLastname: validateInput.text(formData.adminLastname, 50),
        adminAddress: validateInput.text(formData.adminAddress, 200),
        adminNic: validateInput.text(formData.adminNic, 20),
        adminTelephone: validateInput.phone(formData.adminTelephone),
        adminMovil: validateInput.phone(formData.adminMovil),
        adminEmail: validateInput.email(formData.adminEmail),
        adminPassword: sanitizedPassword
      };

      // Validaciones adicionales
      if (sanitizedData.name.length < 3) {
        throw new Error("El nombre del condominio debe tener al menos 3 caracteres");
      }
      if (sanitizedData.rif.length < 5) {
        throw new Error("El RIF debe tener al menos 5 caracteres");
      }
      if (!sanitizedData.email.includes('@')) {
        throw new Error("El correo del condominio no es válido");
      }
      if (!sanitizedData.adminEmail.includes('@')) {
        throw new Error("El correo del administrador no es válido");
      }

      const response = await fetch("http://localhost:3040/api/condominium/register-with-admin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el condominio y administrador");
      }

      alert("Condominio y administrador registrados exitosamente");
      router.push("/login");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al registrar el condominio y administrador");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">elcondominio.ve</h1>
              <p className="text-gray-600 mt-2">
                {step === 1 ? "Registro de Condominio" : "Registro de Administrador"}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      1
                    </div>
                    <div className={`flex-1 h-1 mx-4 ${
                      step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      2
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium text-gray-600">Datos del Condominio</span>
                    <span className="text-sm font-medium text-gray-600">Datos del Administrador</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <FiAlertCircle className="text-red-500 mr-2" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                // Paso 1: Datos del condominio
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Condominio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHome className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nombre del condominio"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Condominio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHome className="text-gray-400" />
                        </div>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="residential">Residencial</option>
                          <option value="commercial">Comercial</option>
                          <option value="industrial">Industrial</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RIF
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFileText className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="rif"
                          value={formData.rif}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="J-12345678-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+58 212-123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="correo@condominio.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moneda
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="text-gray-400" />
                        </div>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="USD">USD - Dólar estadounidense</option>
                          <option value="VES">VES - Bolívar venezolano</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zona Horaria
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiGlobe className="text-gray-400" />
                        </div>
                        <select
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción del condominio..."
                    ></textarea>
                  </div>
                </div>
              ) : (
                // Paso 2: Datos del administrador
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="adminName"
                          value={formData.adminName}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nombre del administrador"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="adminLastname"
                          value={formData.adminLastname}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Apellido del administrador"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula/Documento de Identidad
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFileText className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="adminNic"
                          value={formData.adminNic}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="V-12345678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Fijo
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="adminTelephone"
                          value={formData.adminTelephone}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+58 212-123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Móvil
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="adminMovil"
                          value={formData.adminMovil}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+58 412-123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="adminAddress"
                        value={formData.adminAddress}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección del administrador"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="adminEmail"
                        value={formData.adminEmail}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="adminPassword"
                          value={formData.adminPassword}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="********"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="********"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${step === 1 ? 'ml-auto' : ''} px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    step === 1 ? "Siguiente" : "Registrar Condominio y Administrador"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
