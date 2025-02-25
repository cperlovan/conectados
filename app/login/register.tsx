"use client";
import { useState } from "react";
import React from 'react';

interface RegisterProps {
  setShowRegister: (value: boolean) => void;
}

export default function Register({ setShowRegister }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:3040/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error al registrarse");
        return;
      }

      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      setShowRegister(false);
    } catch (error) {
      setError("Error al registrarse");
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 text-center">Construction Monitoring</h3>
      <h2 className="text-2xl font-bold mb-4 text-center">Registration </h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <form onSubmit={handleRegister} className="flex flex-col space-y-4">
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border border-gray-300 p-2 rounded"
        />

        <label className="text-sm">Select your role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-gray-300 p-2 rounded"
        >
          <option value="user">User</option>
          <option value="admin">Administrator</option>
        </select>

        <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Do you already have an account?{" "}
        <button onClick={() => setShowRegister(false)} className="text-blue-500 hover:underline">Close Register</button>
        Login here
      </p>
    </div>
  );
}