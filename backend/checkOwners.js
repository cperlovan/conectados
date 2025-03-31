const { sequelize, Owner, Property, User } = require('./relations');

async function checkOwnersWithoutProperties() {
  try {
    // Obtener todos los usuarios con rol copropietario
    const users = await User.findAll({
      where: { role: 'copropietario' }
    });
    console.log(`Total de usuarios copropietarios: ${users.length}`);
    
    // Obtener todos los propietarios
    const owners = await Owner.findAll({
      include: [
        { model: Property, as: 'properties' },
        { model: User, as: 'user' }
      ]
    });
    console.log(`Total de propietarios: ${owners.length}`);
    
    // Propietarios sin propiedades
    const ownersWithoutProps = owners.filter(owner => 
      !owner.properties || owner.properties.length === 0
    );
    console.log(`Total de propietarios sin propiedades: ${ownersWithoutProps.length}`);
    
    console.log('Propietarios sin propiedades:');
    for (const owner of ownersWithoutProps) {
      console.log(`ID: ${owner.id}, Nombre: ${owner.fullName || 'N/A'}, UserID: ${owner.userId}, Email: ${owner.user?.email || 'N/A'}`);
    }
    
    // Usuarios copropietarios sin registro como propietario
    const userIds = owners.map(owner => owner.userId);
    const usersWithoutOwnerProfile = users.filter(user => !userIds.includes(user.id));
    console.log(`\nTotal de usuarios copropietarios sin perfil de propietario: ${usersWithoutOwnerProfile.length}`);
    
    console.log('Usuarios copropietarios sin perfil de propietario:');
    for (const user of usersWithoutOwnerProfile) {
      console.log(`ID: ${user.id}, Email: ${user.email}, Status: ${user.status}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOwnersWithoutProperties(); 