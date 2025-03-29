"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { useRouter } from 'next/navigation';

interface Condominio {
  id: number;
  name: string;
}

export default function page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("copropietario");
  const [error, setError] = useState("");
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar la lista de condominios al montar el componente
  useEffect(() => {
    const fetchCondominios = async () => {
      try {
        const response = await fetch("http://localhost:3040/api/condominium", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar los condominios");
        }

        const data = await response.json();
        setCondominios(data);
      } catch (error) {
        console.error("Error al cargar condominios:", error);
        setError("Error al cargar la lista de condominios");
      }
    };

    fetchCondominios();
  }, []);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar condominios basado en el término de búsqueda
  const filteredCondominios = condominios.filter(condominio =>
    condominio.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCondominioSelect = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setSearchTerm(condominio.name);
    setShowDropdown(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCondominio) {
      setError("Por favor, seleccione un condominio");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

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
          condominiumId: selectedCondominio.id
        }),
      });

      // Imprimir detalles de la respuesta para debugging
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
    }
  };

  const redirectLogin = () => {
    router.push('/login');
  };
 
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h3 className="text-2xl font-bold mb-2 text-center text-gray-800">elcondominio.ve</h3>
        <h4 className="text-lg mb-6 text-center text-gray-600">Registro de Usuario</h4>
        
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Búsqueda de Condominio */}
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">
              Buscar Condominio:
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
                placeholder="Escriba para buscar un condominio..."
                required
              />
              {showDropdown && filteredCondominios.length > 0 && (
                <div className="absolute z-10  text-gray-900 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCondominios.map((condominio) => (
                    <div
                      key={condominio.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCondominioSelect(condominio)}
                    >
                      {condominio.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
              Contraseña:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              placeholder="********"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-1">
              Confirmar Contraseña:
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              placeholder="********"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Tipo de Usuario:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
            >
              <option value="copropietario">Copropietario</option>
              <option value="administrativo">Asistente administrativo</option>
              <option value="ocupante">Inquilino</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Registrar
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <button
            onClick={redirectLogin}
            className="text-green-600 hover:text-green-700 font-medium hover:underline focus:outline-none"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}