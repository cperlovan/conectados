"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import Register from "./register";

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user"); // Selector de rol
    const [error, setError] = useState("");
    const [showRegister, setShowRegister] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3040/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || "Error al iniciar sesión");
                return;
            }

            const data = await response.json();

            // Verificar si el usuario está autorizado
            if (!data.user.authorized) {
                setError("Tu cuenta está bloqueada. Contacta al administrador.");
                return;
            }
            // Si el usuario está autorizado, guardar el token y redirigir
            document.cookie = `token=${data.token}; Path=/; Secure; SameSite=Lax`;
            router.push("/");
            setUsername("");
            setPassword("");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setError("Error al iniciar sesión");
        }
    };

    return (

        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
                {showRegister ? (
                    <Register setShowRegister={setShowRegister} />
                ) : (
                    <>
                        <h3 className="text-2xl font-bold mb-4 text-center">Condominio</h3>
                        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                            <input
                                type="text"
                                placeholder="User"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="border border-gray-300 p-2 rounded"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border border-gray-300 p-2 rounded"
                            />

                            {/* Selector de Role */}
                            <label className="text-sm">Select your role:</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="border border-gray-300 p-2 rounded"
                            >
                                <option value="user">User</option>
                                <option value="admin">Administrator</option>
                            </select>

                            <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                                Login
                            </button>
                        </form>
                        <p className="text-sm text-center mt-4">
                            Don&apos;t have an account?{" "}
                            <button
                                onClick={() => setShowRegister(true)}
                                className="text-blue-500 hover:underline"
                            >
                                Register here
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}