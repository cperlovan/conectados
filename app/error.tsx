"use client";

import React from "react";
import Link from "next/link";
import { FiAlertTriangle, FiArrowLeft, FiHome, FiRefreshCw } from "react-icons/fi";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="text-orange-500 text-4xl mr-4" />
            <h1 className="text-2xl font-bold text-gray-800">
              Ha ocurrido un error
            </h1>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-2">
            Lo sentimos, ha ocurrido un error al procesar tu solicitud.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 p-3 rounded-md border border-red-100 mb-6">
              <p className="font-medium text-red-800 text-sm mb-1">Detalles del error:</p>
              <p className="text-red-700 text-xs break-words">{error.message}</p>
            </div>
          )}

          <div className="space-y-3 mt-6">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
            >
              <FiRefreshCw className="mr-2" />
              Intentar nuevamente
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 w-full"
            >
              <FiHome className="mr-2" />
              Ir al inicio
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100 w-full"
            >
              <FiArrowLeft className="mr-2" />
              Volver atrás
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Si el problema persiste, por favor contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
} 