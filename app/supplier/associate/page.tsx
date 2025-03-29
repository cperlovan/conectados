"use client";
// import { cookies } from "next/headers";
import React, { useEffect, useState } from "react";

interface EconomicActivity {
  id: number;
  name: string;
  description: string;
  status: string;
}

export default function AssociateActivity() {
  const [formData, setFormData] = useState({
    supplierId: 1, // ID del proveedor
    economicActivityId: 1, // ID de la actividad económica
  });
  
  const [activities, setActivities] = useState<EconomicActivity[]>([]);
  console.log(activities)
  const [error, setError] = useState("");

  // Cargar actividades económicas
 
//  useEffect(() => {
//     const fetchActivities = async () => {
//         try {
//           const tokenCookie = document.cookie
//             .split("; ")
//             .find((row) => row.startsWith("token="))
//             ?.split("=")[1];
      
//           console.log("Token Cookie:", tokenCookie); // Verifica el token
      
//           const headers = {
//             Authorization: `Bearer ${tokenCookie}`,
//           };
      
//           console.log("Headers:", headers); // Verifica los encabezados
      
//           const response = await fetch("http://localhost:3040/api/economic-activities", {
//             headers,
//           });
//       } catch (error) {
//         setError("Error al cargar las actividades económicas.");
//       }
//     };

//     fetchActivities();
//   }, []);

const fetchActivity = async () => {
    try {
      // Obtener el token de las cookies
      const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
       console.log('token capturado: '+tokenCookie)
      const response = await fetch("http://localhost:3040/api/economic-activities", {
        headers: {
          Authorization: `Bearer ${tokenCookie}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error al obtener los proveedores.");
        return;
      }
  
      const data = await response.json();
      setActivities(data); // Aquí se actualiza el estado suppliers
    } catch (error) {
      console.error("Error al obtener los proveedores:", error);
      setError("Error al obtener los proveedores.");
    }
  };

   useEffect(() => {
      fetchActivity();
    }, []);
  

  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3040/api/suppliers/associate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error al asociar la actividad económica.");
        return;
      }

      alert("Actividad económica asociada exitosamente.");
    } catch (error) {
      console.error("Error al asociar la actividad económica:", error);
      setError("Error al asociar la actividad económica.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Asociar Actividad Económica</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Selector de Proveedor */}
        <label>
          Proveedor:
          <input
            type="number"
            name="supplierId"
            value={formData.supplierId}
            onChange={(e) =>
              setFormData({ ...formData, supplierId: parseInt(e.target.value) })
            }
            className="border border-gray-300 p-2 rounded"
          />
        </label>

        {/* Selector de Actividad Económica */}
        <label>
          Actividad Económica:
          <select
            name="economicActivityId"
            value={formData.economicActivityId}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          >
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </label>

        {/* Botón de Envío */}
        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Asociar Actividad
        </button>
      </form>
    </div>
  );
}