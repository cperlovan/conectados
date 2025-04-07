require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Agregar cookie-parser
const jwt = require("jsonwebtoken");
const authenticateToken = require('./middleware/authMiddleware');
const validateCondominiumId = require('./middleware/validateCondominiumId');
const superAdminRoutes = require('./routes/superAdminRoutes');
const budgetRoutes = require('./routes/budget');

// Inicializar Express
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-User-Role'
  ],
  exposedHeaders: [
    'Content-Length', 
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  credentials: true,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Middleware para parsear cookies y JSON
app.use(cookieParser()); // Agregar antes de las rutas
app.use(express.json({ strict: false }));

// Middleware de debug
app.use((req, res, next) => {
  console.log('=== Nueva petición ===');
  console.log('Método:', req.method);
  console.log('Ruta:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  // Limpiar el body para peticiones GET
  if (req.method === 'GET') {
    delete req.body;
  } else {
    console.log('Body:', req.body);
  }

  console.log('==================');
  next();
});

// Importar modelos
const User = require('./models/User');
const Condominium = require('./models/Condominium');
const Budget = require('./models/Budget');
const EconomicActivity = require('./models/EconomicActivity');

// Importar relaciones
require('./relations');

// Importar rutas
const authRoutes = require('./routes/auth');
const condominiumRoutes = require('./routes/condominium');
const userRoutes = require('./routes/user');
const propertyRoutes = require('./routes/property');
const receiptRoutes = require('./routes/receipt');
const paymentRoutes = require('./routes/payment');
const expenseRoutes = require('./routes/expense');
const economicActivityRoutes = require('./routes/economicActivity');
const supplierRoutes = require('./routes/supplier');
const bankAccountRoutes = require('./routes/bankAccount');
const reserveFundRoutes = require('./routes/reserveFund');
const reserveFundContributionRoutes = require('./routes/reserveFundContribution');
const reserveFundWithdrawalRoutes = require('./routes/reserveFundWithdrawal');
const invoiceRoutes = require('./routes/invoice');
const ownerRoutes = require('./routes/owner');

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);
app.use('/api/condominium', condominiumRoutes); // Cambiar a singular para que coincida con el frontend

// Rutas protegidas (con autenticación)
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/properties', authenticateToken, propertyRoutes);
app.use('/api/receipts', authenticateToken, receiptRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/economic-activities', authenticateToken, economicActivityRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bank-accounts', authenticateToken, bankAccountRoutes);
app.use('/api/reserve-funds', authenticateToken, reserveFundRoutes);
app.use('/api/reserve-fund-contributions', authenticateToken, reserveFundContributionRoutes);
app.use('/api/reserve-fund-withdrawals', authenticateToken, reserveFundWithdrawalRoutes);
app.use('/api/expenses', authenticateToken, expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/owners', ownerRoutes);

// Rutas
app.use('/api/superadmin', superAdminRoutes);

// Lista de rutas públicas
const publicRoutes = [
  "/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/condominium/register-with-admin",
];

// Puerto del servidor
const PORT = process.env.PORT || 3040;

// Sincronizar la base de datos y luego iniciar el servidor
// Usamos force: false y alter: false para evitar alteraciones no deseadas
sequelize.sync({ force: false, alter: false })
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente');
    // Iniciar el servidor después de sincronizar la base de datos
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error al conectar con la base de datos:', error);
  });

// Comentamos el inicio directo sin sincronización
// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en el puerto ${PORT}`);
//   console.log('IMPORTANTE: La sincronización automática ha sido desactivada temporalmente.');
//   console.log('Para actualizar la estructura de la base de datos, ejecute las migraciones manualmente.');
// });