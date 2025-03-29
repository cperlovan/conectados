const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.json');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Inicializar Sequelize con la configuración
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
  }
);

// Definir el modelo User
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'copropietario', 'proveedor', 'ocupante'),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  movil: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  condominiumId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

async function createInitialSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = await User.create({
      name: 'Super',
      lastname: 'Admin',
      email: 'superadmin@sistema.com',
      password: hashedPassword,
      role: 'superadmin',
      status: 'active',
      nic: 'V-0000000',
      telephone: '0000-0000000',
      movil: '0414-0000000',
      address: 'Dirección Principal',
      condominiumId: null
    });

    console.log('Superadmin creado exitosamente:', superAdmin.email);
  } catch (error) {
    console.error('Error al crear superadmin:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

createInitialSuperAdmin(); 