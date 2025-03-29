"use client";

import React from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowLeft, FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 text-4xl mr-4" />
            <h1 className="text-2xl font-bold text-gray-800">
              Página no encontrada
            </h1>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
            >
              <FiHome className="mr-2" />
              Ir al inicio
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 w-full"
            >
              <FiArrowLeft className="mr-2" />
              Volver atrás
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Si crees que esto es un error, por favor contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
} 