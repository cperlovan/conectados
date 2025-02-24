/* global process */
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JWTExpired } from 'jose/errors';

const jwtSecret = process.env.JWT_SECRET; 

if (!jwtSecret) {
    console.error("Error: JWT_SECRET no está definido en las variables de entorno.");
   
}

const secret = new TextEncoder().encode(jwtSecret || '');

export async function middleware(req) {
    console.log("✅ Middleware ejecutándose para la ruta:", req.nextUrl.pathname);

    const tokenCookie = req.cookies.get('token');
    console.log("🔹 Token recibido:", tokenCookie?.value);

    if (!tokenCookie || !tokenCookie.value) {
        console.log("❌ No hay token, redirigiendo a /login");
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        const { payload } = await jwtVerify(tokenCookie.value, secret);
        const userRole = payload.role;
        const authorized = payload.authorized;

        console.log("✅ Token válido. Rol:", userRole, "Autorizado:", authorized);

        if (!authorized) {
            console.log("⛔ Usuario bloqueado. Redirigiendo a /unauthorized");
            return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        const adminRoutes = ['/home', '/', '/proveedor'];
        const userRoutes = ['/home', '/'];

        const requestedPath = req.nextUrl.pathname;

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
    matcher: ['/', '/home', '/proveedor'],
};