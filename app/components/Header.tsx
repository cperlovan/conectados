'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import * as jwtDecode from 'jwt-decode';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import logo from "../../public/image/CondominiumBlanco_Circular_WhiteBG.png";
import { useRouter } from 'next/navigation';
import { useToken } from '../hook/useToken';

export default function Header() {
  const router = useRouter();
  const { userInfo } = useToken();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    propietarios: false,
    proveedor: false,
    servpublico: false,
    contabilidad: false,
    pagopropietarios: false,
    pagoproveedor: false,
    pagoservpublico: false,
    mobile: false,
    admin: false,
    fondos: false,
    recibos: false,
    pagos: false
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded: { role: string } = jwtDecode.default(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        setUserRole(null);
      }
    }
  }, []);

  const toggleDropdown = (dropdown: keyof typeof dropdownOpen) => {
    setDropdownOpen((prevState) => ({
      ...prevState,
      [dropdown]: !prevState[dropdown],
    }));
  };
  
  const handleLogout = () => {
    Cookies.remove("token");
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center py-4">
        {/* Logo */}
        <Link href="/home">
          <Image src={logo.src} width={50} height={50} alt="Logo" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/home" className="hover:text-gray-500">Inicio</Link>
          
          {/* Menú para copropietarios */}
          {userRole === 'copropietario' && (
            <>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('propietarios')}
                  className="flex items-center hover:text-gray-500"
                >
                  Mi Perfil <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.propietarios && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/owner" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                    <Link href="/owner/profile" className="block px-4 py-2 hover:bg-gray-100">Ver Perfil</Link>
                    <Link href="/owner/properties" className="block px-4 py-2 hover:bg-gray-100">Mis Propiedades</Link>
                    <Link href="/owner/receipts" className="block px-4 py-2 hover:bg-gray-100">Mis Recibos</Link>
                    <Link href="/owner/payments" className="block px-4 py-2 hover:bg-gray-100">Mis Pagos</Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Menú específico para proveedores */}
          {userRole === 'proveedor' && (
            <div className="relative">
              <button
                onClick={() => toggleDropdown('proveedor')}
                className="flex items-center hover:text-gray-500"
              >
                Mi Panel <FiChevronDown className="ml-1" />
              </button>
              {dropdownOpen.proveedor && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                  <Link href="/supplier/dashboard" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                  <Link href="/supplier/profile" className="block px-4 py-2 hover:bg-gray-100">Mi Perfil</Link>
                  <Link href="/supplier/budgets" className="block px-4 py-2 hover:bg-gray-100">Presupuestos</Link>
                  <Link href="/supplier/invoices" className="block px-4 py-2 hover:bg-gray-100">Facturas</Link>
                </div>
              )}
            </div>
          )}

          {/* Menú para administradores */}
          {userRole === 'admin' && (
            <>
              {/* Dropdown de Propietarios */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('propietarios')}
                  className="flex items-center hover:text-gray-500"
                >
                  Propietarios <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.propietarios && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/property" className="block px-4 py-2 hover:bg-gray-100">Propiedades</Link>
                    <Link href="/owner/register" className="block px-4 py-2 hover:bg-gray-100">Registrar Propietario</Link>
                    <Link href="/owner/list-owners" className="block px-4 py-2 hover:bg-gray-100">Listar Propietarios</Link>
                    <Link href="/owner/unregistered-owners" className="block px-4 py-2 hover:bg-gray-100 text-yellow-600">Propietarios sin Propiedades</Link>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown('pagopropietarios')}
                        className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100"
                      >
                        Pagos <FiChevronDown className="ml-1" />
                      </button>
                      {dropdownOpen.pagopropietarios && (
                        <div className="absolute left-full top-0 ml-1 w-48 bg-white text-black rounded-md shadow-lg z-20">
                          <Link href="/receipts" className="block px-4 py-2 hover:bg-gray-100">Recibos</Link>
                          <Link href="/payments" className="block px-4 py-2 hover:bg-gray-100">Pagos</Link>
                          <Link href="/payments/validation" className="block px-4 py-2 hover:bg-gray-100">Validación de Pagos</Link>
                          <Link href="/admin/payments" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
                          <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown de Proveedores */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('proveedor')}
                  className="flex items-center hover:text-gray-500"
                >
                  Proveedores <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.proveedor && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/supplier" className="block px-4 py-2 hover:bg-gray-100">Listar Proveedores</Link>
                    <Link href="/supplier/admin-register" className="block px-4 py-2 hover:bg-gray-100">Registrar Proveedor</Link>
                    <Link href="/supplier/budgets" className="block px-4 py-2 hover:bg-gray-100">Presupuestos</Link>
                    <Link href="/supplier/invoices" className="block px-4 py-2 hover:bg-gray-100">Facturas</Link>
                  </div>
                )}
              </div>

              {/* Dropdown de Pagos y Verificación */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('pagos')}
                  className="flex items-center hover:text-gray-500"
                >
                  Pagos <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.pagos && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/payments" className="block px-4 py-2 hover:bg-gray-100">Listar Pagos</Link>
                    <Link href="/admin/payments" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
                    <Link href="/payments/validation" className="block px-4 py-2 hover:bg-gray-100">Validación de Pagos</Link>
                  </div>
                )}
              </div>

              {/* Nuevo dropdown para Recibos */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('recibos')}
                  className="flex items-center hover:text-gray-500"
                >
                  Recibos <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.recibos && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
                    <Link href="/receipt/management/create" className="block px-4 py-2 hover:bg-gray-100">Generar Recibos</Link>
                  </div>
                )}
              </div>

              {/* Contabilidad */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('contabilidad')}
                  className="flex items-center hover:text-gray-500"
                >
                  Contabilidad <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.contabilidad && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/accounting/receivables" className="block px-4 py-2 hover:bg-gray-100">Cuentas por Cobrar</Link>
                    <Link href="/accounting/payables" className="block px-4 py-2 hover:bg-gray-100">Cuentas por Pagar</Link>
                    <Link href="/accounting/bank" className="block px-4 py-2 hover:bg-gray-100">Conciliación Bancaria</Link>
                    <Link href="/accounting/delinquency" className="block px-4 py-2 hover:bg-gray-100">Morosidad</Link>
                    <Link href="/accounting/reports" className="block px-4 py-2 hover:bg-gray-100">Reportes</Link>
                    <Link href="/expenses" className="block px-4 py-2 hover:bg-gray-100 font-medium text-red-600">Gastos</Link>
                    <Link href="/reserveFunds" className="block px-4 py-2 hover:bg-gray-100 font-medium text-blue-600">Fondos de Reserva</Link>
                    <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
                  </div>
                )}
              </div>

              {/* Fondos de Reserva */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('fondos')}
                  className="flex items-center hover:text-gray-500"
                >
                  Fondos de Reserva <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.fondos && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/reserveFunds" className="block px-4 py-2 hover:bg-gray-100">Todos los Fondos</Link>
                    <Link href="/reserveFunds/create" className="block px-4 py-2 hover:bg-gray-100">Crear Nuevo Fondo</Link>
                    <Link href="/expenses" className="block px-4 py-2 hover:bg-gray-100 font-medium text-red-600">Gastos</Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Menú para superadmin */}
          {userRole === 'superadmin' && (
            <>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('admin')}
                  className="flex items-center hover:text-gray-500"
                >
                  Administración <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.admin && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/condominium" className="block px-4 py-2 hover:bg-gray-100">Condominios</Link>
                    <Link href="/users" className="block px-4 py-2 hover:bg-gray-100">Usuarios</Link>
                    <Link href="/configuration" className="block px-4 py-2 hover:bg-gray-100">Configuración</Link>
                    <Link href="/expenses" className="block px-4 py-2 hover:bg-gray-100 font-medium text-red-600">Gastos</Link>
                    <Link href="/reserveFunds" className="block px-4 py-2 hover:bg-gray-100">Fondos de Reserva</Link>
                    <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
                  </div>
                )}
              </div>

              {/* Nuevo dropdown para Recibos */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('recibos')}
                  className="flex items-center hover:text-gray-500"
                >
                  Recibos <FiChevronDown className="ml-1" />
                </button>
                {dropdownOpen.recibos && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
                    <Link href="/receipt/management/create" className="block px-4 py-2 hover:bg-gray-100">Generar Recibos</Link>
                  </div>
                )}
              </div>
            </>
          )}

          <button onClick={handleLogout} className="hover:text-gray-500">Cerrar sesión</button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
           
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <Link href="/home" className="block px-4 py-2 hover:bg-gray-100">Inicio</Link>
          
          {/* Menú móvil para copropietarios */}
          {userRole === 'copropietario' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Mi Perfil</div>
              <Link href="/owner" className="block px-6 py-2 hover:bg-gray-100">Dashboard</Link>
              <Link href="/owner/profile" className="block px-6 py-2 hover:bg-gray-100">Ver Perfil</Link>
              <Link href="/owner/properties" className="block px-6 py-2 hover:bg-gray-100">Mis Propiedades</Link>
              <Link href="/owner/receipts" className="block px-6 py-2 hover:bg-gray-100">Mis Recibos</Link>
              <Link href="/owner/payments" className="block px-6 py-2 hover:bg-gray-100">Mis Pagos</Link>
            </>
          )}
          
          {/* Menú móvil para proveedores */}
          {userRole === 'proveedor' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Mi Panel</div>
              <Link href="/supplier/dashboard" className="block px-6 py-2 hover:bg-gray-100">Dashboard</Link>
              <Link href="/supplier/profile" className="block px-6 py-2 hover:bg-gray-100">Mi Perfil</Link>
              <Link href="/supplier/budgets" className="block px-6 py-2 hover:bg-gray-100">Presupuestos</Link>
              <Link href="/supplier/invoices" className="block px-6 py-2 hover:bg-gray-100">Facturas</Link>
            </>
          )}

          {/* Menú móvil para administradores */}
          {userRole === 'admin' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Propietarios</div>
              <Link href="/property" className="block px-6 py-2 hover:bg-gray-100">Propiedades</Link>
              <Link href="/owner/register" className="block px-6 py-2 hover:bg-gray-100">Registrar Propietario</Link>
              <Link href="/owner/list-owners" className="block px-6 py-2 hover:bg-gray-100">Listar Propietarios</Link>
              <Link href="/owner/unregistered-owners" className="block px-6 py-2 hover:bg-gray-100 text-yellow-600">Propietarios sin Propiedades</Link>
              <Link href="/receipts" className="block px-6 py-2 hover:bg-gray-100">Recibos</Link>
              <Link href="/payments" className="block px-6 py-2 hover:bg-gray-100">Pagos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Proveedores</div>
              <Link href="/supplier" className="block px-6 py-2 hover:bg-gray-100">Listar Proveedores</Link>
              <Link href="/supplier/admin-register" className="block px-6 py-2 hover:bg-gray-100">Registrar Proveedor</Link>
              <Link href="/supplier/budgets" className="block px-6 py-2 hover:bg-gray-100">Presupuestos</Link>
              <Link href="/supplier/invoices" className="block px-6 py-2 hover:bg-gray-100">Facturas</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Pagos</div>
              <Link href="/payments" className="block px-6 py-2 hover:bg-gray-100">Listar Pagos</Link>
              <Link href="/admin/payments" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Contabilidad</div>
              <Link href="/accounting/receivables" className="block px-6 py-2 hover:bg-gray-100">Cuentas por Cobrar</Link>
              <Link href="/accounting/payables" className="block px-6 py-2 hover:bg-gray-100">Cuentas por Pagar</Link>
              <Link href="/accounting/bank" className="block px-6 py-2 hover:bg-gray-100">Conciliación Bancaria</Link>
              <Link href="/accounting/delinquency" className="block px-6 py-2 hover:bg-gray-100">Morosidad</Link>
              <Link href="/accounting/reports" className="block px-6 py-2 hover:bg-gray-100">Reportes</Link>
              <Link href="/expenses" className="block px-6 py-2 hover:bg-gray-100 font-medium text-red-600">Gastos</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Fondos de Reserva</div>
              <Link href="/reserveFunds" className="block px-6 py-2 hover:bg-gray-100 font-medium text-blue-600">Fondos de Reserva</Link>
              <Link href="/reserveFunds/create" className="block px-6 py-2 hover:bg-gray-100">Crear Nuevo Fondo</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Recibos</div>
              <Link href="/receipt/management" className="block px-6 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
              <Link href="/receipt/management/create" className="block px-6 py-2 hover:bg-gray-100">Generar Recibos</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Pagos</div>
              <Link href="/receipts" className="block px-6 py-2 hover:bg-gray-100">Recibos</Link>
              <Link href="/payments" className="block px-6 py-2 hover:bg-gray-100">Pagos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>
              <Link href="/admin/payments" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
            </>
          )}

          {/* Menú móvil para superadmin */}
          {userRole === 'superadmin' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Administración</div>
              <Link href="/condominium" className="block px-6 py-2 hover:bg-gray-100">Condominios</Link>
              <Link href="/users" className="block px-6 py-2 hover:bg-gray-100">Usuarios</Link>
              <Link href="/configuration" className="block px-6 py-2 hover:bg-gray-100">Configuración</Link>
              <Link href="/expenses" className="block px-6 py-2 hover:bg-gray-100 font-medium text-red-600">Gastos</Link>
              
              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Fondos de Reserva</div>
              <Link href="/reserveFunds" className="block px-6 py-2 hover:bg-gray-100 font-medium text-blue-600">Fondos de Reserva</Link>
              <Link href="/reserveFunds/create" className="block px-6 py-2 hover:bg-gray-100">Crear Nuevo Fondo</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Recibos</div>
              <Link href="/receipt/management" className="block px-6 py-2 hover:bg-gray-100 font-medium text-green-600">Gestión de Recibos</Link>
              <Link href="/receipt/management/create" className="block px-6 py-2 hover:bg-gray-100">Generar Recibos</Link>
              
              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Pagos</div>
              <Link href="/receipts" className="block px-6 py-2 hover:bg-gray-100">Recibos</Link>
              <Link href="/payments" className="block px-6 py-2 hover:bg-gray-100">Pagos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>
              <Link href="/admin/payments" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
            </>
          )}

          <div className="border-t border-gray-200 mt-2 pt-2">
            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Cerrar sesión</button>
          </div>
        </div>
      )}
    </header>
  );
}