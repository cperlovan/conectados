import React from 'react';
import Footer from "./components/Footer";
import Link from "next/link";
import Header from './components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido a elcondominio.ve
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La plataforma integral para la gestión de tu condominio
          </p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Gestión de Pagos</h2>
            <p className="text-gray-600">
              Administra tus pagos y recibos de manera sencilla y eficiente.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Comunicación</h2>
            <p className="text-gray-600">
              Mantente informado y en contacto con tu comunidad.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Mantenimiento</h2>
            <p className="text-gray-600">
              Gestiona las solicitudes de mantenimiento y reparaciones.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
