"use client";

// URL base para las peticiones API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api';

interface FetchOptions {
  token?: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Función para realizar peticiones a la API con manejo de errores
 */
export async function fetchAPI(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const { token, method = 'GET', body, headers = {} } = options;
  
  try {
    console.log(`Realizando petición a: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...headers
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    
    console.log(`Respuesta recibida de ${endpoint}:`, { 
      status: response.status, 
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, string>)
    });
    
    // Procesamos la respuesta una sola vez
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log(`Datos de respuesta de ${endpoint}:`, data);
      } catch (error) {
        console.error('Error al parsear JSON:', error);
        const responseText = await response.text();
        console.error('Texto de respuesta crudo:', responseText);
        data = { error: 'Error al procesar la respuesta del servidor' };
      }
    } else {
      const responseText = await response.text();
      console.log(`Texto de respuesta de ${endpoint}:`, responseText);
      data = { message: responseText };
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
 * Función para obtener los recibos de un usuario
 */
export async function getReceiptsByUserId(userId: number, token: string) {
  return fetchAPI(`/receipts/user/${userId}`, { token });
}

/**
 * Función para obtener los pagos de un usuario.
 * Esta función primero obtiene los recibos del usuario y luego
 * obtiene los pagos asociados a esos recibos.
 */
export async function getPaymentsByUserId(userId: number, token: string) {
  try {
    console.log(`Iniciando obtención de pagos para el usuario: ${userId}`);
    
    // Primero obtenemos los recibos del usuario, agregando un timestamp para evitar caché
    const timestamp = new Date().getTime();
    const receipts = await fetchAPI(`/receipts/user/${userId}?_nocache=${timestamp}`, { token });
    
    console.log(`Recibos obtenidos para el usuario ${userId}:`, receipts);
    
    // Si no hay recibos, retornamos un array vacío
    if (!receipts || receipts.length === 0) {
      console.log(`No se encontraron recibos para el usuario ${userId}`);
      return [];
    }
    
    // Luego obtenemos los pagos de cada recibo, también evitando caché
    console.log(`Obteniendo pagos para ${receipts.length} recibos`);
    
    const paymentsPromises = receipts
      .filter((receipt: Receipt) => receipt.id) // Aseguramos que el recibo tenga un ID
      .map((receipt: Receipt) => {
        console.log(`Obteniendo pagos para el recibo ${receipt.id}`);
        return fetchAPI(`/payments/receipt/${receipt.id}?_nocache=${timestamp}`, { token })
          .then(payments => {
            console.log(`Pagos obtenidos para el recibo ${receipt.id}:`, payments);
            return payments;
          })
          .catch(error => {
            console.error(`Error al obtener los pagos del recibo ${receipt.id}:`, error);
            return []; // Si hay un error, retornamos un array vacío
          });
      });
    
    // Esperamos a que se resuelvan todas las promesas
    const paymentsArrays = await Promise.all(paymentsPromises);
    
    console.log('Arrays de pagos obtenidos:', paymentsArrays);
    
    // Aplanamos el array y procesamos cada pago
    const allPayments = paymentsArrays.flat().map(payment => {
      if (!payment) {
        console.warn('Se encontró un pago nulo o undefined');
        return null;
      }
      
      // Crear una copia para modificar
      const processedPayment = { ...payment };
      
      // Agregar información del recibo si no la tiene
      if (!processedPayment.receipt) {
        console.log(`Agregando información de recibo al pago ${processedPayment.id}`);
        const receipt = receipts.find((r: Receipt) => r.id === processedPayment.receiptId);
        if (receipt) {
          processedPayment.receipt = receipt;
        }
      }
      
      // Aplicar estado guardado localmente si existe
      if (processedPayment.id) {
        const localStatus = getLocalPaymentStatus(processedPayment.id);
        if (localStatus) {
          console.log(`Aplicando estado local "${localStatus}" al pago ${processedPayment.id}`);
          processedPayment.status = localStatus;
        }
      }
      
      return processedPayment;
    }).filter(Boolean); // Filtramos posibles valores nulos
    
    console.log('Total de pagos obtenidos para el usuario:', userId, allPayments.length);
    console.log('Detalle de pagos:', allPayments);
    
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

/**
 * Función para obtener todos los recibos de un condominio
 */
export async function getReceiptsByCondominiumId(condominiumId: number, token: string) {
  return fetchAPI(`/receipts/condominium/${condominiumId}`, { token });
}

/**
 * Función para cambiar la visibilidad de los recibos (hacerlos públicos/privados)
 */
export async function toggleReceiptsVisibility(
  receiptIds: number[],
  visible: boolean,
  token: string
) {
  return fetchAPI('/receipts/visibility', {
    method: 'PUT',
    body: { receiptIds, visible },
    token
  });
}

/**
 * Función para generar recibos para todas las propiedades de un condominio
 * basado en las alícuotas y los gastos del mes actual
 */
export async function generateReceipts(data: {
  dueDate: string;
  condominiumId: number;
}, token: string) {
  return fetchAPI('/receipts', { 
    method: 'POST',
    body: data,
    token
  });
}

/**
 * Función para actualizar un recibo
 */
export async function updateReceipt(receiptId: number, data: Partial<Receipt>, token: string) {
  return fetchAPI(`/receipts/${receiptId}`, { 
    method: 'PUT',
    body: data,
    token
  });
}

/**
 * Función para eliminar un recibo (lógicamente)
 */
export async function deleteReceipt(receiptId: number, token: string) {
  return fetchAPI(`/receipts/${receiptId}`, { 
    method: 'DELETE',
    token
  });
}

/**
 * Función para generar un PDF de un recibo
 * Nota: Esta función solo se utiliza como referencia, la generación real
 * de PDF se realiza en el componente ReceiptPDF.tsx
 */
export async function generateReceiptPDF(receiptId: number, token: string) {
  // Esta función podría devolver un blob o una URL para descargar el PDF
  return fetchAPI(`/receipts/${receiptId}/pdf`, { token });
}

/**
 * Función para obtener un pago por su ID
 */
export async function getPaymentById(paymentId: number, token: string, condominiumId?: number) {
  try {
    // Si no se proporcionó condominiumId, no podemos continuar
    if (!condominiumId) {
      throw new Error('No se proporcionó condominiumId para obtener el pago');
    }
    
    console.log(`Obteniendo pago con ID ${paymentId}`);
    
    // Primero intentamos obtener el pago directamente por ID si esta API existe
    let payment;
    try {
      // Añadimos un timestamp para evitar la caché
      const timestamp = new Date().getTime();
      payment = await fetchAPI(`/payments/${paymentId}?_nocache=${timestamp}`, { token });
      
      if (payment && payment.id) {
        console.log(`Pago obtenido directamente: ${payment.id}`);
      }
    } catch (directError) {
      console.log('La API directa de pagos no está disponible, buscando en recibos...');
    }
    
    // Si no pudimos obtener el pago directamente, buscamos en los recibos
    if (!payment || !payment.id) {
      // Buscamos en todos los recibos del condominio
      const receipts = await getReceiptsByCondominiumId(condominiumId, token);
      
      if (!receipts || receipts.length === 0) {
        throw new Error('No se encontraron recibos asociados al condominio');
      }
      
      // Buscamos los pagos en cada recibo
      for (const receipt of receipts) {
        if (!receipt.id) continue;
        
        try {
          // Añadimos un timestamp para evitar la caché
          const timestamp = new Date().getTime();
          const payments = await fetchAPI(`/payments/receipt/${receipt.id}?_nocache=${timestamp}`, { token });
          
          if (Array.isArray(payments)) {
            payment = payments.find(p => p.id === paymentId);
            if (payment) {
              // Agregamos información del recibo si no está disponible
              if (!payment.receipt) {
                payment.receipt = receipt;
              }
              console.log(`Pago ${paymentId} encontrado en el recibo ${receipt.id}`);
              break;
            }
          }
        } catch (error) {
          console.error(`Error al obtener los pagos del recibo ${receipt.id}:`, error);
        }
      }
    }
    
    if (!payment) {
      throw new Error(`No se encontró el pago con ID ${paymentId}`);
    }
    
    // Comprobamos si hay un estado guardado localmente y lo aplicamos
    const localStatus = getLocalPaymentStatus(paymentId);
    if (localStatus) {
      console.log(`Aplicando estado local "${localStatus}" al pago ${paymentId}`);
      payment.status = localStatus;
    }
    
    return payment;
  } catch (error) {
    console.error(`Error al obtener el pago con ID ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Recupera el estado guardado localmente para un pago
 */
function getLocalPaymentStatus(paymentId: number): string | null {
  try {
    // Solo ejecutamos en entorno de navegador
    if (typeof window !== 'undefined') {
      const savedStatuses = JSON.parse(localStorage.getItem('payment_statuses') || '{}');
      return savedStatuses[paymentId] || null;
    }
    return null;
  } catch (error) {
    console.error('Error al recuperar estado de localStorage:', error);
    return null;
  }
}

/**
 * Función para verificar si el backend soporta actualización de pagos
 * Esta función comprueba si el endpoint está disponible
 */
export async function checkPaymentUpdateSupport(token: string): Promise<boolean> {
  try {
    // Hacemos una petición OPTIONS para verificar si el endpoint existe
    // sin hacer cambios reales
    const response = await fetch(`${API_BASE_URL}/payments/test`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Si obtenemos un status 200 o similar, el endpoint existe
    if (response.ok) {
      return true;
    }
    
    // Si obtenemos un 404, el endpoint no existe pero el servidor funciona
    if (response.status === 404) {
      console.warn('El endpoint de prueba de pagos no existe, pero el servidor respondió');
      // Comprobamos si al menos el API base funciona
      const baseResponse = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return baseResponse.ok;
    }
    
    return false;
  } catch (error) {
    console.error('Error al verificar soporte para actualización de pagos:', error);
    return false;
  }
}

/**
 * Función para actualizar el estado de un pago
 */
export async function updatePaymentStatus(paymentId: number, status: string, token: string, condominiumId?: number) {
  try {
    // Si no se proporcionó condominiumId, no podemos continuar
    if (!condominiumId) {
      throw new Error('No se proporcionó condominiumId para actualizar el estado del pago');
    }
    
    // Primero encontramos el pago para asegurarnos de que existe
    const payment = await getPaymentById(paymentId, token, condominiumId);
    
    if (!payment) {
      throw new Error(`No se encontró el pago con ID ${paymentId}`);
    }
    
    console.log(`Actualizando estado del pago ${paymentId} a "${status}"`);
    
    try {
      // Intentamos actualizar en el backend
      const updatedPayment = await fetchAPI(`/payments/${paymentId}`, {
        method: 'PUT',
        body: { status },
        token
      });
      
      // Si la API devuelve un resultado exitoso, lo usamos
      if (updatedPayment && updatedPayment.id) {
        // Almacenar el estado actualizado en localStorage
        savePaymentStatusLocally(paymentId, status);
        return updatedPayment;
      }
    } catch (apiError) {
      console.warn('Error en la API al actualizar el estado:', apiError);
      // Continuamos con el flujo alternativo
    }
    
    // Si llegamos aquí, el backend no actualizó correctamente
    // Almacenar el estado actualizado en localStorage
    savePaymentStatusLocally(paymentId, status);
    
    // Devolver un objeto con los datos originales pero con estado actualizado
    return {
      ...payment,
      status: status
    };
  } catch (error) {
    console.error(`Error al actualizar el estado del pago ${paymentId}:`, error);
    
    // En caso de error, almacenamos localmente y simulamos la actualización
    savePaymentStatusLocally(paymentId, status);
    
    // Intentamos obtener el pago original para devolverlo con estado actualizado
    try {
      const payment = await getPaymentById(paymentId, token, condominiumId);
      if (payment) {
        console.log('Simulando actualización de estado usando localStorage');
        return {
          ...payment,
          status: status
        };
      }
    } catch (fallbackError) {
      console.error('Error en método de fallback:', fallbackError);
    }
    
    // Si todo falla, lanzamos el error original
    throw error;
  }
}

/**
 * Guarda el estado de un pago en localStorage
 */
function savePaymentStatusLocally(paymentId: number, status: string) {
  try {
    // Solo ejecutamos en entorno de navegador
    if (typeof window !== 'undefined') {
      // Obtenemos estados guardados o iniciamos un objeto vacío
      const savedStatuses = JSON.parse(localStorage.getItem('payment_statuses') || '{}');
      
      // Guardamos el nuevo estado
      savedStatuses[paymentId] = status;
      
      // Guardamos en localStorage
      localStorage.setItem('payment_statuses', JSON.stringify(savedStatuses));
      
      console.log(`Estado del pago ${paymentId} guardado localmente como "${status}"`);
    }
  } catch (error) {
    console.error('Error al guardar estado en localStorage:', error);
  }
}

/**
 * Función para obtener todos los pagos (para administradores)
 */
export async function getAllPayments(token: string, condominiumId?: number) {
  try {
    // If condominiumId is provided directly, use it
    // Otherwise we can't proceed
    if (!condominiumId) {
      console.warn('No se proporcionó condominiumId para obtener pagos');
      return [];
    }
    
    // Get all receipts for that condominium
    const receipts = await getReceiptsByCondominiumId(condominiumId, token);
    
    if (!receipts || receipts.length === 0) {
      return [];
    }
    
    // Then get all payments for those receipts
    const paymentsPromises = receipts
      .filter((receipt: Receipt) => receipt.id)
      .map((receipt: Receipt) => 
        fetchAPI(`/payments/receipt/${receipt.id}`, { token })
          .catch(error => {
            console.error(`Error al obtener los pagos del recibo ${receipt.id}:`, error);
            return []; // If there's an error, return an empty array
          })
      );
    
    // Wait for all promises to resolve
    const paymentsArrays = await Promise.all(paymentsPromises);
    
    // Flatten the array and add receipt information if not available
    const allPayments = paymentsArrays.flat().map(payment => {
      if (!payment) return null;
      
      // Procesar el pago
      const result = { ...payment };
      
      // Agregar información del recibo si no está disponible
      if (!result.receipt) {
        const receipt = receipts.find((r: Receipt) => r.id === result.receiptId);
        if (receipt) {
          result.receipt = receipt;
        }
      }
      
      // Aplicar estado guardado localmente si existe
      if (result.id) {
        const localStatus = getLocalPaymentStatus(result.id);
        if (localStatus) {
          console.log(`Aplicando estado local "${localStatus}" al pago ${result.id} en lista`);
          result.status = localStatus;
        }
      }
      
      return result;
    }).filter(Boolean); // Filtrar elementos nulos
    
    return allPayments;
  } catch (error) {
    console.error("Error al obtener todos los pagos:", error);
    throw error;
  }
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
  month?: string | null;
  year?: number | null;
  amount: number;
  dueDate: string;
  status?: string;
  propertyId?: number;
  condominiumId?: number;
  createdAt?: string;
  updatedAt?: string;
  pending_amount?: number | null;
  credit_balance?: number | null;
  visible?: boolean;
  User?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  Owner?: {
    id: number;
    fullName: string;
    phone?: string;
  } | null;
  Condominium?: {
    id: number;
    name: string;
  } | null;
  property?: {
    id?: number;
    number?: string | null;
    block?: string | null;
    floor?: string | null;
    condominiumId?: number;
    type?: string;
    status?: string;
    aliquot?: number;
  } | null;
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
      number?: string | null;
      block?: string | null;
      floor?: string | null;
      type?: string;
      status?: string;
    };
  };
} 