const express = require('express');


// Inicializar Express
const app = express();
app.use(express.json());

const authRoutes = require('./auth');
const condominiumRoutes = require('./condominium');
const userRoutes = require('./user');
const propertyRoutes = require('./property');
const receiptRoutes = require('./receipt');
const paymentRoutes = require('./payment');

app.use('/api/auth', authRoutes);
app.use('/api/condominiums', condominiumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/receipts', receiptRoutes)
app.use('/api/payments', paymentRoutes)