// hooks/useToken.ts
"use client";
import { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import Cookies from "js-cookie";

interface TokenPayload {
  id: string;
  role: string;
  name: string;
  email: string;
  condominiumId?: number;
  supplierId?: number;
  exp: number;
}

interface UserInfo {
  id: string;
  role: string;
  name: string;
  email: string;
  condominiumId?: number;
  supplierId?: number;
}

export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing token from cookies");
        const storedToken = Cookies.get('token');
        
        if (!storedToken) {
          console.log("No token found in cookies");
          setToken(null);
          setUserInfo(null);
          setIsLoading(false);
          return;
        }

        // Decodificar el token
        try {
          const decoded = jwtDecode<TokenPayload>(storedToken);
          console.log("Token decoded successfully", { 
            role: decoded.role,
            hasCondominiumId: !!decoded.condominiumId,
            hasSupplierId: !!decoded.supplierId,
            expiry: new Date(decoded.exp * 1000).toISOString()
          });
          
          // Verificar si el token ha expirado
          if (decoded.exp * 1000 < Date.now()) {
            console.log("Token has expired, removing it");
            Cookies.remove('token');
            setToken(null);
            setUserInfo(null);
            setIsLoading(false);
            return;
          }

          // Si el usuario es proveedor y no tiene supplierId, intentar obtenerlo
          if ((decoded.role === 'proveedor' || decoded.role === 'supplier') && !decoded.supplierId) {
            console.log("User is a supplier but doesn't have supplierId, fetching it", {
              userId: decoded.id
            });
            
            try {
              const response = await fetch(`http://localhost:3040/api/suppliers/user/${decoded.id}`, {
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                },
              });

              console.log("Supplier ID fetch response status:", response.status);

              if (!response.ok) {
                const errorData = await response.json();
                console.error("Error fetching supplier ID:", errorData);
                throw new Error('Error al obtener información del proveedor');
              }

              const data = await response.json();
              console.log("Supplier data received:", data);
              
              if (data && data.id) {
                console.log("Setting supplierId:", data.id);
                decoded.supplierId = data.id;
              } else {
                console.warn("No supplier ID found in response");
              }
            } catch (error) {
              console.error('Error fetching supplierId:', error);
              // We'll continue even without the supplierId, just log the error
            }
          }

          // Actualizar el estado con la información del token
          console.log("Setting token and user info");
          setToken(storedToken);
          setUserInfo({
            id: decoded.id,
            role: decoded.role,
            name: decoded.name,
            email: decoded.email,
            condominiumId: decoded.condominiumId,
            supplierId: decoded.supplierId,
          });
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          Cookies.remove('token');
          setToken(null);
          setUserInfo(null);
          setError('Invalid token format');
        }
      } catch (error) {
        console.error('Error initializing token:', error);
        setError('Error al procesar la autenticación');
        Cookies.remove('token');
        setToken(null);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  return { token, userInfo, isLoading, error };
}