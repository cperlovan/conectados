"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";
import Header from "../components/Header";

interface UserProfile {
  name: string;
  lastname: string;
  address: string;
  phone: string;
  documentId: string;
  documentType: string;
  birthDate: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const token = useToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    lastname: "",
    address: "",
    phone: "",
    documentId: "",
    documentType: "cedula",
    birthDate: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    }
  });

  // Verificar si el usuario ya completó su perfil
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch("http://localhost:3040/api/user/profile", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isProfileComplete) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error("Error al verificar perfil:", error);
      }
    };

    if (token) {
      checkProfile();
    }
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3040/api/users/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }

      router.push("/home");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error al actualizar el perfil");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Completar Perfil</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
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
                value={profile.lastname}
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
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={profile.address}
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
              {loading ? "Actualizando..." : "Actualizar Perfil"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 