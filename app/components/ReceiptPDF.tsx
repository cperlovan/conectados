"use client";

import React from 'react';
import { Receipt } from '../utils/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FiDownload } from 'react-icons/fi';

// Extendemos jsPDF para incluir autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReceiptPDFProps {
  receipt: Receipt;
  buttonLabel?: string;
  className?: string;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  receipt,
  buttonLabel = "Descargar PDF",
  className = "bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center text-sm"
}) => {
  // Validación para prevenir errores si receipt es null o undefined
  if (!receipt) {
    return null;
  }

  const generatePDF = () => {
    // Crear un nuevo documento PDF
    const doc = new jsPDF();
    
    // Formatear fecha
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        return "N/A";
      }
    };
    
    // Formatear moneda
    const formatCurrency = (amount?: number | string | null) => {
      if (amount === undefined || amount === null) return "0,00 $";
      try {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(numAmount);
      } catch (e) {
        return "0,00 $";
      }
    };
    
    // Obtener el estado en español
    const getStatusText = (status?: string) => {
      if (!status) return "Pendiente";
      switch (status.toLowerCase()) {
        case 'paid': return 'Pagado';
        case 'pending': return 'Pendiente';
        case 'overdue': return 'Vencido';
        default: return status;
      }
    };
    
    // Agregar título y número de recibo
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153);
    doc.text("RECIBO DE CONDOMINIO", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Recibo #${receipt.id || "N/A"}`, 20, 35);
    
    // Agregar información del condominio
    doc.setFontSize(10);
    const condominiumName = receipt.Condominium?.name || "N/A";
    doc.text(`Condominio: ${condominiumName}`, 20, 45);
    
    // Agregar fecha de emisión y vencimiento
    doc.text(`Fecha de emisión: ${formatDate(receipt.createdAt)}`, 20, 55);
    doc.text(`Fecha de vencimiento: ${formatDate(receipt.dueDate)}`, 20, 65);
    
    // Agregar información del propietario
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 153);
    doc.text("Información del Propietario", 20, 80);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const ownerName = receipt.Owner?.fullName || receipt.User?.name || "N/A";
    const ownerEmail = receipt.User?.email || "N/A";
    doc.text(`Nombre: ${ownerName}`, 20, 90);
    doc.text(`Email: ${ownerEmail}`, 20, 100);
    
    // Información de la propiedad
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 153);
    doc.text("Información de la Propiedad", 20, 115);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    if (receipt.property) {
      let propertyLine = 125;
      
      // Property type if available
      if (receipt.property.type) {
        const formattedType = receipt.property.type.charAt(0).toUpperCase() + receipt.property.type.slice(1);
        doc.text(`Tipo: ${formattedType}`, 20, propertyLine);
        propertyLine += 10;
      }
      
      // Property number
      if (receipt.property.number) {
        doc.text(`Número: ${receipt.property.number}`, 20, propertyLine);
        propertyLine += 10;
      }
      
      // Property block
      if (receipt.property.block) {
        doc.text(`Bloque: ${receipt.property.block}`, 20, propertyLine);
        propertyLine += 10;
      }
      
      // Property floor
      if (receipt.property.floor) {
        doc.text(`Piso: ${receipt.property.floor}`, 20, propertyLine);
        propertyLine += 10;
      }
      
      // Property aliquot
      if (receipt.property.aliquot) {
        doc.text(`Alícuota: ${receipt.property.aliquot}%`, 20, propertyLine);
      }
    } else {
      doc.text("Información no disponible", 20, 125);
    }
    
    // Tabla de resumen de cobro
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 153);
    doc.text("Resumen de Cobro", 20, 165);
    
    doc.autoTable({
      startY: 170,
      head: [['Concepto', 'Monto']],
      body: [
        ['Monto Total', formatCurrency(receipt.amount)],
        ['Saldo Pendiente', formatCurrency(receipt.pending_amount)],
        ['Crédito Disponible', formatCurrency(receipt.credit_balance)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
    });
    
    // Agregar estado del pago
    const tableEndY = (doc as any).lastAutoTable?.finalY + 10 || 220;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 153);
    doc.text("Estado del Pago", 20, tableEndY);
    
    doc.setFontSize(14);
    
    // Color según el estado
    const status = receipt.status?.toLowerCase() || 'pending';
    if (status === 'paid') {
      doc.setTextColor(0, 128, 0); // Verde para pagado
    } else if (status === 'pending') {
      doc.setTextColor(204, 102, 0); // Naranja para pendiente
    } else if (status === 'overdue') {
      doc.setTextColor(204, 0, 0); // Rojo para vencido
    }
    
    doc.text(getStatusText(receipt.status), 20, tableEndY + 10);
    
    // Pie de página con información legal y de contacto
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Este documento es un comprobante de cobro de cuota de condominio. Favor pagar antes de la fecha de vencimiento.",
      105, 270, { align: 'center' }
    );
    doc.text(
      `Generado el ${new Date().toLocaleDateString()}`,
      105, 275, { align: 'center' }
    );
    
    // Guardar el PDF
    doc.save(`recibo-${receipt.id}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className={className}
      title="Descargar recibo en PDF"
    >
      <FiDownload className="mr-2" />
      {buttonLabel}
    </button>
  );
};

export default ReceiptPDF; 