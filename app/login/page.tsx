"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
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
  const [role, setRole] = useState("user"); // Selector de rol
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedCondominio) {
      alert("Debes seleccionar un condominio.");
      setLoading(false);
      return;
    }

    try {
      console.log("Intentando iniciar sesión con:", {
        email: formData.email,
        condominiumId: selectedCondominio.id,
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
          condominiumId: selectedCondominio?.id, 
          role 
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      if (!data.user.authorized) {
        alert("Tu cuenta está bloqueada. Contacta al administrador.");
        setLoading(false);
        return;
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
          secure: false // Cambiamos a false para desarrollo local
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
      alert(error instanceof Error ? error.message : "Error al iniciar sesión");
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
        setError("No se pudo conectar con el servidor. Por favor, verifica que el servidor backend esté ejecutándose en http://localhost:3040");
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h3 className="text-2xl font-bold mb-2 text-center text-gray-800">elcondominio.ve</h3>
        <h4 className="text-lg mb-6 text-center text-gray-600">Iniciar Sesión</h4>
        
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
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
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
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
              <option value="">Selecciona un rol</option>
              <option value="admin">Administrador</option>
              <option value="administrativo">Asistente administrativo</option>
              <option value="copropietario">Copropietario</option>
              <option value="ocupante">Inquilino</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Buscar Condominio:
            </label>
            <input
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
              <div className="absolute z-10 w-full mt-1  text-gray-900 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          ¿No tienes una cuenta?{" "}
          <button
            onClick={redirectRegister}
            className="text-green-600 hover:text-green-700 font-medium hover:underline focus:outline-none"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
