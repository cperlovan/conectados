// hooks/useToken.ts
"use client";
import { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import Cookies from "js-cookie";

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  condominiumId: number;
  authorized: boolean;
  status: string;
}

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<TokenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getToken = () => {
      try {
        // Intentar obtener el token de js-cookie
        const cookieToken = Cookies.get("token");
        console.log("useToken - Token encontrado en cookies:", cookieToken ? "Sí" : "No");
        
        if (!cookieToken) {
          console.log("useToken - No hay token en las cookies");
          setToken(null);
          setUserInfo(null);
          setIsLoading(false);
          return;
        }

        // Verificar si el token es válido
        try {
          const decoded = jwtDecode(cookieToken) as TokenPayload;
          //console.log("useToken - Token decodificado:", decoded);
          
          if (!decoded.authorized) {
            console.log("useToken - Usuario no autorizado");
            Cookies.remove("token");
            setToken(null);
            setUserInfo(null);
            setIsLoading(false);
            return;
          }
          
          if (!decoded.role) {
            console.log("useToken - Token sin rol definido");
            Cookies.remove("token");
            setToken(null);
            setUserInfo(null);
            setIsLoading(false);
            return;
          }

          // Verificar si el token ha expirado
          const currentTime = Date.now() / 1000;
          const tokenExp = (decoded as any).exp;
          if (tokenExp && tokenExp < currentTime) {
            console.log("useToken - Token expirado");
            Cookies.remove("token");
            setToken(null);
            setUserInfo(null);
            setIsLoading(false);
            return;
          }

          // Solo actualizar si hay cambios
          if (token !== cookieToken || JSON.stringify(userInfo) !== JSON.stringify(decoded)) {
            setToken(cookieToken);
            setUserInfo(decoded);
            console.log("useToken - Token y userInfo actualizados correctamente");
          }
        } catch (error) {
          console.error("useToken - Error al decodificar el token:", error);
          Cookies.remove("token");
          setToken(null);
          setUserInfo(null);
        }
      } catch (error) {
        console.error("useToken - Error al obtener el token:", error);
        setToken(null);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar inmediatamente
    getToken();

    // Configurar un intervalo para verificar cambios en las cookies cada 5 segundos
    const interval = setInterval(getToken, 5000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [token, userInfo]); // Agregar dependencias para evitar actualizaciones innecesarias

  return { token, userInfo, isLoading };
};