"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../../hook/useToken";
import Header from "../../components/Header";
import Link from "next/link";

interface DashboardStats {
  totalBudgets: number;
  pendingBudgets: number;
  totalInvoices: number;
  pendingInvoices: number;
}

export default function SupplierDashboard() {
  const router = useRouter();
  const { token, userInfo } = useToken();
  const [stats, setStats] = useState<DashboardStats>({
    totalBudgets: 0,
    pendingBudgets: 0,
    totalInvoices: 0,
    pendingInvoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token || !userInfo) return;

      try {
        // Primero obtener el ID del proveedor asociado al usuario
        const supplierResponse = await fetch(
          `http://localhost:3040/api/suppliers/user/${userInfo.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!supplierResponse.ok) {
          throw new Error("Error al obtener el perfil de proveedor");
        }

        const supplierData = await supplierResponse.json();
        console.log("Datos del proveedor:", supplierData);

        // Obtener presupuestos usando el ID del proveedor
        const budgetsResponse = await fetch(
          `http://localhost:3040/api/budgets/supplier/${supplierData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!budgetsResponse.ok) {
          throw new Error("Error al cargar presupuestos");
        }
        const budgetsData = await budgetsResponse.json();
        console.log("Presupuestos recibidos:", budgetsData);

        // Obtener facturas usando el ID del proveedor
        const invoicesResponse = await fetch(
          `http://localhost:3040/api/invoices/supplier/${supplierData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        let invoicesData = [];
        if (invoicesResponse.ok) {
          invoicesData = await invoicesResponse.json();
          console.log("Facturas recibidas:", invoicesData);
        } else {
          console.error("Error al cargar facturas:", await invoicesResponse.text());
        }

        // Calcular estadísticas con presupuestos y facturas
        const newStats = {
          totalBudgets: Array.isArray(budgetsData) ? budgetsData.length : 0,
          pendingBudgets: Array.isArray(budgetsData) 
            ? budgetsData.filter((b: any) => b.status === "pending").length 
            : 0,
          totalInvoices: Array.isArray(invoicesData) ? invoicesData.length : 0,
          pendingInvoices: Array.isArray(invoicesData)
            ? invoicesData.filter((i: any) => i.status === "pending").length
            : 0
        };
        
        console.log("Estadísticas calculadas:", newStats);
        setStats(newStats);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, userInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard del Proveedor</h1>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Presupuestos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Presupuestos</h2>
            <div className="space-y-2">
              <p className="text-gray-600">Total: {stats.totalBudgets}</p>
              <p className="text-gray-600">Pendientes: {stats.pendingBudgets}</p>
            </div>
            <Link
              href="/supplier/budgets"
              className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Ver Presupuestos
            </Link>
          </div>

          {/* Facturas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Facturas</h2>
            <div className="space-y-2">
              <p className="text-gray-600">Total: {stats.totalInvoices}</p>
              <p className="text-gray-600">Pendientes: {stats.pendingInvoices}</p>
            </div>
            <Link
              href="/supplier/invoices"
              className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Ver Facturas
            </Link>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/supplier/budgets/new"
              className="bg-green-600 text-white px-6 py-3 rounded-lg text-center hover:bg-green-700"
            >
              Crear Nuevo Presupuesto
            </Link>
            <Link
              href="/supplier/invoices/new"
              className="bg-green-600 text-white px-6 py-3 rounded-lg text-center hover:bg-green-700"
            >
              Crear Nueva Factura
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 