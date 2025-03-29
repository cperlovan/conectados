"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { useToken } from "../hook/useToken";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

// Interfaz para el usuario
interface User {
  id: number;
  name?: string;
  lastname?: string;
  nic?: string;
  email?: string;
  address?: string;
  telephone?: string;
  movil?: string;
  condominiumId?: number;
  credit_balance?: number;
  authorized?: boolean;
  role: "copropietario" | "admin";
}

// Extender el tipo JwtPayload
interface CustomJwtPayload {
  id: number;
  condominiumId: number;
  role: "admin" | "copropietario";
}

interface Property {
  id: number;
  name: string;
  type: string;
  status: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  address: string;
}

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<User>({
    id: 0,
    name: "",
    nic: "",
    email: "",
    lastname: "",
    address: "",
    telephone: "",
    movil: "",
    condominiumId: 0,
    credit_balance: 0,
    authorized: false,
    role: "copropietario",
  });
  const [isEditMode] = useState(false);
  const [currentPage] = useState(1);
  const [rowsPerPage ] = useState(5);
  const [searchTerm] = useState("");
  const [totalRows, setTotalRows] = useState<number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  // Obtener el token de las cookies
  const { token, isLoading } = useToken();
  console.log(isEditMode, totalRows);
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        setFormData((prev) => ({
          ...prev,
          condominiumId: decodedToken.condominiumId || 0,
        }));
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    }
  }, [token]);

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, [currentPage, rowsPerPage, searchTerm]);

  useEffect(() => {
    const fetchProperties = async () => {
      // Evitar redirección mientras se carga el token
      if (!token && !isLoading) {
        router.push("/login");
        return;
      }

      // No ejecutar la función mientras se está cargando el token
      if (isLoading) return;

      try {
        const response = await fetch("http://localhost:3040/api/properties", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Error al cargar las propiedades");
        }

        const data = await response.json();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar las propiedades");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [token, router, isLoading]);

  // if (users.length > 0) {
  //   console.log("FORMDATA: " + users[0].condominiumId);
  // }

  const fetchUsers = async () => {
    try {
      const url = `http://localhost:3040/api/users?condominiumId=${
        formData.condominiumId
      }&page=${currentPage}&limit=${rowsPerPage}&search=${encodeURIComponent(
        searchTerm
      )}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      //setUsers(response.data.rows);
      setTotalRows(response.data.count);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("Error al cargar usuarios.");
    }
  };

  // Manejar cambios en el formulario
  // const handleFormChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData({
  //     ...formData,
  //     [name]: value,
  //   });
  // };

  // Crear un nuevo usuario
  // const createUser = async () => {
  //   try {
  //     const { id, ...newUser } = formData; // Desestructurar para omitir el ID

  //     console.log("Enviando datos al backend:", newUser); // Verifica los datos enviados

  //     await axios.post("http://localhost:3040/api/users", newUser, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     fetchUsers();
  //     resetForm();
  //     alert("Usuario creado exitosamente.");
  //   } catch (error) {
  //     console.error("Error al crear usuario:", error);
  //     setError("Error al crear usuario.");
  //   }
  // };

  // Actualizar un usuario existente
  // const updateUser = async () => {
  //   try {
  //     await axios.put(
  //       `http://localhost:3040/api/users/${formData.id}`,
  //       formData,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     fetchUsers();
  //     resetForm();
  //     setIsEditMode(false);
  //     alert("Usuario actualizado exitosamente.");
  //   } catch (error) {
  //     console.error("Error al actualizar usuario:", error);
  //     setError("Error al actualizar usuario.");
  //   }
  // };

  // Eliminar un usuario
  // const deleteUser = async (id: number) => {
  //   try {
  //     const confirmation = window.confirm(
  //       "¿Estás seguro de eliminar este usuario?"
  //     );
  //     if (!confirmation) return;

  //     await axios.delete(`http://localhost:3040/api/users/${id}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     fetchUsers();
  //     alert("Usuario eliminado exitosamente.");
  //   } catch (error) {
  //     console.error("Error al eliminar usuario:", error);
  //     setError("Error al eliminar usuario.");
  //   }
  // };

  // Limpiar el formulario
  // const resetForm = () => {
  //   setFormData({
  //     id: 0,
  //     name: "",
  //     nic: "",
  //     email: "",
  //     lastname: "",
  //     address: "",
  //     telephone: "",
  //     movil: "",
  //     condominiumId: formData.condominiumId || 0,
  //     credit_balance: 0,
  //     authorized: false,
  //     role: "copropietario",
  //   });
  // };

  // Columnas de la tabla
  // const columns = [
  //   { name: "Nombre", selector: (row: User) => row.name, sortable: true },
  //   { name: "Email", selector: (row: User) => row.email, sortable: true },
  //   { name: "Cédula", selector: (row: User) => row.nic, sortable: true },
  //   { name: "Celular", selector: (row: User) => row.movil, sortable: true },
  //   {
  //     name: "Estado",
  //     cell: (row: User) => (
  //       <span
  //         style={{
  //           color: row.authorized ? "green" : "red",
  //           fontWeight: "bold",
  //         }}
  //       >
  //         {row.authorized ? "Activo" : "Inactivo"}
  //       </span>
  //     ),
  //     sortable: true,
  //   },
  //   {
  //     name: "Acciones",
  //     cell: (row: User) => (
  //       <div>
  //         <button
  //           onClick={() => handleEditUser(row)}
  //           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
  //         >
  //           Editar
  //         </button>
  //         <button
  //           onClick={() => deleteUser(row.id)}
  //           className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
  //         >
  //           Eliminar
  //         </button>
  //       </div>
  //     ),
  //   },
  // ];

  // Manejar edición de usuario
  // const handleEditUser = (user: User) => {
  //   setFormData(user);
  //   setIsEditMode(true);
  //   const formElement = document.getElementById("form-user");
  //   if (formElement) {
  //     formElement.scrollIntoView({ behavior: "smooth", block: "start" });
  //   }
  // };

  const handleDelete = async (id: number) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3040/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la propiedad");
      }

      setProperties(prevProperties => prevProperties.filter(prop => prop.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la propiedad");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando propiedades...</div>
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
        <h1 className="text-2xl font-bold mb-6">Propiedades</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.owner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(property.id)}
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
    </div>
  );
};

export default Page;
// function setUsers() {
//   throw new Error("Function not implemented.");
// }

