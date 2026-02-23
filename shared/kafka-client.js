const path = require('path');
// Usamos path.resolve para asegurar que encuentre el .env en la raíz real del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Kafka } = require('kafkajs');

// Debug para confirmar qué está leyendo el contenedor (verás esto en los logs)
console.log(`[Kafka Client] Intentando conectar a: ${process.env.KAFKA_BROKERS}`);

const kafka = new Kafka({
  clientId: 'fraud-detection-app',
  // Si process.env.KAFKA_BROKERS es undefined, fallará hacia localhost
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

module.exports = kafka;