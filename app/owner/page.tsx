"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";
import Header from "../components/Header";
import Link from "next/link";
import { FiHome, FiFileText, FiCreditCard, FiPieChart, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { getOwnerByUserId, getPropertiesByOwnerId, getReceiptsByOwnerId, getPaymentsByOwnerId } from "../utils/api";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  linkTo?: string;
}

const StatCard = ({ title, value, icon, color, linkTo }: StatCardProps) => {
  const content = (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color} hover:shadow-lg transition duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`text-2xl ${color.replace('border-', 'text-')}`}>{icon}</div>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }

  return content;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();
  const [owner, setOwner] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      if (isLoading) return;
      if (!token || !userInfo?.id) return;
      
      try {
        setLoading(true);
        
        // Obtener datos del propietario
        const ownerData = await getOwnerByUserId(userInfo.id, token);
        setOwner(ownerData);
        
        // Obtener propiedades del propietario
        const propertiesData = await getPropertiesByOwnerId(ownerData.id, token);
        setProperties(propertiesData || []);
        
        // Obtener recibos del propietario
        const receiptsData = await getReceiptsByOwnerId(ownerData.id, token);
        setReceipts(receiptsData || []);
        
        // Obtener pagos del propietario
        const paymentsData = await getPaymentsByOwnerId(ownerData.id, token);
        setPayments(paymentsData || []);
        
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, userInfo, router, isLoading]);

  // Calcular estadísticas
  const calculateStats = () => {
    const pendingReceipts = receipts.filter(r => r.status === 'pending' || r.status === 'pendiente').length;
    const paidReceipts = receipts.filter(r => r.status === 'paid' || r.status === 'pagado').length;
    const totalProperties = properties.length;
    const totalPayments = payments.length;
    
    // Calcular monto total pagado
    const totalAmountPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // Calcular monto pendiente
    const totalPending = receipts
      .filter(r => r.status === 'pending' || r.status === 'pendiente')
      .reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);
    
    return {
      properties: totalProperties,
      pendingReceipts,
      paidReceipts,
      totalPayments,
      totalAmountPaid: totalAmountPaid.toFixed(2),
      totalPending: totalPending.toFixed(2)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido, {owner?.fullName || 'Propietario'}
          </h1>
          <p className="text-gray-600">
            Dashboard de tu cuenta de copropietario en {owner?.condominium?.name || 'Condominio'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Propiedades" 
            value={stats.properties} 
            icon={<FiHome />} 
            color="border-blue-500" 
            linkTo="/owner/properties"
          />
          <StatCard 
            title="Recibos Pendientes" 
            value={stats.pendingReceipts} 
            icon={<FiAlertCircle />} 
            color="border-yellow-500" 
            linkTo="/owner/receipts"
          />
          <StatCard 
            title="Recibos Pagados" 
            value={stats.paidReceipts} 
            icon={<FiCheckCircle />} 
            color="border-green-500" 
            linkTo="/owner/receipts"
          />
          <StatCard 
            title="Total Pagos" 
            value={stats.totalPayments} 
            icon={<FiCreditCard />} 
            color="border-purple-500" 
            linkTo="/owner/payments"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen Financiero</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Total Pagado</span>
                <span className="font-medium text-green-600">${stats.totalAmountPaid}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Total Pendiente</span>
                <span className="font-medium text-red-600">${stats.totalPending}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/owner/receipts" className="bg-blue-500 text-white py-3 px-4 rounded-md text-center hover:bg-blue-600 transition duration-300">
                Ver Recibos
              </Link>
              <Link href="/owner/payments" className="bg-green-500 text-white py-3 px-4 rounded-md text-center hover:bg-green-600 transition duration-300">
                Ver Pagos
              </Link>
              <Link href="/owner/properties" className="bg-purple-500 text-white py-3 px-4 rounded-md text-center hover:bg-purple-600 transition duration-300">
                Ver Propiedades
              </Link>
              <Link href="/owner/profile" className="bg-gray-500 text-white py-3 px-4 rounded-md text-center hover:bg-gray-600 transition duration-300">
                Mi Perfil
              </Link>
            </div>
          </div>
        </div>

        {properties.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Propiedades</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.slice(0, 5).map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {property.name || 'Sin nombre'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {property.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.address || 'No especificada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {properties.length > 5 && (
                <div className="mt-4 text-right">
                  <Link href="/owner/properties" className="text-blue-600 hover:text-blue-800">
                    Ver todas las propiedades
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {receipts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recibos Recientes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipts.slice(0, 5).map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{receipt.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${receipt.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(receipt.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          receipt.status === 'paid' || receipt.status === 'pagado' 
                            ? 'bg-green-100 text-green-800' 
                            : receipt.status === 'overdue' || receipt.status === 'vencido'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {receipt.status === 'paid' || receipt.status === 'pagado' 
                            ? 'Pagado' 
                            : receipt.status === 'overdue' || receipt.status === 'vencido'
                            ? 'Vencido'
                            : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {receipts.length > 5 && (
                <div className="mt-4 text-right">
                  <Link href="/owner/receipts" className="text-blue-600 hover:text-blue-800">
                    Ver todos los recibos
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}