"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiMail, FiLock, FiUser, FiHome } from 'react-icons/fi';
import { CondominiumSelector } from '../components/CondominiumSelector'
import { CondominiumSelector as CondominiumType } from '../types/condominium'

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCondominium) {
      setError("Por favor, seleccione un condominio");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3040/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password, 
          role,
          status: 'active',
          condominiumId: selectedCondominium.id
        }),
      });

      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);

      let data;
      const responseText = await response.text();
      console.log("Respuesta texto completo:", responseText);

      try {
        data = JSON.parse(responseText);
        console.log("Respuesta parseada:", data);
      } catch (e) {
        console.error("Error al parsear respuesta:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        throw new Error(data.message || "Error al registrarse");
      }

      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      router.push('/login');
      
    } catch (error) {
      console.error("Error completo:", error);
      setError(error instanceof Error ? error.message : "Error al registrarse. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const redirectLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">elcondominio.ve</h1>
              <p className="text-gray-600 mt-2">Registro de Usuario</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <FiAlertCircle className="text-red-500 mr-2" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <CondominiumSelector
                  onSelect={setSelectedCondominium}
                  className="w-full"
                />
              </div>

              <div className="space-y-4">
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
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

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
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="********"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona un rol</option>
                      <option value="copropietario">Copropietario</option>
                      <option value="ocupante">Inquilino</option>
                      <option value="proveedor">Proveedor</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={redirectLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;