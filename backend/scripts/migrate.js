const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('../config/database');

const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

(async () => {
  const command = process.argv[2];
  
  try {
    if (command === 'undo') {
      await umzug.down();
      console.log('Successfully reverted last migration');
    } else {
      await umzug.up();
      console.log('Successfully ran all pending migrations');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
})(); 