'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import logo from "../../public/image/CondominiumBlanco_Circular_WhiteBG.png";
import { useRouter } from 'next/navigation';



export default function Header() {
  const router = useRouter(); // Obtén el objeto router
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    propietarios: false,
    proveedor: false,
    servpublico: false,
    contabilidad: false,
    pagopropietarios: false, // Estado para el submenú de pagos propietarios
    pagoproveedor: false, // Estado para el submenú de pagos proveedor 
    pagoservpublico: false,
    mobile: false,
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded: { role: string } = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        setUserRole(null);
      }
    }
  }, []);

  if (!isClient) return null;

  const toggleDropdown = (dropdown: keyof typeof dropdownOpen) => {
    setDropdownOpen((prevState) => ({
      ...prevState,
      [dropdown]: !prevState[dropdown],
    }));
  };
  
  const handleLogout = () => {
    Cookies.remove("token");
    router.push('/login')
  };

  return (
    <header className="bg-white-900 text-black">
      <div className="container mx-auto px-4 flex justify-between items-center py-4">
        {/* Logo */}
        <Link href="/">
          <Image src={logo.src} width={50} height={50} alt="Logo" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-gray-300">Inicio</Link>
          <Link href="/#" className="hover:text-gray-300">Nosotros</Link>

          {/* Dropdown de Propietarios */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('propietarios')}
              className="flex items-center hover:text-gray-300"
            >
              Propietarios <FiChevronDown className="ml-1" />
            </button>
            {dropdownOpen.propietarios && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                {userRole === 'admin' && (
                  <Link href="/propietario" className="block px-4 py-2 hover:bg-gray-200">Registro</Link>
                )}
                <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Recibo</Link>

                {/* Submenú de Pagos */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('pagopropietarios')}
                    className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-200"
                  >
                    Pagos <FiChevronDown className="ml-1" />
                  </button>
                  {dropdownOpen.pagopropietarios && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Mensualidad</Link>
                      )}
                      <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Pago especial</Link>
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Validación de pago</Link>
                      )}
                    </div>
                  )}
                </div>

                <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Reportes</Link>
              </div>
            )}
          </div>

          {/* Otros dropdowns */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('proveedor')}
              className="flex items-center hover:text-gray-300"
            >
              Proveedor <FiChevronDown className="ml-1" />
            </button>
            {dropdownOpen.proveedor && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                {userRole === 'admin' && (
                  <Link href="/proveedor" className="block px-4 py-2 hover:bg-gray-200">Registro</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/" className="block px-4 py-2 hover:bg-gray-200">Presupuesto</Link>
                )}
                 {/* Submenú de Pagos */}
                 <div className="relative">
                  <button
                    onClick={() => toggleDropdown('pagoproveedor')}
                    className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-200"
                  >
                    Pagos <FiChevronDown className="ml-1" />
                  </button>
                  {dropdownOpen.pagoproveedor && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Mensualidad</Link>
                      )}
                      <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Pago especial</Link>
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Validación de pago</Link>
                      )}
                    </div>
                  )}
                </div>
                <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Reportes</Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => toggleDropdown('servpublico')}
              className="flex items-center hover:text-gray-300"
            >
              Servicios Públicos <FiChevronDown className="ml-1" />
            </button>
            {dropdownOpen.servpublico && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Registro</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Presupuesto</Link>
                )}
                 {/* Submenú de Pagos */}
                 <div className="relative">
                  <button
                    onClick={() => toggleDropdown('pagoservpublico')}
                    className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-200"
                  >
                    Pagos <FiChevronDown className="ml-1" />
                  </button>
                  {dropdownOpen.pagoservpublico && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Mensualidad</Link>
                      )}
                      <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Pago especial</Link>
                      {userRole === 'admin' && (
                        <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Validación de pago</Link>
                      )}
                    </div>
                  )}
                </div>
                <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Reportes</Link>
              </div>
            )}
          </div>

          {/* Más dropdowns aquí... */}

          <div className="relative">
            <button
              onClick={() => toggleDropdown('contabilidad')}
              className="flex items-center hover:text-gray-300"
            >
              Contabilidad <FiChevronDown className="ml-1" />
            </button>
            {dropdownOpen.contabilidad && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Cuentas por cobrar</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Cuentas por pagar</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Conciliación bancaria</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Morosidad</Link>
                )}
                <Link href="/#" className="block px-4 py-2 hover:bg-gray-200">Reportes</Link>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="hover:text-gray-300">Cerrar sesión</button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* <button onClick={handleLogout} className="block px-4 py-2 text-left w-full hover:bg-gray-200">Cerrar sesión</button> */}
           
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 text-white py-4">
          <Link href="/" className="block px-4 py-2 hover:bg-gray-700">Inicio</Link>
          <Link href="/about" className="block px-4 py-2 hover:bg-gray-700">Nosotros</Link>
          <div className="relative">
            <button
              onClick={() => toggleDropdown('mobile')}
              className="block px-4 py-2 w-full text-left hover:bg-gray-700"
            >
              Opciones <FiChevronDown className="ml-1" />
            </button>
            {dropdownOpen.mobile && (
              <div className="mt-2 bg-white text-black rounded-md shadow-lg">
                <Link href="/profile" className="block px-4 py-2 hover:bg-gray-200">Perfil</Link>
                {userRole === 'admin' && (
                  <Link href="/admin" className="block px-4 py-2 hover:bg-gray-200">Admin</Link>
                )}
                <button onClick={handleLogout} className="hover:text-gray-300">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}