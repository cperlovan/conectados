const { User } = require('../relations');

async function updateCredits() {
  try {
    const updates = [
      { email: 'paulac@correo.com', credit: 5000 },
      { email: 'juanapena@correo.com', credit: 3000 }
    ];

    console.log('Iniciando actualización de créditos...');

    for (const update of updates) {
      const result = await User.update(
        { credit_amount: update.credit },
        { where: { email: update.email } }
      );
      
      console.log(`Usuario ${update.email}: crédito actualizado a $${update.credit}`);
    }

    console.log('Actualización de créditos completada.');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateCredits(); 