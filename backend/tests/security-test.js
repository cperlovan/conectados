const axios = require('axios');

async function testRateLimit() {
  console.log('\n=== Probando Rate Limit ===');
  const requests = [];
  const batchSize = 102; // Intentamos hacer más solicitudes que el límite (100)
  
  console.log(`Enviando ${batchSize} solicitudes...`);
  
  for (let i = 0; i < batchSize; i++) {
    requests.push(
      axios.get('http://localhost:3040/api/condominium/selector')
        .then(response => ({ success: true, status: response.status }))
        .catch(error => ({ success: false, status: error.response?.status }))
    );
  }

  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success).length;
  const limited = results.filter(r => !r.success && r.status === 429).length;

  console.log('Resultados del Rate Limit:');
  console.log(`✓ Solicitudes exitosas: ${successful}`);
  console.log(`✓ Solicitudes bloqueadas (429): ${limited}`);
  
  // Verificar que el rate limit está funcionando
  if (limited > 0) {
    console.log('✅ Rate limit funcionando correctamente');
  } else {
    console.log('❌ Rate limit no está funcionando como se esperaba');
  }
}

async function testCache() {
  console.log('\n=== Probando Cache ===');
  try {
    // Primera solicitud
    const response1 = await axios.get('http://localhost:3040/api/condominium/selector');
    const cacheControl1 = response1.headers['cache-control'];
    console.log('Cache-Control de primera solicitud:', cacheControl1);

    // Segunda solicitud inmediata
    const response2 = await axios.get('http://localhost:3040/api/condominium/selector');
    const cacheControl2 = response2.headers['cache-control'];
    console.log('Cache-Control de segunda solicitud:', cacheControl2);

    if (cacheControl1 && cacheControl1.includes('max-age=300')) {
      console.log('✅ Headers de caché configurados correctamente');
    } else {
      console.log('❌ Headers de caché no configurados correctamente');
    }
  } catch (error) {
    console.error('Error en prueba de caché:', error.message);
  }
}

async function testDataLimitation() {
  console.log('\n=== Probando Limitación de Datos ===');
  try {
    const response = await axios.get('http://localhost:3040/api/condominium/selector');
    const firstItem = response.data[0];
    
    const expectedFields = ['id', 'name', 'status', 'logo'];
    const actualFields = Object.keys(firstItem);
    
    console.log('Campos esperados:', expectedFields);
    console.log('Campos recibidos:', actualFields);
    
    const hasAllExpectedFields = expectedFields.every(field => actualFields.includes(field));
    const hasNoExtraFields = actualFields.every(field => expectedFields.includes(field));
    
    if (hasAllExpectedFields && hasNoExtraFields) {
      console.log('✅ Limitación de datos funcionando correctamente');
    } else {
      console.log('❌ Los campos devueltos no coinciden con los esperados');
    }
  } catch (error) {
    console.error('Error en prueba de limitación de datos:', error.message);
  }
}

async function testPrivateRoute() {
  console.log('\n=== Probando Ruta Privada ===');
  try {
    // Intentar acceder sin token
    await axios.get('http://localhost:3040/api/condominium');
    console.log('❌ La ruta debería requerir autenticación');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ La ruta correctamente requiere autenticación');
      console.log('Mensaje:', error.response.data.message);
    } else {
      console.log('❌ Error inesperado:', error.message);
    }
  }
}

async function runTests() {
  console.log('🔒 Iniciando pruebas de seguridad...\n');
  
  try {
    // Ejecutar pruebas secuencialmente
    await testDataLimitation();
    await testCache();
    await testPrivateRoute();
    await testRateLimit();
    
    console.log('\n✨ Pruebas completadas');
  } catch (error) {
    console.error('\n❌ Error general en las pruebas:', error.message);
  }
}

runTests(); 