// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const publicRoutes = [
  { path: "/api/auth/login", method: "POST" },
  { path: "/api/auth/register", method: "POST" },
  { path: "/api/condominium/register-with-admin", method: "POST" },
  { path: "api/unauthorized"}
];

const authenticateToken = (req, res, next) => {
  // console.log('\n=== Inicio de Autenticación ===');
  // Construir la ruta completa
  const fullPath = `/api${req.baseUrl}${req.path}`;
  // console.log('Ruta actual:', fullPath);
  // console.log('Método:', req.method);
 

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some((route) => {
    const regex = new RegExp(`^${route.path.replace(/:\w+/g, "[^/]+")}$`);
    const matches = regex.test(fullPath) && req.method === route.method;
    console.log(`Comprobando ruta ${fullPath} contra ${route.path}: ${matches}`);
    return matches;
  });

     
  console.log('¿Es ruta pública?:', isPublicRoute);

  if (isPublicRoute) {
    console.log('Ruta pública, continuando...');
    return next();
  }

  // Obtener el token de diferentes fuentes
  const authHeader = req.headers.authorization;
  console.log('Header de autorización presente:', !!authHeader);

  if (!authHeader) {
    console.log('No hay header de autorización');
    return res.status(401).json({ 
      message: "Acceso denegado. No hay header de autorización.",
    });
  }

  const token =
    (req.cookies && req.cookies.token) || // Primero buscar en cookies
    (authHeader && authHeader.split(" ")[1]); // Luego en header

  console.log('Token encontrado:', !!token);

  if (!token) {
    return res
      .status(401)
      .json({ 
        message: "Acceso denegado. Token no proporcionado.",
        debug: { 
          headers: req.headers,
          cookies: req.cookies 
        }
      });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado exitosamente');
    console.log('Datos del usuario:', {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      condominiumId: decoded.condominiumId,
      autorized: decoded.authorized,
      status: decoded.status
    });

    req.user = decoded;
    console.log('Usuario establecido en req.user:', req.user);
    console.log('=== Fin de Autenticación ===\n');
    next();
  } catch (err) {
    console.error('Error al verificar token:', err);
    return res.status(403).json({ message: "Token inválido." });
  }
};

module.exports = authenticateToken;