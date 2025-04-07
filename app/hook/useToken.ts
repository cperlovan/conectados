// hooks/useToken.ts
"use client";
import { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import Cookies from "js-cookie";

interface TokenPayload {
  id: number;
  role: string;
  name?: string;
  email?: string;
  condominiumId?: number;
  supplierId?: number;
  exp?: number;
}

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<TokenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        // Obtener el token de las cookies
        const tokenFromCookie = Cookies.get('token');
        if (!tokenFromCookie) {
          console.log('No se encontró token en las cookies');
          setIsLoading(false);
          return;
        }

        // Decodificar el token
        const decoded = jwtDecode<TokenPayload>(tokenFromCookie);
        console.log('Token decodificado:', decoded);

        // Verificar que el token tenga la información necesaria
        if (!decoded || typeof decoded !== 'object' || !('id' in decoded) || !('role' in decoded)) {
          console.error('Token inválido o incompleto:', decoded);
          setError('Token inválido o incompleto');
          setIsLoading(false);
          return;
        }

        // Establecer el token y la información del usuario
        setToken(tokenFromCookie);
        setUserInfo({
          id: decoded.id,
          role: decoded.role,
          name: decoded.name,
          email: decoded.email,
          condominiumId: decoded.condominiumId,
          supplierId: decoded.supplierId
        });

        // Si el usuario es un proveedor y no tiene supplierId en el token, intentar obtenerlo
        if ((decoded.role === 'proveedor' || decoded.role === 'supplier') && !decoded.supplierId) {
          console.log('Usuario es proveedor pero no tiene supplierId en el token, intentando obtenerlo...');
          const supplierId = await fetchSupplierId(decoded.id, tokenFromCookie);
          if (supplierId) {
            console.log('SupplierId obtenido:', supplierId);
            setUserInfo(prev => prev ? {
              ...prev,
              supplierId
            } : null);
          } else {
            console.warn('No se pudo obtener el supplierId, pero se permitirá continuar');
            // No establecemos un error aquí, permitimos que el controlador específico decida cómo manejar la ausencia de supplierId
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error al inicializar el token:', err);
        setError(err instanceof Error ? err.message : 'Error al inicializar el token');
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  const fetchSupplierId = async (userId: number, token: string): Promise<number | null> => {
    try {
      console.log('Obteniendo supplierId para usuario:', userId);
      const response = await fetch(`http://localhost:3040/api/suppliers/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener el ID del proveedor");
      }

      const data = await response.json();
      console.log('Respuesta al obtener supplierId:', data);

      if (!data?.id) {
        console.error('No se encontró el ID del proveedor en la respuesta');
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('Error al obtener supplierId:', err);
      return null;
    }
  };

  return {
    token,
    userInfo,
    isLoading,
    error
  };
};