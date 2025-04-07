"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { CondominiumSelector } from '../components/CondominiumSelector'
import { CondominiumSelector as CondominiumType } from '../types/condominium'
import { FiAlertCircle, FiMail, FiLock, FiUser } from 'react-icons/fi'
//import Register from "./register";

interface User {
  name: string;
  email: string;
  role: string;
  password?: string;
  authorized: boolean;
}
interface Condominio {
  id: number;
  name: string;
}

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumType | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedCondominium) {
      setError("Por favor selecciona un condominio");
      setLoading(false);
      return;
    }

    if (!role) {
      setError("Por favor selecciona un rol");
      setLoading(false);
      return;
    }

    try {
      console.log("Intentando iniciar sesión con:", {
        email: formData.email,
        condominiumId: selectedCondominium.id,
        role
      });

      const response = await fetch("http://localhost:3040/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          condominiumId: selectedCondominium.id, 
          role 
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      if (!data.user.authorized) {
        throw new Error("Tu cuenta está bloqueada. Contacta al administrador.");
      }

      // Guardar el token en las cookies con opciones más seguras
      try {
        // Primero intentamos eliminar cualquier token existente
        Cookies.remove("token", { path: "/" });
        
        // Luego guardamos el nuevo token
        Cookies.set("token", data.token, {
          expires: 7, // 7 días
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === 'production'
        });

        // Verificar que el token se guardó correctamente
        const savedToken = Cookies.get("token");
        console.log("Token guardado en cookies:", savedToken ? "Sí" : "No");
        console.log("Token valor:", savedToken);
        
        if (!savedToken) {
          throw new Error("No se pudo guardar el token en las cookies");
        }
      } catch (error) {
        console.error("Error al guardar el token:", error);
        alert("Error al guardar la sesión. Por favor, intenta nuevamente.");
        setLoading(false);
        return;
      }

      console.log("Rol del usuario:", data.user.role);

      // Redirigir según el rol
      if (data.user.role === "admin") {
        console.log("Redirigiendo a /supplier");
        router.push("/home");
      } else {
        console.log("Redirigiendo a /home");
        router.push("/home");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError(error instanceof Error ? error.message : "Error al iniciar sesión");
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

  // Cargar la lista de condominios al montar el componente
  React.useEffect(() => {
    const fetchCondominios = async () => {
      try {
        setError(null);
        const response = await fetch("http://localhost:3040/api/condominium", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar los condominios: ${response.status}`);
        }

        const data = await response.json();
        setCondominios(data);
      } catch (error) {
        console.error("Error al cargar condominios:", error);
        setError("No se pudo conectar con el servidor. Comuniquese con el administrador.");
      }
    };

    fetchCondominios();
  }, []);

  // Cerrar el dropdown cuando se hace clic fuera
  React.useEffect(() => {
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

  const redirectRegister = () => {
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">elcondominio.ve</h1>
              <p className="text-gray-600 mt-2">Iniciar Sesión</p>
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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                      <option value="admin">Administrador</option>
                      <option value="administrativo">Asistente administrativo</option>
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
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <button
                  onClick={redirectRegister}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
