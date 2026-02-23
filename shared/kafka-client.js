const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'fraud-detection-app',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  logLevel: logLevel.ERROR, // Para no saturar la consola
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

module.exports = kafka;