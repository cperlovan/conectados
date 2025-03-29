"use client";

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api';

interface FetchOptions {
  token?: string;
  method?: string;
  body?: any;
}

/**
 * Función para realizar peticiones a la API con manejo de errores
 */
export async function fetchAPI(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const { token, method = 'GET', body } = options;
  
  try {
    console.log(`Realizando petición a: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    
    // Procesamos la respuesta una sola vez
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error al parsear JSON:', error);
        data = { error: 'Error al procesar la respuesta del servidor' };
      }
    } else {
      data = { message: await response.text() };
    }
    
    if (!response.ok) {
      const errorMessage = data.message || `Error en fetchAPI ${endpoint}: ${response.statusText}`;
      console.error(`Error ${response.status} en ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`Error en fetchAPI ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Función para obtener los datos del propietario por ID de usuario
 */
export async function getOwnerByUserId(userId: number, token: string) {
  return fetchAPI(`/owners/user/${userId}`, { token });
}

/**
 * Función para obtener las propiedades de un propietario
 */
export async function getPropertiesByOwnerId(ownerId: number, token: string) {
  // Corregir la ruta para que coincida con la definición del backend
  return fetchAPI(`/properties/owner/${ownerId}`, { token });
}

/**
 * Función para obtener los recibos de un propietario
 */
export async function getReceiptsByOwnerId(ownerId: number, token: string) {
  return fetchAPI(`/receipts/user/${ownerId}`, { token });
}

/**
 * Función para obtener los pagos de un propietario.
 * Esta función primero obtiene los recibos del usuario y luego
 * obtiene los pagos asociados a esos recibos.
 */
export async function getPaymentsByOwnerId(ownerId: number, token: string) {
  try {
    // Primero obtenemos los recibos del usuario
    const receipts = await getReceiptsByOwnerId(ownerId, token);
    
    // Si no hay recibos, retornamos un array vacío
    if (!receipts || receipts.length === 0) {
      return [];
    }
    
    // Luego obtenemos los pagos de cada recibo
    const paymentsPromises = receipts
      .filter((receipt: Receipt) => receipt.id) // Aseguramos que el recibo tenga un ID
      .map((receipt: Receipt) => 
        fetchAPI(`/payments/receipt/${receipt.id}`, { token })
          .catch(error => {
            console.error(`Error al obtener los pagos del recibo ${receipt.id}:`, error);
            return []; // Si hay un error, retornamos un array vacío
          })
      );
    
    // Esperamos a que se resuelvan todas las promesas
    const paymentsArrays = await Promise.all(paymentsPromises);
    
    // Aplanamos el array y agregamos información del recibo si no la tiene
    const allPayments = paymentsArrays.flat().map(payment => {
      if (!payment.receipt) {
        const receipt = receipts.find((r: Receipt) => r.id === payment.receiptId);
        if (receipt) {
          return {
            ...payment,
            receipt
          };
        }
      }
      return payment;
    });
    
    return allPayments;
  } catch (error) {
    console.error("Error al obtener los pagos:", error);
    throw error;
  }
}

/**
 * Función para obtener una propiedad por ID
 */
export async function getPropertyById(propertyId: number, token: string) {
  return fetchAPI(`/properties/${propertyId}`, { token });
}

/**
 * Función para obtener todas las propiedades
 */
export async function getAllProperties(token: string) {
  return fetchAPI(`/properties`, { token });
}

// Interfaces para los tipos de respuesta
export interface Owner {
  id: number;
  userId: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  address: string;
  phoneNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface Property {
  id: number;
  name: string;
  type: string;
  address: string;
  status: string; // "occupied" | "vacant" | "under_maintenance"
  ownerId: number;
  condominiumId: number;
  number?: string;
  block?: string;
  aliquot?: number;
  owner: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Receipt {
  id: number;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
  status: string;
  propertyId?: number;
  condominiumId?: number;
  createdAt?: string;
  updatedAt?: string;
  property: {
    id: number;
    name: string;
    number?: string;
    block?: string;
    condominiumId?: number;
  };
}

export interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  receiptId?: number;
  receipt?: {
    id: number;
    month: string;
    year: number;
    property: {
      id: number;
      name: string;
      number?: string;
    };
  };
} 