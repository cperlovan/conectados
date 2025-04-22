'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import * as jwtDecode from 'jwt-decode';
import { FiMenu, FiX, FiChevronDown, FiLogOut } from 'react-icons/fi';
import logo from "../../public/image/CondominiumBlanco_Circular_WhiteBG.png";
import { useRouter } from 'next/navigation';
import { useToken } from '../hook/useToken';

export default function Header() {
  const router = useRouter();
  const { userInfo } = useToken();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };
  
  const handleLogout = () => {
    Cookies.remove("token");
    router.push('/login');
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center py-4">
        {/* Logo */}
        <Link href="/home">
          <Image 
            src={logo.src} 
            width={50} 
            height={50} 
            alt="Logo del Condominio" 
            priority={true}
            className="w-auto h-auto"
            quality={90}
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-between flex-1 pl-8">
          <nav className="flex items-center space-x-6">
            <Link href="/home" className="hover:text-gray-500">Inicio</Link>
            
            {/* Menú para copropietarios */}
            {userRole === 'copropietario' && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => toggleDropdown('propietarios')}
                  className="flex items-center hover:text-gray-500"
                >
                  Mi Perfil <FiChevronDown className="ml-1" />
                </button>
                {activeDropdown === 'propietarios' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/owner" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                    <Link href="/owner/profile" className="block px-4 py-2 hover:bg-gray-100">Ver Perfil</Link>
                    <Link href="/owner/properties" className="block px-4 py-2 hover:bg-gray-100">Mis Propiedades</Link>
                    <Link href="/owner/receipts" className="block px-4 py-2 hover:bg-gray-100">Mis Recibos</Link>
                    <Link href="/owner/payments" className="block px-4 py-2 hover:bg-gray-100">Mis Pagos</Link>
                  </div>
                )}
              </div>
            )}

            {/* Menú para proveedores */}
            {userRole === 'proveedor' && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => toggleDropdown('proveedor')}
                  className="flex items-center hover:text-gray-500"
                >
                  Mi Panel <FiChevronDown className="ml-1" />
                </button>
                {activeDropdown === 'proveedor' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                    <Link href="/supplier/dashboard" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                    <Link href="/supplier/profile" className="block px-4 py-2 hover:bg-gray-100">Mi Perfil</Link>
                    <Link href="/supplier/budgets" className="block px-4 py-2 hover:bg-gray-100">Presupuestos</Link>
                    <Link href="/supplier/budget-requests" className="block px-4 py-2 hover:bg-gray-100">Solicitudes de Presupuesto</Link>
                    <Link href="/supplier/invoices" className="block px-4 py-2 hover:bg-gray-100">Facturas</Link>
                    <Link href="/supplier/payments" className="block px-4 py-2 hover:bg-gray-100 text-green-600">Pagos Recibidos</Link>
                  </div>
                )}
              </div>
            )}

            {/* Menús para administradores */}
            {userRole === 'admin' && (
              <>
                {/* Propietarios y Propiedades */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('propietarios')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Propietarios <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'propietarios' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      <Link href="/property" className="block px-4 py-2 hover:bg-gray-100">Gestión de Propiedades</Link>
                      <Link href="/owner/register" className="block px-4 py-2 hover:bg-gray-100">Registrar Propietario</Link>
                      <Link href="/owner/list-owners" className="block px-4 py-2 hover:bg-gray-100">Listar Propietarios</Link>
                      <Link href="/owner/unregistered-owners" className="block px-4 py-2 hover:bg-gray-100 text-yellow-600">Sin Propiedades</Link>
                    </div>
                  )}
                </div>

                {/* Condominio (NUEVO) */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('condominio')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Condominio <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'condominio' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      <Link href="/admin/condominium/edit" className="block px-4 py-2 hover:bg-gray-100">Editar Datos</Link>
                      {/* Add more condominium related links here if needed */}
                    </div>
                  )}
                </div>

                {/* Proveedores */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('proveedor')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Proveedores <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'proveedor' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      <Link href="/supplier" className="block px-4 py-2 hover:bg-gray-100">Listar Proveedores</Link>
                      <Link href="/supplier/admin-register" className="block px-4 py-2 hover:bg-gray-100">Registrar Proveedor</Link>
                      <Link href="/supplier/budgets" className="block px-4 py-2 hover:bg-gray-100">Presupuestos</Link>
                      <Link href="/supplier/invoices" className="block px-4 py-2 hover:bg-gray-100">Facturas</Link>
                      <Link href="/admin/supplier-payments" className="block px-4 py-2 hover:bg-gray-100 text-green-600">Pagos a Proveedores</Link>
                    </div>
                  )}
                </div>

                {/* Solicitudes de Presupuesto */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('solicitudes')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Solicitudes <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'solicitudes' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      <Link href="/admin/budget-requests" className="block px-4 py-2 hover:bg-gray-100">Solicitudes de Presupuesto</Link>
                      <Link href="/admin/budget-requests/new" className="block px-4 py-2 hover:bg-gray-100">Nueva Solicitud</Link>
                    </div>
                  )}
                </div>

                {/* Finanzas */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('finanzas')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Finanzas <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'finanzas' && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-md shadow-lg z-20">
                      <div className="py-1 border-b border-gray-200">
                        <span className="block px-4 py-1 text-sm font-semibold text-gray-500">Recibos y Pagos</span>
                        <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 text-green-600">Gestión de Recibos</Link>
                        <Link href="/receipt/management/create" className="block px-4 py-2 hover:bg-gray-100">Generar Recibos</Link>
                        <Link href="/payments" className="block px-4 py-2 hover:bg-gray-100">Listar Pagos</Link>
                        <Link href="/payments/validation" className="block px-4 py-2 hover:bg-gray-100">Validación de Pagos</Link>
                        <Link href="/admin/payments" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
                        <Link href="/admin/supplier-payments" className="block px-4 py-2 hover:bg-gray-100 text-orange-600">Pagos a Proveedores</Link>
                      </div>
                      <div className="py-1 border-b border-gray-200">
                        <span className="block px-4 py-1 text-sm font-semibold text-gray-500">Contabilidad</span>
                        <Link href="/accounting/receivables" className="block px-4 py-2 hover:bg-gray-100">Cuentas por Cobrar</Link>
                        <Link href="/accounting/payables" className="block px-4 py-2 hover:bg-gray-100">Cuentas por Pagar</Link>
                        <Link href="/accounting/bank" className="block px-4 py-2 hover:bg-gray-100">Conciliación Bancaria</Link>
                        <Link href="/accounting/delinquency" className="block px-4 py-2 hover:bg-gray-100">Morosidad</Link>
                        <Link href="/accounting/reports" className="block px-4 py-2 hover:bg-gray-100">Reportes</Link>
                      </div>
                      <div className="py-1">
                        <span className="block px-4 py-1 text-sm font-semibold text-gray-500">Gestión de Fondos</span>
                        <Link href="/expenses" className="block px-4 py-2 hover:bg-gray-100 text-red-600">Gastos</Link>
                        <Link href="/reserveFunds" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Fondos de Reserva</Link>
                        <Link href="/reserveFunds/create" className="block px-4 py-2 hover:bg-gray-100">Crear Fondo</Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Menú para superadmin */}
            {userRole === 'superadmin' && (
              <>
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('admin')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Administración <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'admin' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-20">
                      <Link href="/condominium" className="block px-4 py-2 hover:bg-gray-100">Condominios</Link>
                      <Link href="/admin/condominium/edit" className="block px-4 py-2 hover:bg-gray-100">Editar Mi Condominio</Link>
                      <Link href="/users" className="block px-4 py-2 hover:bg-gray-100">Usuarios</Link>
                      <Link href="/configuration" className="block px-4 py-2 hover:bg-gray-100">Configuración</Link>
                    </div>
                  )}
                </div>

                {/* Finanzas para superadmin */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('finanzas-super')}
                    className="flex items-center hover:text-gray-500"
                  >
                    Finanzas <FiChevronDown className="ml-1" />
                  </button>
                  {activeDropdown === 'finanzas-super' && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-md shadow-lg z-20">
                      <div className="py-1 border-b border-gray-200">
                        <span className="block px-4 py-1 text-sm font-semibold text-gray-500">Recibos y Pagos</span>
                        <Link href="/receipt/management" className="block px-4 py-2 hover:bg-gray-100 text-green-600">Gestión de Recibos</Link>
                        <Link href="/receipt/management/create" className="block px-4 py-2 hover:bg-gray-100">Generar Recibos</Link>
                        <Link href="/payments/validation" className="block px-4 py-2 hover:bg-gray-100">Validación de Pagos</Link>
                        <Link href="/admin/payments" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
                        <Link href="/admin/supplier-payments" className="block px-4 py-2 hover:bg-gray-100 text-orange-600">Pagos a Proveedores</Link>
                      </div>
                      <div className="py-1">
                        <span className="block px-4 py-1 text-sm font-semibold text-gray-500">Gestión de Fondos</span>
                        <Link href="/expenses" className="block px-4 py-2 hover:bg-gray-100 text-red-600">Gastos</Link>
                        <Link href="/reserveFunds" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">Fondos de Reserva</Link>
                        <Link href="/reserveFunds/create" className="block px-4 py-2 hover:bg-gray-100">Crear Fondo</Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* User Info Display - Now on the right */}
          <div className="flex items-center space-x-4">
            {userInfo && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {userInfo.email}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize mt-1">
                    {userInfo.role}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {userInfo?.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
           
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          {/* User Info Display Mobile - Enhanced */}
          {userInfo && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {userInfo?.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">
                    {userInfo.email}
                  </span>
                  <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full w-fit capitalize mt-1">
                    {userInfo.role}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              <Link href="/supplier/budget-requests" className="block px-6 py-2 hover:bg-gray-100">Solicitudes de Presupuesto</Link>
              <Link href="/supplier/invoices" className="block px-6 py-2 hover:bg-gray-100">Facturas</Link>
              <Link href="/supplier/payments" className="block px-6 py-2 hover:bg-gray-100 text-green-600">Pagos Recibidos</Link>
            </>
          )}

          {/* Menú móvil para administradores */}
          {userRole === 'admin' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Propietarios y Propiedades</div>
              <Link href="/property" className="block px-6 py-2 hover:bg-gray-100">Gestión de Propiedades</Link>
              <Link href="/owner/register" className="block px-6 py-2 hover:bg-gray-100">Registrar Propietario</Link>
              <Link href="/owner/list-owners" className="block px-6 py-2 hover:bg-gray-100">Listar Propietarios</Link>
              <Link href="/owner/unregistered-owners" className="block px-6 py-2 hover:bg-gray-100 text-yellow-600">Sin Propiedades</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Proveedores</div>
              <Link href="/supplier" className="block px-6 py-2 hover:bg-gray-100">Listar Proveedores</Link>
              <Link href="/supplier/admin-register" className="block px-6 py-2 hover:bg-gray-100">Registrar Proveedor</Link>
              <Link href="/supplier/budgets" className="block px-6 py-2 hover:bg-gray-100">Presupuestos</Link>
              <Link href="/supplier/invoices" className="block px-6 py-2 hover:bg-gray-100">Facturas</Link>
              <Link href="/admin/supplier-payments" className="block px-6 py-2 hover:bg-gray-100 text-green-600">Pagos a Proveedores</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Solicitudes</div>
              <Link href="/admin/budget-requests" className="block px-6 py-2 hover:bg-gray-100">Solicitudes de Presupuesto</Link>
              <Link href="/admin/budget-requests/new" className="block px-6 py-2 hover:bg-gray-100">Nueva Solicitud</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Recibos y Pagos</div>
              <Link href="/receipt/management" className="block px-6 py-2 hover:bg-gray-100 text-green-600">Gestión de Recibos</Link>
              <Link href="/receipt/management/create" className="block px-6 py-2 hover:bg-gray-100">Generar Recibos</Link>
              <Link href="/payments" className="block px-6 py-2 hover:bg-gray-100">Listar Pagos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>
              <Link href="/admin/payments" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
              <Link href="/admin/supplier-payments" className="block px-6 py-2 hover:bg-gray-100 text-orange-600">Pagos a Proveedores</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Contabilidad</div>
              <Link href="/accounting/receivables" className="block px-6 py-2 hover:bg-gray-100">Cuentas por Cobrar</Link>
              <Link href="/accounting/payables" className="block px-6 py-2 hover:bg-gray-100">Cuentas por Pagar</Link>
              <Link href="/accounting/bank" className="block px-6 py-2 hover:bg-gray-100">Conciliación Bancaria</Link>
              <Link href="/accounting/delinquency" className="block px-6 py-2 hover:bg-gray-100">Morosidad</Link>
              <Link href="/accounting/reports" className="block px-6 py-2 hover:bg-gray-100">Reportes</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Gestión de Fondos</div>
              <Link href="/expenses" className="block px-6 py-2 hover:bg-gray-100 text-red-600">Gastos</Link>
              <Link href="/reserveFunds" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Fondos de Reserva</Link>
              <Link href="/reserveFunds/create" className="block px-6 py-2 hover:bg-gray-100">Crear Fondo</Link>

              {/* Menú móvil para Condominio (Admin) */}
              {userRole === 'admin' && (
                <>
                  <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Condominio</div>
                  <Link href="/admin/condominium/edit" className="block px-6 py-2 hover:bg-gray-100">Editar Datos</Link>
                </>
              )}
            </>
          )}

          {/* Menú móvil para superadmin */}
          {userRole === 'superadmin' && (
            <>
              <div className="px-4 py-2 text-gray-500 font-semibold">Administración</div>
              <Link href="/condominium" className="block px-6 py-2 hover:bg-gray-100">Condominios</Link>
              <Link href="/admin/condominium/edit" className="block px-6 py-2 hover:bg-gray-100">Editar Mi Condominio</Link>
              <Link href="/users" className="block px-6 py-2 hover:bg-gray-100">Usuarios</Link>
              <Link href="/configuration" className="block px-6 py-2 hover:bg-gray-100">Configuración</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Recibos y Pagos</div>
              <Link href="/receipt/management" className="block px-6 py-2 hover:bg-gray-100 text-green-600">Gestión de Recibos</Link>
              <Link href="/receipt/management/create" className="block px-6 py-2 hover:bg-gray-100">Generar Recibos</Link>
              <Link href="/payments/validation" className="block px-6 py-2 hover:bg-gray-100">Validación de Pagos</Link>
              <Link href="/admin/payments" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Verificación de Pagos</Link>
              <Link href="/admin/supplier-payments" className="block px-6 py-2 hover:bg-gray-100 text-orange-600">Pagos a Proveedores</Link>

              <div className="px-4 py-2 text-gray-500 font-semibold mt-2">Gestión de Fondos</div>
              <Link href="/expenses" className="block px-6 py-2 hover:bg-gray-100 text-red-600">Gastos</Link>
              <Link href="/reserveFunds" className="block px-6 py-2 hover:bg-gray-100 text-blue-600">Fondos de Reserva</Link>
              <Link href="/reserveFunds/create" className="block px-6 py-2 hover:bg-gray-100">Crear Fondo</Link>
            </>
          )}

          <div className="border-t border-gray-200 mt-2 pt-2">
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 w-full px-4 py-2 hover:bg-gray-100 text-gray-600 hover:text-gray-800"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}