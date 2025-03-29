import Advertisement from "../components/Advertisement";
//import Navbar from "./components/Navbar";
import Footer from "../components/Footer";
//import Link from "next/link";
import Header from "../components/Header";
//import { useAuth } from "../context/AuthContext";

import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header/>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenido al Sistema de Condominios
        </h1>
        <p className="text-lg">
          Gestiona tus recibos, pagos y propiedades de manera eficiente.
        </p>
      </section>

      {/* Publicidad */}
      <section className="container mx-auto my-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Publicidad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Advertisement 
            title="Publicidad 1" 
            description="Descripción de la publicidad 1" 
            imageUrl="/public/images/publicidad1.jpg" 
            link="/" 
          />
          <Advertisement 
            title="Publicidad 2" 
            description="Descripción de la publicidad 2" 
            imageUrl="/public/images/publicidad2.jpg" 
            link="/" 
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
