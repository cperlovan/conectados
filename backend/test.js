const express = require('express');
const app = express();
const sequelize = require('./config/database');
const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Budget = require('./models/Budget');
const EconomicActivity = require('./models/EconomicActivity');
const ContactInfo = require('./models/ContactInfo');

// Importar relaciones
require('./relations');

// Ruta de prueba
app.get('/test', async (req, res) => {
  try {
    // Intentar obtener un presupuesto con sus relaciones
    const budget = await Budget.findOne({
      include: [
        {
          model: Supplier,
          as: 'supplier',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: EconomicActivity,
          as: 'economicActivities',
          through: { attributes: [] }
        }
      ]
    });

    res.json(budget);
  } catch (error) {
    console.error('Error en la prueba:', error);
    res.status(500).json({ 
      message: 'Error en la prueba', 
      error: error.message 
    });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3041;
app.listen(PORT, () => {
  console.log(`Servidor de prueba ejecutándose en el puerto ${PORT}`);
}); 