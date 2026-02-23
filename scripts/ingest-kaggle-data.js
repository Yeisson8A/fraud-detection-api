const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

const CSV_FILE_PATH = path.join(__dirname, '../data/creditcard.csv');
const API_URL = 'http://localhost:3000/v1/transactions';

// Configuración de la simulación
const BATCH_DELAY_MS = 100; // Enviar una transacción cada 100ms
const MAX_TRANSACTIONS = 1000; // Limitar para pruebas iniciales

async function ingestData() {
  console.log('🚀 Iniciando ingesta de datos desde Kaggle...');

  let count = 0;
  const stream = fs.createReadStream(CSV_FILE_PATH).pipe(csv());

  for await (const row of stream) {
    if (count >= MAX_TRANSACTIONS) break;

    // Mapear los datos del CSV al formato de nuestra API
    // El dataset tiene columnas: Time, V1...V28, Amount, Class
    const transaction = {
      userId: `user_${Math.floor(Math.random() * 100)}`, // Simulamos usuarios aleatorios
      amount: parseFloat(row.Amount),
      location: 'New York', // Dato estático para el ejemplo
      features: Object.keys(row)
        .filter(key => key.startsWith('V'))
        .map(key => parseFloat(row[key]))
    };

    try {
      await axios.post(API_URL, transaction);
      process.stdout.write(`\rTransacciones enviadas: ${count + 1}`);
    } catch (error) {
      console.error(`\n❌ Error enviando transacción ${count}:`, error.message);
    }

    // Delay para simular flujo en tiempo real
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    count++;
  }

  console.log('\n✅ Ingesta completada con éxito.');
}

// Verificar si el archivo existe antes de empezar
if (fs.existsSync(CSV_FILE_PATH)) {
  ingestData();
} else {
  console.error(`❌ Error: No se encontró el archivo en ${CSV_FILE_PATH}`);
}