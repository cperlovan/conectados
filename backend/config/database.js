const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  logging: false,
  host: process.env.DB_HOST,
  dialect: 'postgres', // Cambiar a 'postgres'
  port: process.env.DB_PORT || 5432, // Puerto predeterminado de PostgreSQL
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Opcional: si usas SSL
  },
});

module.exports = sequelize;