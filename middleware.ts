import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwtDecode from "jwt-decode";

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  condominiumId: number;
  authorized: boolean;
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/register", "/registerAdmin"];

// Rutas protegidas pero que no requieren verificación de perfil completo
const specialRoutes = ["/owner/register", "/supplier/register"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("Middleware - Ruta accedida:", path);

  // Permitir acceso a rutas públicas
  if (publicRoutes.includes(path)) {
    console.log("Middleware - Ruta pública, acceso permitido");
    return NextResponse.next();
  }

  // Obtener el token de las cookies
  const token = request.cookies.get("token")?.value;
  console.log("Middleware - Token encontrado:", token ? "Sí" : "No");

  if (!token) {
    console.log("Middleware - No hay token, redirigiendo a login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Decodificar el token
    const decoded = jwtDecode(token) as TokenPayload;
    //console.log("Middleware - Token decodificado:", decoded);

    // Verificar si el usuario está autorizado
    if (!decoded.authorized) {
      console.log("Middleware - Usuario no autorizado");
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Verificar si el usuario tiene un rol válido
    if (!decoded.role) {
      console.log("Middleware - Token sin rol definido");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // No verificar el perfil completo para rutas especiales
    if (specialRoutes.includes(path)) {
      console.log(`Middleware - Ruta especial ${path}, permitiendo acceso directo`);
      // Agregar información del usuario a los headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", decoded.id.toString());
      requestHeaders.set("x-user-email", decoded.email);
      requestHeaders.set("x-user-role", decoded.role);
      requestHeaders.set("x-condominium-id", decoded.condominiumId.toString());
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Si el usuario es un proveedor, verificar si tiene perfil completo
    if (decoded.role === "proveedor") {
      try {
        const response = await fetch(`http://localhost:3040/api/suppliers/user/${decoded.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          // Si no tiene perfil, redirigir a la página de completar perfil
          console.log("Middleware - Proveedor sin perfil, redirigiendo a completar perfil");
          return NextResponse.redirect(new URL("/supplier/register", request.url));
        }
      } catch (error) {
        console.error("Middleware - Error al verificar perfil de proveedor:", error);
        // En caso de error, permitimos el acceso para evitar bloqueos
      }
    }

    // Si el usuario es un copropietario, verificar si tiene perfil completo
    if (decoded.role === "copropietario") {
      try {
        const response = await fetch(`http://localhost:3040/api/owners/user/${decoded.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          // Si no tiene perfil, redirigir a la página de completar perfil
          console.log("Middleware - Copropietario sin perfil, redirigiendo a completar perfil");
          return NextResponse.redirect(new URL("/owner/register", request.url));
        }
      } catch (error) {
        console.error("Middleware - Error al verificar perfil de copropietario:", error);
        // En caso de error, permitimos el acceso para evitar bloqueos
      }
    }

    // Agregar información del usuario a los headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.id.toString());
    requestHeaders.set("x-user-email", decoded.email);
    requestHeaders.set("x-user-role", decoded.role);
    requestHeaders.set("x-condominium-id", decoded.condominiumId.toString());

    // Continuar con la solicitud
    console.log("Middleware - Acceso permitido para:", decoded.email);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware - Error al verificar el token:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/registerAdmin",
    "/home",
    "/supplier/:path*",
    "/property",
    "/administrator",
    "/owner/:path*",
    "/api/suppliers/:path*",
    "/api/economic-activities",
    "/api/owners/:path*",
    "/api/supplier-payments/:path*"
  ]
};