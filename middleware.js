import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken'; 
import { jwtVerify, errors } from 'jose';
import { JWTExpired } from 'jose/errors';
/**
 * @param {import('next/server').NextRequest} request
 */


const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

export async function middleware(req) {
  console.log("✅ Middleware ejecutándose para la ruta:", req.nextUrl.pathname);

  const tokenCookie = req.cookies.get('token');
  console.log("🔹 Token recibido:", tokenCookie?.value);

  if (!tokenCookie || !tokenCookie.value) {
    console.log("❌ No hay token, redirigiendo a /login");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Verificar el token con `jose`
    const { payload } = await jwtVerify(tokenCookie.value, secret);
    const userRole = payload.role;
    const authorized = payload.authorized;

    console.log("✅ Token válido. Rol:", userRole, "Autorizado:", authorized);

    if (!authorized) {
      console.log("⛔ Usuario bloqueado. Redirigiendo a /unauthorized");
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Definir rutas permitidas
    const adminRoutes = ['/home', '/', '/proveedor'];
    const userRoutes = ['/home', '/'];

    const requestedPath = req.nextUrl.pathname;

    // Verificación de permisos
    if (userRole === 'admin' && !adminRoutes.includes(requestedPath)) {
      console.log("⛔ Acceso denegado para admin:", requestedPath);
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (userRole === 'user' && !userRoutes.includes(requestedPath)) {
      console.log("⛔ Acceso denegado para user:", requestedPath);
      return NextResponse.redirect(new URL('/unauthorized', req.url));

    }
  } catch (error) {
    if (error instanceof JWTExpired) {
      console.log("❌ Token expirado, redirigiendo a /login");
      return NextResponse.redirect(new URL('/login', req.url));
    }
    console.error("❌ Error al verificar el token:", error);
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/','/home', '/proveedor' ],
};